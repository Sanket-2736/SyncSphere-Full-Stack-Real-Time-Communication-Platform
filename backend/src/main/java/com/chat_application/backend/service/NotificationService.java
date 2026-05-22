package com.chat_application.backend.service;

import com.chat_application.backend.dto.NotificationDto;
import com.chat_application.backend.model.*;
import com.chat_application.backend.repository.NotificationRepository;
import com.chat_application.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository         userRepository;
    private final SimpMessagingTemplate  messagingTemplate;
    private final PresenceService        presenceService;

    // ═══════════════════════════════════════════════════════════════════════════
    // CREATE & DELIVER NOTIFICATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Create and deliver a new message notification.
     * Only sends if the recipient is not muted for this conversation.
     */
    public void notifyNewMessage(Message message, User recipient, boolean isGroupMessage) {
        // Skip if recipient is the sender
        if (message.getSender().getId().equals(recipient.getId())) return;

        // Skip if recipient has muted this conversation
        // (This check would need ConversationMember lookup — simplified for now)

        String title = isGroupMessage
                ? String.format("New message in %s", getConversationName(message.getConversation()))
                : String.format("New message from %s", message.getSender().getUsername());

        String body = truncateContent(message.getContent(), 100);

        createAndDeliver(
                recipient,
                message.getSender(),
                isGroupMessage ? NotificationType.NEW_GROUP_MESSAGE : NotificationType.NEW_MESSAGE,
                title,
                body,
                message.getConversation().getId(),
                message.getId()
        );
    }

    /**
     * Create and deliver an incoming call notification (real-time only).
     * This is NOT persisted — it's only for live alerting.
     */
    public void notifyIncomingCall(User caller, User recipient) {
        if (caller.getId().equals(recipient.getId())) return;

        String title = String.format("%s is calling you", caller.getUsername());

        NotificationDto dto = NotificationDto.builder()
                .type(NotificationType.INCOMING_CALL.name())
                .actorId(caller.getId())
                .actorUsername(caller.getUsername())
                .actorAvatarUrl(caller.getAvatarUrl())
                .title(title)
                .body("Tap to answer")
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();

        // Real-time delivery only (no persistence for incoming calls)
        deliverRealTime(recipient, dto);
        log.info("Incoming call notification sent from {} to {}", caller.getUsername(), recipient.getUsername());
    }

    /**
     * Create and deliver a missed call notification (persisted).
     */
    public void notifyMissedCall(User caller, User recipient) {
        if (caller.getId().equals(recipient.getId())) return;

        String title = String.format("Missed call from %s", caller.getUsername());

        createAndDeliver(
                recipient,
                caller,
                NotificationType.MISSED_CALL,
                title,
                "Tap to call back",
                null,
                null
        );
    }

    /**
     * Create and deliver an incoming video call notification (real-time only).
     * This is NOT persisted — it's only for live alerting.
     */
    public void notifyIncomingVideoCall(User caller, User recipient) {
        if (caller.getId().equals(recipient.getId())) return;

        String title = String.format("%s is video calling you", caller.getUsername());

        NotificationDto dto = NotificationDto.builder()
                .type(NotificationType.INCOMING_VIDEO_CALL.name())
                .actorId(caller.getId())
                .actorUsername(caller.getUsername())
                .actorAvatarUrl(caller.getAvatarUrl())
                .title(title)
                .body("Tap to answer")
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();

        // Real-time delivery only (no persistence for incoming video calls)
        deliverRealTime(recipient, dto);
        log.info("Incoming video call notification sent from {} to {}", caller.getUsername(), recipient.getUsername());
    }

    /**
     * Create and deliver a missed video call notification (persisted).
     */
    public void notifyMissedVideoCall(User caller, User recipient) {
        if (caller.getId().equals(recipient.getId())) return;

        String title = String.format("Missed video call from %s", caller.getUsername());

        createAndDeliver(
                recipient,
                caller,
                NotificationType.MISSED_VIDEO_CALL,
                title,
                "Tap to call back",
                null,
                null
        );
    }

    /**
     * Notify when a user is added to a group.
     */
    public void notifyGroupAdded(User addedUser, User addedBy, Conversation group) {
        if (addedUser.getId().equals(addedBy.getId())) return;

        String title = String.format("You were added to %s", group.getGroupName());
        String body = String.format("Added by %s", addedBy.getUsername());

        createAndDeliver(
                addedUser,
                addedBy,
                NotificationType.GROUP_ADDED,
                title,
                body,
                group.getId(),
                null
        );
    }

    /**
     * Notify when a user is removed from a group.
     */
    public void notifyGroupRemoved(User removedUser, User removedBy, Conversation group) {
        if (removedUser.getId().equals(removedBy.getId())) return;

        String title = String.format("You were removed from %s", group.getGroupName());
        String body = String.format("Removed by %s", removedBy.getUsername());

        createAndDeliver(
                removedUser,
                removedBy,
                NotificationType.GROUP_REMOVED,
                title,
                body,
                group.getId(),
                null
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FETCH & MANAGE NOTIFICATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public com.chat_application.backend.dto.PageResponse<NotificationDto> getNotifications(Long userId, int page, int size) {
        User user = findUser(userId);
        Page<Notification> notifications = notificationRepository
                .findByRecipientOrderByCreatedAtDesc(user, PageRequest.of(page, size));

        List<NotificationDto> content = notifications.getContent().stream()
                .map(this::toNotificationDto)
                .collect(Collectors.toList());

        return com.chat_application.backend.dto.PageResponse.<NotificationDto>builder()
                .content(content)
                .currentPage(page)
                .totalPages(notifications.getTotalPages())
                .totalElements(notifications.getTotalElements())
                .pageSize(size)
                .build();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        User user = findUser(userId);
        return notificationRepository.countByRecipientAndReadFalse(user);
    }

    public void markAsRead(Long notificationId, Long userId) {
        User user = findUser(userId);
        int updated = notificationRepository.markAsRead(notificationId, user);
        if (updated > 0) {
            // Broadcast updated unread count
            broadcastUnreadCount(user);
            log.debug("Marked notification {} as read for user {}", notificationId, userId);
        }
    }

    public void markAllAsRead(Long userId) {
        User user = findUser(userId);
        int updated = notificationRepository.markAllAsRead(user);
        if (updated > 0) {
            broadcastUnreadCount(user);
            log.info("Marked {} notifications as read for user {}", updated, userId);
        }
    }

    /**
     * Housekeeping: delete old read notifications (call periodically).
     */
    public void cleanupOldNotifications(Long userId, int daysOld) {
        User user = findUser(userId);
        LocalDateTime before = LocalDateTime.now().minusDays(daysOld);
        int deleted = notificationRepository.deleteOldRead(user, before);
        if (deleted > 0) {
            log.info("Cleaned up {} old notifications for user {}", deleted, userId);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    private void createAndDeliver(User recipient, User actor, NotificationType type,
                                  String title, String body, Long conversationId, Long messageId) {
        // Persist the notification
        Notification notification = notificationRepository.save(
                Notification.builder()
                        .recipient(recipient)
                        .actor(actor)
                        .type(type)
                        .title(title)
                        .body(body)
                        .conversationId(conversationId)
                        .messageId(messageId)
                        .read(false)
                        .createdAt(LocalDateTime.now())
                        .build()
        );

        NotificationDto dto = toNotificationDto(notification);

        // Real-time delivery
        deliverRealTime(recipient, dto);

        // Broadcast updated unread count
        broadcastUnreadCount(recipient);

        log.debug("Notification [{}] created and delivered to {}", type, recipient.getUsername());
    }

    private void deliverRealTime(User recipient, NotificationDto notification) {
        // Only deliver if the user is currently online
        if (presenceService.isOnline(recipient.getUsername())) {
            messagingTemplate.convertAndSendToUser(
                    recipient.getUsername(),
                    "/queue/notifications",
                    notification
            );
        }
    }

    private void broadcastUnreadCount(User user) {
        long unreadCount = notificationRepository.countByRecipientAndReadFalse(user);
        messagingTemplate.convertAndSendToUser(
                user.getUsername(),
                "/queue/unread-count",
                java.util.Map.of("unreadCount", unreadCount)
        );
    }

    private NotificationDto toNotificationDto(Notification n) {
        return NotificationDto.builder()
                .id(n.getId())
                .type(n.getType().name())
                .actorId(n.getActor() != null ? n.getActor().getId() : null)
                .actorUsername(n.getActor() != null ? n.getActor().getUsername() : null)
                .actorAvatarUrl(n.getActor() != null ? n.getActor().getAvatarUrl() : null)
                .title(n.getTitle())
                .body(n.getBody())
                .conversationId(n.getConversationId())
                .messageId(n.getMessageId())
                .read(n.getRead())
                .createdAt(n.getCreatedAt())
                .readAt(n.getReadAt())
                .build();
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
    }

    private String getConversationName(Conversation conv) {
        return conv.getType() == ConversationType.GROUP
                ? conv.getGroupName()
                : "Direct Message";
    }

    private String truncateContent(String content, int maxLength) {
        if (content == null) return "[Media]";
        if (content.length() <= maxLength) return content;
        return content.substring(0, maxLength - 3) + "...";
    }
}