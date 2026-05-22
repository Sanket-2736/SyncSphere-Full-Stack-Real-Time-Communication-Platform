package com.chat_application.backend.service;

import com.chat_application.backend.dto.*;
import com.chat_application.backend.model.*;
import com.chat_application.backend.repository.*;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
@Service
@AllArgsConstructor
@Slf4j
@Transactional
public class ChatService {

    private final ConversationRepository       conversationRepository;
    private final ConversationMemberRepository memberRepository;
    private final MessageRepository            messageRepository;
    private final MessageReactionRepository    reactionRepository;
    private final PinnedMessageRepository      pinnedMessageRepository;
    private final UserRepository               userRepository;
    private final SimpMessagingTemplate        messagingTemplate;
    private final NotificationService          notificationService;

    // ═══════════════════════════════════════════════════════════════════════════
    // CONVERSATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /** Get or create a DIRECT conversation between two users. */
    public ConversationDto getOrCreateDirectConversation(Long requesterId, Long targetId) {
        User requester = findUser(requesterId);
        User target    = findUser(targetId);

        if (target.getBlockedUsers().contains(requester)) {
            throw new RuntimeException("Cannot start conversation: you are blocked by this user");
        }

        Conversation conv = conversationRepository
                .findDirectConversation(requester, target)
                .orElseGet(() -> createDirectConversation(requester, target));

        return toConversationDto(conv, requesterId);
    }

    private Conversation createDirectConversation(User a, User b) {
        Conversation conv = Conversation.builder()
                .type(ConversationType.DIRECT)
                .createdAt(LocalDateTime.now())
                .build();
        conv = conversationRepository.save(conv);

        memberRepository.save(ConversationMember.builder()
                .conversation(conv).user(a).role(GroupRole.MEMBER).build());
        memberRepository.save(ConversationMember.builder()
                .conversation(conv).user(b).role(GroupRole.MEMBER).build());

        return conv;
    }

    /** Create a GROUP conversation. */
    public ConversationDto createGroup(Long creatorId, CreateGroupRequest req) {
        User creator = findUser(creatorId);

        Conversation conv = Conversation.builder()
                .type(ConversationType.GROUP)
                .groupName(req.getName())
                .groupDescription(req.getDescription())
                .groupAvatarUrl(req.getAvatarUrl())
                .createdBy(creator)
                .createdAt(LocalDateTime.now())
                .build();
        conv = conversationRepository.save(conv);

        // Add creator as OWNER
        memberRepository.save(ConversationMember.builder()
                .conversation(conv).user(creator).role(GroupRole.OWNER).build());

        // Add initial members
        for (Long memberId : req.getMemberIds()) {
            if (!memberId.equals(creatorId)) {
                User member = findUser(memberId);
                memberRepository.save(ConversationMember.builder()
                        .conversation(conv).user(member).role(GroupRole.MEMBER).build());
            }
        }

        // System message
        sendSystemMessage(conv, creator.getUsername() + " created the group");

        log.info("Group '{}' created by {}", req.getName(), creator.getUsername());
        return toConversationDto(conv, creatorId);
    }

    /** Update group metadata (name, description, avatar). */
    public ConversationDto updateGroup(Long conversationId, Long userId, UpdateGroupRequest req) {
        Conversation conv = findConversation(conversationId);
        requireGroupAdminOrOwner(conv, userId);

        if (req.getName()        != null) conv.setGroupName(req.getName());
        if (req.getDescription() != null) conv.setGroupDescription(req.getDescription());
        if (req.getAvatarUrl()   != null) conv.setGroupAvatarUrl(req.getAvatarUrl());

        conv = conversationRepository.save(conv);
        broadcastConversationUpdate(conv);
        return toConversationDto(conv, userId);
    }

    /** Add a member to a group. */
    public void addMember(Long conversationId, Long requesterId, Long newMemberId) {
        Conversation conv = findConversation(conversationId);
        requireGroup(conv);
        requireGroupAdminOrOwner(conv, requesterId);

        if (memberRepository.existsByConversationAndUserAndLeftAtIsNull(conv, findUser(newMemberId))) {
            throw new RuntimeException("User is already a member");
        }

        User newMember = findUser(newMemberId);
        memberRepository.save(ConversationMember.builder()
                .conversation(conv).user(newMember).role(GroupRole.MEMBER).build());

        User requester = findUser(requesterId);
        sendSystemMessage(conv, requester.getUsername() + " added " + newMember.getUsername());
        
        // Send notification to the added user
        notificationService.notifyGroupAdded(newMember, requester, conv);
        
        broadcastMemberUpdate(conv);
    }

    /** Remove a member from a group (or member leaves themselves). */
    public void removeMember(Long conversationId, Long requesterId, Long targetMemberId) {
        Conversation conv = findConversation(conversationId);
        requireGroup(conv);

        boolean isSelf = requesterId.equals(targetMemberId);
        if (!isSelf) requireGroupAdminOrOwner(conv, requesterId);

        ConversationMember cm = memberRepository
                .findByConversationAndUser(conv, findUser(targetMemberId))
                .orElseThrow(() -> new RuntimeException("Member not found"));

        cm.setLeftAt(LocalDateTime.now());
        memberRepository.save(cm);

        User target    = findUser(targetMemberId);
        User requester = findUser(requesterId);
        String msg = isSelf
                ? target.getUsername() + " left the group"
                : requester.getUsername() + " removed " + target.getUsername();
        sendSystemMessage(conv, msg);
        
        // Send notification to the removed user (only if they were removed by someone else)
        if (!isSelf) {
            notificationService.notifyGroupRemoved(target, requester, conv);
        }
        
        broadcastMemberUpdate(conv);
    }

    /** Get all conversations for a user. */
    @Transactional(readOnly = true)
    public List<ConversationDto> getConversations(Long userId) {
        User user = findUser(userId);
        return conversationRepository.findAllByMember(user).stream()
                .map(c -> toConversationDto(c, userId))
                .collect(Collectors.toList());
    }

    /** Mute or unmute a conversation for a user. */
    public void muteConversation(Long conversationId, Long userId, MuteRequest req) {
        Conversation conv = findConversation(conversationId);
        ConversationMember cm = findMember(conv, userId);
        cm.setMutedUntil(req.getMuteUntil());
        memberRepository.save(cm);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MESSAGES — SEND
    // ═══════════════════════════════════════════════════════════════════════════

    /** Send a message (text, media, or reply). Delivers in real-time via WebSocket. */
    public MessageDto sendMessage(Long senderId, SendMessageRequest req) {
        User sender = findUser(senderId);
        Conversation conv = findConversation(req.getConversationId());
        requireActiveMember(conv, senderId);

        // Validate content
        boolean hasText  = req.getContent()  != null && !req.getContent().isBlank();
        boolean hasMedia = req.getMediaUrl() != null && !req.getMediaUrl().isBlank();
        if (!hasText && !hasMedia) {
            throw new RuntimeException("Message must have content or media");
        }

        // Resolve reply
        Message replyTo = null;
        if (req.getReplyToId() != null) {
            replyTo = messageRepository.findById(req.getReplyToId())
                    .orElseThrow(() -> new RuntimeException("Replied-to message not found"));
            if (!replyTo.getConversation().getId().equals(conv.getId())) {
                throw new RuntimeException("Reply target is in a different conversation");
            }
        }

        MessageType type = hasMedia
                ? (req.getMediaType() != null && req.getMediaType().startsWith("image") ? MessageType.IMAGE : MessageType.FILE)
                : MessageType.TEXT;

        Message message = Message.builder()
                .conversation(conv)
                .sender(sender)
                .type(type)
                .content(hasText ? req.getContent() : null)
                .mediaUrl(req.getMediaUrl())
                .mediaType(req.getMediaType())
                .mediaFileName(req.getMediaFileName())
                .mediaSize(req.getMediaSize())
                .replyTo(replyTo)
                .status(MessageStatus.SENT)
                .sentAt(LocalDateTime.now())
                .build();

        message = messageRepository.save(message);

        conv.setLastMessageAt(message.getSentAt());
        conversationRepository.save(conv);

        MessageDto dto = toMessageDto(message);

        // Deliver to all active members except sender.
        // If the recipient is currently connected (online), flip status to DELIVERED.
        List<ConversationMember> activeMembers = memberRepository.findActiveMembers(conv);
        boolean isGroupMessage = conv.getType() == ConversationType.GROUP;
        
        for (ConversationMember cm : activeMembers) {
            if (cm.getUser().getId().equals(sender.getId())) continue;

            // Mark as DELIVERED if the recipient is online
            if (cm.getUser().getStatus() == UserStatus.ONLINE) {
                message.setStatus(MessageStatus.DELIVERED);
                message = messageRepository.save(message);
                dto = toMessageDto(message);
            }

            // Send real-time message via WebSocket
            messagingTemplate.convertAndSendToUser(
                    cm.getUser().getUsername(), "/queue/messages", dto);
            
            // Send notification if user is not muted for this conversation
            if (!cm.isMuted()) {
                notificationService.notifyNewMessage(message, cm.getUser(), isGroupMessage);
            }
        }

        log.info("Message {} sent in conversation {} by {}", message.getId(), conv.getId(), sender.getUsername());
        return dto;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MESSAGES — EDIT / DELETE
    // ═══════════════════════════════════════════════════════════════════════════

    public MessageDto editMessage(Long messageId, Long userId, String newContent) {
        Message message = findMessage(messageId);
        requireMessageOwner(message, userId);

        if (message.getDeleted()) throw new RuntimeException("Cannot edit a deleted message");
        if (message.getType() != MessageType.TEXT) throw new RuntimeException("Only text messages can be edited");

        message.setContent(newContent);
        message.setEditedAt(LocalDateTime.now());
        message = messageRepository.save(message);

        MessageDto dto = toMessageDto(message);
        broadcastToConversation(message.getConversation(), "/queue/message-edited", dto);
        return dto;
    }

    public void deleteMessage(Long messageId, Long userId) {
        Message message = findMessage(messageId);
        Conversation conv = message.getConversation();

        // Owner can delete any message; sender can delete their own
        boolean isOwner = isGroupOwnerOrAdmin(conv, userId);
        if (!message.getSender().getId().equals(userId) && !isOwner) {
            throw new RuntimeException("Not authorized to delete this message");
        }

        message.setDeleted(true);
        message.setContent("[This message was deleted]");
        messageRepository.save(message);

        broadcastToConversation(conv, "/queue/message-deleted",
                Map.of("messageId", messageId, "conversationId", conv.getId()));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MESSAGES — READ RECEIPTS
    // ═══════════════════════════════════════════════════════════════════════════

    public void markAsRead(Long conversationId, Long userId) {
        Conversation conv = findConversation(conversationId);
        requireActiveMember(conv, userId);

        // Promote SENT → DELIVERED → READ in one pass
        messageRepository.markMessagesAsDelivered(conv, userId);
        int updated = messageRepository.markMessagesAsRead(conv, userId);
        if (updated == 0) return;

        User reader = findUser(userId);
        Map<String, Object> receipt = Map.of(
                "conversationId", conversationId,
                "readBy", userId,
                "readerUsername", reader.getUsername(),
                "readAt", LocalDateTime.now().toString()
        );
        broadcastToConversation(conv, "/queue/read-receipts", receipt);
        log.debug("Marked {} messages as read in conv {} for user {}", updated, conversationId, userId);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MESSAGES — HISTORY & SEARCH
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public PageResponse<MessageDto> getMessages(Long conversationId, Long userId, int page, int size) {
        Conversation conv = findConversation(conversationId);
        requireActiveMember(conv, userId);

        Page<Message> messagePage = messageRepository
                .findByConversationOrderBySentAtDesc(conv, PageRequest.of(page, size));

        List<MessageDto> content = messagePage.getContent().stream()
                .sorted(Comparator.comparing(Message::getSentAt))
                .map(this::toMessageDto)
                .collect(Collectors.toList());

        return PageResponse.<MessageDto>builder()
                .content(content)
                .currentPage(page)
                .totalPages(messagePage.getTotalPages())
                .totalElements(messagePage.getTotalElements())
                .pageSize(size)
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<MessageDto> searchInConversation(Long conversationId, Long userId, String query, int page, int size) {
        Conversation conv = findConversation(conversationId);
        requireActiveMember(conv, userId);

        Page<Message> messagePage = messageRepository
                .searchInConversation(conv, query, PageRequest.of(page, size));

        List<MessageDto> content = messagePage.getContent().stream()
                .map(this::toMessageDto)
                .collect(Collectors.toList());

        return PageResponse.<MessageDto>builder()
                .content(content)
                .currentPage(page)
                .totalPages(messagePage.getTotalPages())
                .totalElements(messagePage.getTotalElements())
                .pageSize(size)
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<MessageDto> searchGlobal(Long userId, String query, int page, int size) {
        Page<Message> messagePage = messageRepository
                .searchGlobal(userId, query, PageRequest.of(page, size));

        List<MessageDto> content = messagePage.getContent().stream()
                .map(this::toMessageDto)
                .collect(Collectors.toList());

        return PageResponse.<MessageDto>builder()
                .content(content)
                .currentPage(page)
                .totalPages(messagePage.getTotalPages())
                .totalElements(messagePage.getTotalElements())
                .pageSize(size)
                .build();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // REACTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    public MessageDto toggleReaction(Long messageId, Long userId, String emoji) {
        Message message = findMessage(messageId);
        requireActiveMember(message.getConversation(), userId);
        User user = findUser(userId);

        Optional<MessageReaction> existing =
                reactionRepository.findByMessageAndUserAndEmoji(message, user, emoji);

        if (existing.isPresent()) {
            reactionRepository.delete(existing.get());
        } else {
            reactionRepository.save(MessageReaction.builder()
                    .message(message).user(user).emoji(emoji).build());
        }

        // Reload to get fresh reactions
        message = findMessage(messageId);
        MessageDto dto = toMessageDto(message);
        broadcastToConversation(message.getConversation(), "/queue/reactions", dto);
        return dto;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PINNED MESSAGES
    // ═══════════════════════════════════════════════════════════════════════════

    public PinnedMessageDto pinMessage(Long messageId, Long userId) {
        Message message = findMessage(messageId);
        Conversation conv = message.getConversation();
        requireActiveMember(conv, userId);

        if (pinnedMessageRepository.existsByConversationAndMessage(conv, message)) {
            throw new RuntimeException("Message is already pinned");
        }

        User pinnedBy = findUser(userId);
        PinnedMessage pin = pinnedMessageRepository.save(PinnedMessage.builder()
                .conversation(conv)
                .message(message)
                .pinnedBy(pinnedBy)
                .build());

        PinnedMessageDto dto = toPinnedMessageDto(pin);
        broadcastToConversation(conv, "/queue/pinned", dto);
        return dto;
    }

    public void unpinMessage(Long messageId, Long userId) {
        Message message = findMessage(messageId);
        Conversation conv = message.getConversation();
        requireActiveMember(conv, userId);

        PinnedMessage pin = pinnedMessageRepository
                .findByConversationAndMessage(conv, message)
                .orElseThrow(() -> new RuntimeException("Message is not pinned"));

        pinnedMessageRepository.delete(pin);
        broadcastToConversation(conv, "/queue/unpinned",
                Map.of("messageId", messageId, "conversationId", conv.getId()));
    }

    @Transactional(readOnly = true)
    public List<PinnedMessageDto> getPinnedMessages(Long conversationId, Long userId) {
        Conversation conv = findConversation(conversationId);
        requireActiveMember(conv, userId);

        return pinnedMessageRepository
                .findByConversationOrderByPinnedAtDesc(conv).stream()
                .map(this::toPinnedMessageDto)
                .collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TYPING INDICATOR
    // ═══════════════════════════════════════════════════════════════════════════

    public void broadcastTyping(Long conversationId, Long userId, boolean typing) {
        Conversation conv = findConversation(conversationId);
        requireActiveMember(conv, userId);
        User user = findUser(userId);

        TypingEvent event = TypingEvent.builder()
                .conversationId(conversationId)
                .userId(userId)
                .username(user.getUsername())
                .typing(typing)
                .build();

        // Broadcast to the conversation topic (all members subscribe to this)
        messagingTemplate.convertAndSend(
                "/topic/conversation/" + conversationId + "/typing", event);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MAPPING HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    public MessageDto toMessageDto(Message m) {
        // Build reaction maps
        Map<String, Long>         reactionCounts = new LinkedHashMap<>();
        Map<String, List<String>> reactionUsers  = new LinkedHashMap<>();

        for (MessageReaction r : m.getReactions()) {
            reactionCounts.merge(r.getEmoji(), 1L, Long::sum);
            reactionUsers.computeIfAbsent(r.getEmoji(), k -> new ArrayList<>())
                         .add(r.getUser().getUsername());
        }

        // Reply snippet
        Long   replyToId              = null;
        String replyToContent         = null;
        String replyToSenderUsername  = null;
        if (m.getReplyTo() != null) {
            Message rt = m.getReplyTo();
            replyToId             = rt.getId();
            replyToContent        = rt.getDeleted()
                    ? "[deleted]"
                    : (rt.getContent() != null
                            ? rt.getContent().substring(0, Math.min(rt.getContent().length(), 80))
                            : "[media]");
            replyToSenderUsername = rt.getSender().getUsername();
        }

        return MessageDto.builder()
                .id(m.getId())
                .conversationId(m.getConversation().getId())
                .senderId(m.getSender().getId())
                .senderUsername(m.getSender().getUsername())
                .senderAvatarUrl(m.getSender().getAvatarUrl())
                .type(m.getType().name())
                .content(m.getDeleted() ? "[This message was deleted]" : m.getContent())
                .deleted(m.getDeleted())
                .mediaUrl(m.getDeleted() ? null : m.getMediaUrl())
                .mediaType(m.getMediaType())
                .mediaFileName(m.getMediaFileName())
                .mediaSize(m.getMediaSize())
                .replyToId(replyToId)
                .replyToContent(replyToContent)
                .replyToSenderUsername(replyToSenderUsername)
                .status(m.getStatus().name())
                .sentAt(m.getSentAt())
                .editedAt(m.getEditedAt())
                .readAt(m.getReadAt())
                .reactions(reactionCounts)
                .reactionUsers(reactionUsers)
                .build();
    }

    public ConversationDto toConversationDto(Conversation conv, Long currentUserId) {
        List<ConversationMember> activeMembers = memberRepository.findActiveMembers(conv);

        // Unread count
        long unread = messageRepository.countUnreadMessages(conv, currentUserId);

        // Last message
        Page<Message> lastPage = messageRepository
                .findByConversationOrderBySentAtDesc(conv, PageRequest.of(0, 1));
        MessageDto lastMessage = lastPage.isEmpty() ? null : toMessageDto(lastPage.getContent().get(0));

        // Mute state for current user
        boolean muted = activeMembers.stream()
                .filter(cm -> cm.getUser().getId().equals(currentUserId))
                .findFirst()
                .map(ConversationMember::isMuted)
                .orElse(false);

        ConversationDto.ConversationDtoBuilder builder = ConversationDto.builder()
                .id(conv.getId())
                .type(conv.getType().name())
                .lastMessage(lastMessage)
                .unreadCount(unread)
                .muted(muted)
                .lastMessageAt(conv.getLastMessageAt())
                .createdAt(conv.getCreatedAt());

        if (conv.getType() == ConversationType.DIRECT) {
            // Find the other participant
            activeMembers.stream()
                    .filter(cm -> !cm.getUser().getId().equals(currentUserId))
                    .findFirst()
                    .ifPresent(cm -> {
                        User other = cm.getUser();
                        builder.otherUserId(other.getId())
                               .otherUsername(other.getUsername())
                               .otherUserAvatarUrl(other.getAvatarUrl())
                               .otherUserStatus(other.getStatus().name());
                    });
        } else {
            List<MemberDto> memberDtos = activeMembers.stream()
                    .map(this::toMemberDto)
                    .collect(Collectors.toList());
            builder.groupName(conv.getGroupName())
                   .groupDescription(conv.getGroupDescription())
                   .groupAvatarUrl(conv.getGroupAvatarUrl())
                   .members(memberDtos);
        }

        return builder.build();
    }

    private MemberDto toMemberDto(ConversationMember cm) {
        User u = cm.getUser();
        return MemberDto.builder()
                .userId(u.getId())
                .username(u.getUsername())
                .avatarUrl(u.getAvatarUrl())
                .status(u.getStatus().name())
                .role(cm.getRole().name())
                .muted(cm.isMuted())
                .joinedAt(cm.getJoinedAt())
                .build();
    }

    private PinnedMessageDto toPinnedMessageDto(PinnedMessage pin) {
        return PinnedMessageDto.builder()
                .id(pin.getId())
                .conversationId(pin.getConversation().getId())
                .message(toMessageDto(pin.getMessage()))
                .pinnedById(pin.getPinnedBy().getId())
                .pinnedByUsername(pin.getPinnedBy().getUsername())
                .pinnedAt(pin.getPinnedAt())
                .build();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PRIVATE UTILITIES
    // ═══════════════════════════════════════════════════════════════════════════

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
    }

    private Conversation findConversation(Long id) {
        return conversationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Conversation not found: " + id));
    }

    private Message findMessage(Long id) {
        return messageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Message not found: " + id));
    }

    private ConversationMember findMember(Conversation conv, Long userId) {
        return memberRepository.findByConversationAndUser(conv, findUser(userId))
                .orElseThrow(() -> new RuntimeException("Not a member of this conversation"));
    }

    private void requireActiveMember(Conversation conv, Long userId) {
        ConversationMember cm = findMember(conv, userId);
        if (cm.hasLeft()) throw new RuntimeException("You have left this conversation");
    }

    private void requireGroup(Conversation conv) {
        if (conv.getType() != ConversationType.GROUP) {
            throw new RuntimeException("This operation is only valid for group conversations");
        }
    }

    private void requireGroupAdminOrOwner(Conversation conv, Long userId) {
        requireGroup(conv);
        ConversationMember cm = findMember(conv, userId);
        if (cm.getRole() == GroupRole.MEMBER) {
            throw new RuntimeException("Only admins or the owner can perform this action");
        }
    }

    private boolean isGroupOwnerOrAdmin(Conversation conv, Long userId) {
        return memberRepository.findByConversationAndUser(conv, findUser(userId))
                .map(cm -> cm.getRole() == GroupRole.OWNER || cm.getRole() == GroupRole.ADMIN)
                .orElse(false);
    }

    private void requireMessageOwner(Message message, Long userId) {
        if (!message.getSender().getId().equals(userId)) {
            throw new RuntimeException("You can only modify your own messages");
        }
    }

    /** Deliver a payload to all active members of a conversation except the sender. */
    private void deliverToMembers(Conversation conv, User sender, String destination, Object payload) {
        memberRepository.findActiveMembers(conv).stream()
                .filter(cm -> !cm.getUser().getId().equals(sender.getId()))
                .forEach(cm -> messagingTemplate.convertAndSendToUser(
                        cm.getUser().getUsername(), destination, payload));
    }

    /** Broadcast to ALL active members of a conversation (including sender). */
    private void broadcastToConversation(Conversation conv, String destination, Object payload) {
        memberRepository.findActiveMembers(conv)
                .forEach(cm -> messagingTemplate.convertAndSendToUser(
                        cm.getUser().getUsername(), destination, payload));
    }

    private void broadcastConversationUpdate(Conversation conv) {
        memberRepository.findActiveMembers(conv)
                .forEach(cm -> {
                    ConversationDto dto = toConversationDto(conv, cm.getUser().getId());
                    messagingTemplate.convertAndSendToUser(
                            cm.getUser().getUsername(), "/queue/conversation-updated", dto);
                });
    }

    private void broadcastMemberUpdate(Conversation conv) {
        broadcastConversationUpdate(conv);
    }

    private void sendSystemMessage(Conversation conv, String text) {
        // Use the group creator as the system sender, or first member
        User systemUser = conv.getCreatedBy() != null
                ? conv.getCreatedBy()
                : memberRepository.findActiveMembers(conv).get(0).getUser();

        Message msg = Message.builder()
                .conversation(conv)
                .sender(systemUser)
                .type(MessageType.SYSTEM)
                .content(text)
                .status(MessageStatus.READ)
                .sentAt(LocalDateTime.now())
                .build();
        messageRepository.save(msg);

        conv.setLastMessageAt(msg.getSentAt());
        conversationRepository.save(conv);

        MessageDto dto = toMessageDto(msg);
        broadcastToConversation(conv, "/queue/messages", dto);
    }
}
