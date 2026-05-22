package com.chat_application.backend.controller;

import com.chat_application.backend.dto.*;
import com.chat_application.backend.model.User;
import com.chat_application.backend.service.ChatService;
import com.chat_application.backend.service.MediaService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@Controller
@AllArgsConstructor
@Slf4j
public class ChatController {

    private final ChatService  chatService;
    private final MediaService mediaService;

    // ═══════════════════════════════════════════════════════════════════════════
    // STOMP — real-time messaging
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Send a message.
     * Client → /app/chat.send
     * Delivered to each member's /user/queue/messages
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload SendMessageRequest req, Principal principal) {
        try {
            User user = extractUser(principal);
            chatService.sendMessage(user.getId(), req);
        } catch (Exception e) {
            log.error("WS send error: {}", e.getMessage());
        }
    }

    /**
     * Mark conversation as read.
     * Client → /app/chat.read  { conversationId: 5 }
     */
    @MessageMapping("/chat.read")
    public void markAsRead(@Payload Map<String, Long> payload, Principal principal) {
        try {
            User user = extractUser(principal);
            Long convId = payload.get("conversationId");
            if (convId != null) chatService.markAsRead(convId, user.getId());
        } catch (Exception e) {
            log.error("WS read error: {}", e.getMessage());
        }
    }

    /**
     * Typing indicator.
     * Client → /app/chat.typing  { conversationId: 5, typing: true }
     * Broadcast to /topic/conversation/{id}/typing
     */
    @MessageMapping("/chat.typing")
    public void typing(@Payload Map<String, Object> payload, Principal principal) {
        try {
            User user = extractUser(principal);
            Long convId = toLong(payload.get("conversationId"));
            boolean typing = Boolean.TRUE.equals(payload.get("typing"));
            if (convId != null) chatService.broadcastTyping(convId, user.getId(), typing);
        } catch (Exception e) {
            log.error("WS typing error: {}", e.getMessage());
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // REST — conversations
    // ═══════════════════════════════════════════════════════════════════════════

    /** GET /api/chat/conversations — list all conversations for current user */
    @GetMapping("/api/chat/conversations")
    @PreAuthorize("isAuthenticated()")
    @ResponseBody
    public ResponseEntity<List<ConversationDto>> getConversations(Principal principal) {
        System.out.println("🔵 [GET_CONVERSATIONS] Fetching conversations");
        User user = extractUser(principal);
        List<ConversationDto> conversations = chatService.getConversations(user.getId());
        System.out.println("✅ [GET_CONVERSATIONS] Found " + conversations.size() + " conversations");
        return ResponseEntity.ok(conversations);
    }

    /** POST /api/chat/conversations/direct — open or get a DM with another user */
    @PostMapping("/api/chat/conversations/direct")
    @PreAuthorize("isAuthenticated()")
    @ResponseBody
    public ResponseEntity<ConversationDto> openDirect(
            @RequestBody Map<String, Long> body, Principal principal) {
        System.out.println("🔵 [OPEN_DIRECT] Creating/opening direct conversation");
        User user = extractUser(principal);
        Long targetId = body.get("targetUserId");
        if (targetId == null) {
            System.out.println("❌ [OPEN_DIRECT] targetUserId is null");
            return ResponseEntity.badRequest().build();
        }
        ConversationDto conversation = chatService.getOrCreateDirectConversation(user.getId(), targetId);
        System.out.println("✅ [OPEN_DIRECT] Direct conversation created/opened with user: " + targetId);
        return ResponseEntity.ok(conversation);
    }

    /** POST /api/chat/conversations/group — create a group */
    @PostMapping("/api/chat/conversations/group")
    @PreAuthorize("isAuthenticated()")
    @ResponseBody
    public ResponseEntity<ConversationDto> createGroup(
            @Valid @RequestBody CreateGroupRequest req, Principal principal) {
        System.out.println("🔵 [CREATE_GROUP] Creating group: " + req.getName());
        User user = extractUser(principal);
        ConversationDto group = chatService.createGroup(user.getId(), req);
        System.out.println("✅ [CREATE_GROUP] Group created: " + group.getId());
        return ResponseEntity.ok(group);
    }

    /** PUT /api/chat/conversations/{id}/group — update group info */
    @PutMapping("/api/chat/conversations/{id}/group")
    @PreAuthorize("isAuthenticated()")
    @ResponseBody
    public ResponseEntity<ConversationDto> updateGroup(
            @PathVariable Long id,
            @RequestBody UpdateGroupRequest req,
            Principal principal) {
        System.out.println("🔵 [UPDATE_GROUP] Updating group: " + id);
        User user = extractUser(principal);
        ConversationDto group = chatService.updateGroup(id, user.getId(), req);
        System.out.println("✅ [UPDATE_GROUP] Group updated: " + id);
        return ResponseEntity.ok(group);
    }

    /** POST /api/chat/conversations/{id}/members/{memberId} — add member */
    @PostMapping("/api/chat/conversations/{id}/members/{memberId}")
    @PreAuthorize("isAuthenticated()")
    @ResponseBody
    public ResponseEntity<Void> addMember(
            @PathVariable Long id, @PathVariable Long memberId, Principal principal) {
        System.out.println("🔵 [ADD_MEMBER] Adding member " + memberId + " to conversation " + id);
        User user = extractUser(principal);
        chatService.addMember(id, user.getId(), memberId);
        System.out.println("✅ [ADD_MEMBER] Member added");
        return ResponseEntity.noContent().build();
    }

    /** DELETE /api/chat/conversations/{id}/members/{memberId} — remove member */
    @DeleteMapping("/api/chat/conversations/{id}/members/{memberId}")
    @PreAuthorize("isAuthenticated()")
    @ResponseBody
    public ResponseEntity<Void> removeMember(
            @PathVariable Long id, @PathVariable Long memberId, Principal principal) {
        System.out.println("🔵 [REMOVE_MEMBER] Removing member " + memberId + " from conversation " + id);
        User user = extractUser(principal);
        chatService.removeMember(id, user.getId(), memberId);
        System.out.println("✅ [REMOVE_MEMBER] Member removed");
        return ResponseEntity.noContent().build();
    }

    /** PUT /api/chat/conversations/{id}/mute — mute/unmute */
    @PutMapping("/api/chat/conversations/{id}/mute")
    @PreAuthorize("isAuthenticated()")
    @ResponseBody
    public ResponseEntity<Void> muteConversation(
            @PathVariable Long id,
            @RequestBody MuteRequest req,
            Principal principal) {
        System.out.println("🔵 [MUTE_CONVERSATION] Muting conversation " + id + ": " + (req.getMuteUntil() != null ? "until " + req.getMuteUntil() : "unmuting"));
        User user = extractUser(principal);
        chatService.muteConversation(id, user.getId(), req);
        System.out.println("✅ [MUTE_CONVERSATION] Conversation muted");
        return ResponseEntity.noContent().build();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // REST — messages
    // ═══════════════════════════════════════════════════════════════════════════

    /** GET /api/chat/conversations/{id}/messages?page=0&size=30 */
    @GetMapping("/api/chat/conversations/{id}/messages")
    @PreAuthorize("isAuthenticated()")
    @ResponseBody
    public ResponseEntity<PageResponse<MessageDto>> getMessages(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "30") int size,
            Principal principal) {
        System.out.println("🔵 [GET_MESSAGES] Fetching messages for conversation " + id + " (page: " + page + ", size: " + size + ")");
        User user = extractUser(principal);
        PageResponse<MessageDto> response = chatService.getMessages(id, user.getId(), page, size);
        System.out.println("✅ [GET_MESSAGES] Found " + response.getContent().size() + " messages");
        return ResponseEntity.ok(response);
    }

    /** POST /api/chat/messages — send via REST */
    @PostMapping("/api/chat/messages")
    @PreAuthorize("isAuthenticated()")
    @ResponseBody
    public ResponseEntity<MessageDto> sendMessageRest(
            @Valid @RequestBody SendMessageRequest req, Principal principal) {
        System.out.println("🔵 [SEND_MESSAGE] Sending message to conversation " + req.getConversationId());
        User user = extractUser(principal);
        MessageDto message = chatService.sendMessage(user.getId(), req);
        System.out.println("✅ [SEND_MESSAGE] Message sent: " + message.getId());
        return ResponseEntity.ok(message);
    }

    /** PUT /api/chat/messages/{id} — edit */
    @PutMapping("/api/chat/messages/{id}")
    @PreAuthorize("isAuthenticated()")
    @ResponseBody
    public ResponseEntity<MessageDto> editMessage(
            @PathVariable Long id,
            @Valid @RequestBody EditMessageRequest req,
            Principal principal) {
        System.out.println("🔵 [EDIT_MESSAGE] Editing message " + id);
        User user = extractUser(principal);
        MessageDto message = chatService.editMessage(id, user.getId(), req.getContent());
        System.out.println("✅ [EDIT_MESSAGE] Message edited: " + id);
        return ResponseEntity.ok(message);
    }

    /** DELETE /api/chat/messages/{id} — delete */
    @DeleteMapping("/api/chat/messages/{id}")
    @PreAuthorize("isAuthenticated()")
    @ResponseBody
    public ResponseEntity<Void> deleteMessage(@PathVariable Long id, Principal principal) {
        System.out.println("🔵 [DELETE_MESSAGE] Deleting message " + id);
        User user = extractUser(principal);
        chatService.deleteMessage(id, user.getId());
        System.out.println("✅ [DELETE_MESSAGE] Message deleted: " + id);
        return ResponseEntity.noContent().build();
    }

    /** PUT /api/chat/conversations/{id}/read — mark as read */
    @PutMapping("/api/chat/conversations/{id}/read")
    @PreAuthorize("isAuthenticated()")
    @ResponseBody
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, Principal principal) {
        System.out.println("🔵 [MARK_AS_READ] Marking conversation " + id + " as read");
        User user = extractUser(principal);
        chatService.markAsRead(id, user.getId());
        System.out.println("✅ [MARK_AS_READ] Conversation marked as read: " + id);
        return ResponseEntity.noContent().build();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // REST — reactions
    // ═══════════════════════════════════════════════════════════════════════════

    /** POST /api/chat/messages/{id}/reactions — toggle reaction */
    @PostMapping("/api/chat/messages/{id}/reactions")
    @PreAuthorize("isAuthenticated()")
    @ResponseBody
    public ResponseEntity<MessageDto> toggleReaction(
            @PathVariable Long id,
            @Valid @RequestBody ReactionRequest req,
            Principal principal) {
        System.out.println("🔵 [TOGGLE_REACTION] Adding reaction '" + req.getEmoji() + "' to message " + id);
        User user = extractUser(principal);
        MessageDto message = chatService.toggleReaction(id, user.getId(), req.getEmoji());
        System.out.println("✅ [TOGGLE_REACTION] Reaction added");
        return ResponseEntity.ok(message);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // REST — pinned messages
    // ═══════════════════════════════════════════════════════════════════════════

    /** GET /api/chat/conversations/{id}/pins */
    @GetMapping("/api/chat/conversations/{id}/pins")
    @PreAuthorize("isAuthenticated()")
    @ResponseBody
    public ResponseEntity<List<PinnedMessageDto>> getPins(
            @PathVariable Long id, Principal principal) {
        System.out.println("🔵 [GET_PINS] Fetching pinned messages for conversation " + id);
        User user = extractUser(principal);
        List<PinnedMessageDto> pins = chatService.getPinnedMessages(id, user.getId());
        System.out.println("✅ [GET_PINS] Found " + pins.size() + " pinned messages");
        return ResponseEntity.ok(pins);
    }

    /** POST /api/chat/messages/{id}/pin */
    @PostMapping("/api/chat/messages/{id}/pin")
    @PreAuthorize("isAuthenticated()")
    @ResponseBody
    public ResponseEntity<PinnedMessageDto> pinMessage(
            @PathVariable Long id, Principal principal) {
        System.out.println("🔵 [PIN_MESSAGE] Pinning message " + id);
        User user = extractUser(principal);
        PinnedMessageDto pin = chatService.pinMessage(id, user.getId());
        System.out.println("✅ [PIN_MESSAGE] Message pinned: " + id);
        return ResponseEntity.ok(pin);
    }

    /** DELETE /api/chat/messages/{id}/pin */
    @DeleteMapping("/api/chat/messages/{id}/pin")
    @PreAuthorize("isAuthenticated()")
    @ResponseBody
    public ResponseEntity<Void> unpinMessage(@PathVariable Long id, Principal principal) {
        System.out.println("🔵 [UNPIN_MESSAGE] Unpinning message " + id);
        User user = extractUser(principal);
        chatService.unpinMessage(id, user.getId());
        System.out.println("✅ [UNPIN_MESSAGE] Message unpinned: " + id);
        return ResponseEntity.noContent().build();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // REST — search
    // ═══════════════════════════════════════════════════════════════════════════

    /** GET /api/chat/conversations/{id}/search?q=hello&page=0&size=20 */
    @GetMapping("/api/chat/conversations/{id}/search")
    @PreAuthorize("isAuthenticated()")
    @ResponseBody
    public ResponseEntity<PageResponse<MessageDto>> searchInConversation(
            @PathVariable Long id,
            @RequestParam String q,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            Principal principal) {
        System.out.println("🔵 [SEARCH_CONVERSATION] Searching in conversation " + id + " for: '" + q + "'");
        User user = extractUser(principal);
        PageResponse<MessageDto> response = chatService.searchInConversation(id, user.getId(), q, page, size);
        System.out.println("✅ [SEARCH_CONVERSATION] Found " + response.getContent().size() + " results");
        return ResponseEntity.ok(response);
    }

    /** GET /api/chat/search?q=hello&page=0&size=20 — global search */
    @GetMapping("/api/chat/search")
    @PreAuthorize("isAuthenticated()")
    @ResponseBody
    public ResponseEntity<PageResponse<MessageDto>> searchGlobal(
            @RequestParam String q,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            Principal principal) {
        System.out.println("🔵 [SEARCH_GLOBAL] Global search for: '" + q + "'");
        User user = extractUser(principal);
        PageResponse<MessageDto> response = chatService.searchGlobal(user.getId(), q, page, size);
        System.out.println("✅ [SEARCH_GLOBAL] Found " + response.getContent().size() + " results");
        return ResponseEntity.ok(response);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // REST — media upload
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * POST /api/chat/media/upload
     * Upload a file; returns the URL to include in SendMessageRequest.mediaUrl.
     */
    @PostMapping("/api/chat/media/upload")
    @PreAuthorize("isAuthenticated()")
    @ResponseBody
    public ResponseEntity<MediaUploadResponse> uploadMedia(
            @RequestParam("file") MultipartFile file) {
        System.out.println("🔵 [UPLOAD_MEDIA] Uploading file: " + file.getOriginalFilename() + " (size: " + file.getSize() + " bytes)");
        try {
            MediaUploadResponse response = mediaService.store(file);
            System.out.println("✅ [UPLOAD_MEDIA] File uploaded: " + response.getUrl());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("❌ [UPLOAD_MEDIA] Error - " + e.getMessage());
            log.error("Media upload failed: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════════════════════════════

    private User extractUser(Principal principal) {
        return (User) ((Authentication) principal).getPrincipal();
    }

    private Long toLong(Object val) {
        if (val == null) return null;
        if (val instanceof Number n) return n.longValue();
        try { return Long.parseLong(val.toString()); } catch (NumberFormatException e) { return null; }
    }
}
