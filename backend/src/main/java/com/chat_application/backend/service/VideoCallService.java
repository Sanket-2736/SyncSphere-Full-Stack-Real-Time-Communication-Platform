package com.chat_application.backend.service;

import com.chat_application.backend.dto.SignalMessage;
import com.chat_application.backend.model.User;
import com.chat_application.backend.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service for managing video call sessions.
 * Tracks active video calls, call history, and call state.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class VideoCallService {

    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;

    // Track active video calls: callId -> VideoCallSession
    private final Map<String, VideoCallSession> activeVideoCallSessions = new ConcurrentHashMap<>();

    // ═══════════════════════════════════════════════════════════════════════════
    // VIDEO CALL SESSION MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Initiate a new video call session.
     * Called when a user sends a "video-call-request" signal.
     */
    public VideoCallSession initiateVideoCall(User caller, User recipient) {
        String callId = generateCallId(caller.getId(), recipient.getId());
        
        VideoCallSession session = VideoCallSession.builder()
                .callId(callId)
                .callerId(caller.getId())
                .callerUsername(caller.getUsername())
                .recipientId(recipient.getId())
                .recipientUsername(recipient.getUsername())
                .callType("VIDEO")
                .status("INITIATED")
                .startedAt(LocalDateTime.now())
                .build();

        activeVideoCallSessions.put(callId, session);
        log.info("Video call session initiated: {} from {} to {}", 
                callId, caller.getUsername(), recipient.getUsername());

        return session;
    }

    /**
     * Accept an active video call session.
     */
    public VideoCallSession acceptVideoCall(String callId, User recipient) {
        VideoCallSession session = activeVideoCallSessions.get(callId);
        if (session == null) {
            log.warn("Video call session not found: {}", callId);
            return null;
        }

        if (!session.getRecipientId().equals(recipient.getId())) {
            log.warn("Unauthorized attempt to accept video call: {} by user {}", callId, recipient.getId());
            return null;
        }

        session.setStatus("ACCEPTED");
        session.setAcceptedAt(LocalDateTime.now());
        log.info("Video call session accepted: {}", callId);

        return session;
    }

    /**
     * Reject an active video call session.
     */
    public VideoCallSession rejectVideoCall(String callId, User recipient) {
        VideoCallSession session = activeVideoCallSessions.get(callId);
        if (session == null) {
            log.warn("Video call session not found: {}", callId);
            return null;
        }

        if (!session.getRecipientId().equals(recipient.getId())) {
            log.warn("Unauthorized attempt to reject video call: {} by user {}", callId, recipient.getId());
            return null;
        }

        session.setStatus("REJECTED");
        session.setEndedAt(LocalDateTime.now());
        activeVideoCallSessions.remove(callId);
        log.info("Video call session rejected: {}", callId);

        return session;
    }

    /**
     * End an active video call session.
     */
    public VideoCallSession endVideoCall(String callId, User user) {
        VideoCallSession session = activeVideoCallSessions.get(callId);
        if (session == null) {
            log.warn("Video call session not found: {}", callId);
            return null;
        }

        // Verify the user is part of this call
        if (!session.getCallerId().equals(user.getId()) && !session.getRecipientId().equals(user.getId())) {
            log.warn("Unauthorized attempt to end video call: {} by user {}", callId, user.getId());
            return null;
        }

        session.setStatus("ENDED");
        session.setEndedAt(LocalDateTime.now());
        
        // Calculate call duration
        if (session.getAcceptedAt() != null) {
            long durationSeconds = java.time.temporal.ChronoUnit.SECONDS
                    .between(session.getAcceptedAt(), session.getEndedAt());
            session.setDurationSeconds(durationSeconds);
        }

        activeVideoCallSessions.remove(callId);
        log.info("Video call session ended: {} (duration: {} seconds)", 
                callId, session.getDurationSeconds());

        return session;
    }

    /**
     * Get an active video call session by ID.
     */
    public VideoCallSession getVideoCallSession(String callId) {
        return activeVideoCallSessions.get(callId);
    }

    /**
     * Check if a user is currently in a video call.
     */
    public boolean isUserInVideoCall(Long userId) {
        return activeVideoCallSessions.values().stream()
                .anyMatch(session -> 
                    (session.getCallerId().equals(userId) || session.getRecipientId().equals(userId)) &&
                    "ACCEPTED".equals(session.getStatus())
                );
    }

    /**
     * Get the active video call session for a user (if any).
     */
    public VideoCallSession getUserActiveVideoCall(Long userId) {
        return activeVideoCallSessions.values().stream()
                .filter(session -> 
                    (session.getCallerId().equals(userId) || session.getRecipientId().equals(userId)) &&
                    "ACCEPTED".equals(session.getStatus())
                )
                .findFirst()
                .orElse(null);
    }

    /**
     * Get all active video call sessions (for monitoring/debugging).
     */
    public Collection<VideoCallSession> getAllActiveVideoCallSessions() {
        return new ArrayList<>(activeVideoCallSessions.values());
    }

    /**
     * Clean up stale video call sessions (older than 1 hour).
     * Call this periodically via a scheduled task.
     */
    public void cleanupStaleVideoCallSessions() {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        
        activeVideoCallSessions.entrySet().removeIf(entry -> {
            VideoCallSession session = entry.getValue();
            if (session.getStartedAt().isBefore(oneHourAgo)) {
                log.warn("Cleaning up stale video call session: {}", entry.getKey());
                return true;
            }
            return false;
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Generate a unique call ID based on caller and recipient IDs.
     */
    private String generateCallId(Long callerId, Long recipientId) {
        // Ensure consistent call ID regardless of call direction
        long minId = Math.min(callerId, recipientId);
        long maxId = Math.max(callerId, recipientId);
        return String.format("video-call-%d-%d-%d", minId, maxId, System.currentTimeMillis());
    }

    /**
     * Broadcast video call status to both participants.
     */
    public void broadcastVideoCallStatus(VideoCallSession session, String statusMessage) {
        Map<String, Object> statusUpdate = new HashMap<>();
        statusUpdate.put("callId", session.getCallId());
        statusUpdate.put("status", session.getStatus());
        statusUpdate.put("message", statusMessage);
        statusUpdate.put("timestamp", LocalDateTime.now());

        // Send to caller
        messagingTemplate.convertAndSendToUser(
                session.getCallerUsername(),
                "/queue/video-call-status",
                statusUpdate
        );

        // Send to recipient
        messagingTemplate.convertAndSendToUser(
                session.getRecipientUsername(),
                "/queue/video-call-status",
                statusUpdate
        );

        log.debug("Video call status broadcast: {} - {}", session.getCallId(), statusMessage);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // VIDEO CALL SESSION DTO
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Represents an active or completed video call session.
     */
    @Data
    @Builder
    @AllArgsConstructor
    public static class VideoCallSession {
        private String callId;
        private Long callerId;
        private String callerUsername;
        private Long recipientId;
        private String recipientUsername;
        private String callType;           // "VIDEO" or "AUDIO"
        private String status;             // "INITIATED", "ACCEPTED", "REJECTED", "ENDED"
        private LocalDateTime startedAt;
        private LocalDateTime acceptedAt;
        private LocalDateTime endedAt;
        private Long durationSeconds;      // Only set when call ends

        // No-arg constructor for Lombok
        public VideoCallSession() {
        }
    }
}
