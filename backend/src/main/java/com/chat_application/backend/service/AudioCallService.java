package com.chat_application.backend.service;

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
 * Service for managing audio call sessions.
 * Tracks active audio calls, call history, and call state.
 * Similar to VideoCallService but specifically for audio calls.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AudioCallService {

    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;

    // Track active audio calls: callId -> AudioCallSession
    private final Map<String, AudioCallSession> activeAudioCallSessions = new ConcurrentHashMap<>();

    // ═══════════════════════════════════════════════════════════════════════════
    // AUDIO CALL SESSION MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Initiate a new audio call session.
     * Called when a user sends a "call-request" signal.
     */
    public AudioCallSession initiateAudioCall(User caller, User recipient) {
        String callId = generateCallId(caller.getId(), recipient.getId());
        
        AudioCallSession session = AudioCallSession.builder()
                .callId(callId)
                .callerId(caller.getId())
                .callerUsername(caller.getUsername())
                .recipientId(recipient.getId())
                .recipientUsername(recipient.getUsername())
                .callType("AUDIO")
                .status("INITIATED")
                .startedAt(LocalDateTime.now())
                .build();

        activeAudioCallSessions.put(callId, session);
        log.info("Audio call session initiated: {} from {} to {}", 
                callId, caller.getUsername(), recipient.getUsername());

        return session;
    }

    /**
     * Accept an active audio call session.
     */
    public AudioCallSession acceptAudioCall(String callId, User recipient) {
        AudioCallSession session = activeAudioCallSessions.get(callId);
        if (session == null) {
            log.warn("Audio call session not found: {}", callId);
            return null;
        }

        if (!session.getRecipientId().equals(recipient.getId())) {
            log.warn("Unauthorized attempt to accept audio call: {} by user {}", callId, recipient.getId());
            return null;
        }

        session.setStatus("ACCEPTED");
        session.setAcceptedAt(LocalDateTime.now());
        log.info("Audio call session accepted: {}", callId);

        return session;
    }

    /**
     * Reject an active audio call session.
     */
    public AudioCallSession rejectAudioCall(String callId, User recipient) {
        AudioCallSession session = activeAudioCallSessions.get(callId);
        if (session == null) {
            log.warn("Audio call session not found: {}", callId);
            return null;
        }

        if (!session.getRecipientId().equals(recipient.getId())) {
            log.warn("Unauthorized attempt to reject audio call: {} by user {}", callId, recipient.getId());
            return null;
        }

        session.setStatus("REJECTED");
        session.setEndedAt(LocalDateTime.now());
        activeAudioCallSessions.remove(callId);
        log.info("Audio call session rejected: {}", callId);

        return session;
    }

    /**
     * End an active audio call session.
     */
    public AudioCallSession endAudioCall(String callId, User user) {
        AudioCallSession session = activeAudioCallSessions.get(callId);
        if (session == null) {
            log.warn("Audio call session not found: {}", callId);
            return null;
        }

        // Verify the user is part of this call
        if (!session.getCallerId().equals(user.getId()) && !session.getRecipientId().equals(user.getId())) {
            log.warn("Unauthorized attempt to end audio call: {} by user {}", callId, user.getId());
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

        activeAudioCallSessions.remove(callId);
        log.info("Audio call session ended: {} (duration: {} seconds)", 
                callId, session.getDurationSeconds());

        return session;
    }

    /**
     * Get an active audio call session by ID.
     */
    public AudioCallSession getAudioCallSession(String callId) {
        return activeAudioCallSessions.get(callId);
    }

    /**
     * Check if a user is currently in an audio call.
     */
    public boolean isUserInAudioCall(Long userId) {
        return activeAudioCallSessions.values().stream()
                .anyMatch(session -> 
                    (session.getCallerId().equals(userId) || session.getRecipientId().equals(userId)) &&
                    "ACCEPTED".equals(session.getStatus())
                );
    }

    /**
     * Get the active audio call session for a user (if any).
     */
    public AudioCallSession getUserActiveAudioCall(Long userId) {
        return activeAudioCallSessions.values().stream()
                .filter(session -> 
                    (session.getCallerId().equals(userId) || session.getRecipientId().equals(userId)) &&
                    "ACCEPTED".equals(session.getStatus())
                )
                .findFirst()
                .orElse(null);
    }

    /**
     * Get all active audio call sessions (for monitoring/debugging).
     */
    public Collection<AudioCallSession> getAllActiveAudioCallSessions() {
        return new ArrayList<>(activeAudioCallSessions.values());
    }

    /**
     * Clean up stale audio call sessions (older than 1 hour).
     * Call this periodically via a scheduled task.
     */
    public void cleanupStaleAudioCallSessions() {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        
        activeAudioCallSessions.entrySet().removeIf(entry -> {
            AudioCallSession session = entry.getValue();
            if (session.getStartedAt().isBefore(oneHourAgo)) {
                log.warn("Cleaning up stale audio call session: {}", entry.getKey());
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
        return String.format("audio-call-%d-%d-%d", minId, maxId, System.currentTimeMillis());
    }

    /**
     * Broadcast audio call status to both participants.
     */
    public void broadcastAudioCallStatus(AudioCallSession session, String statusMessage) {
        Map<String, Object> statusUpdate = new HashMap<>();
        statusUpdate.put("callId", session.getCallId());
        statusUpdate.put("status", session.getStatus());
        statusUpdate.put("message", statusMessage);
        statusUpdate.put("timestamp", LocalDateTime.now());

        // Send to caller
        messagingTemplate.convertAndSendToUser(
                session.getCallerUsername(),
                "/queue/audio-call-status",
                statusUpdate
        );

        // Send to recipient
        messagingTemplate.convertAndSendToUser(
                session.getRecipientUsername(),
                "/queue/audio-call-status",
                statusUpdate
        );

        log.debug("Audio call status broadcast: {} - {}", session.getCallId(), statusMessage);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AUDIO CALL SESSION DTO
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Represents an active or completed audio call session.
     */
    @Data
    @Builder
    @AllArgsConstructor
    public static class AudioCallSession {
        private String callId;
        private Long callerId;
        private String callerUsername;
        private Long recipientId;
        private String recipientUsername;
        private String callType;           // "AUDIO"
        private String status;             // "INITIATED", "ACCEPTED", "REJECTED", "ENDED"
        private LocalDateTime startedAt;
        private LocalDateTime acceptedAt;
        private LocalDateTime endedAt;
        private Long durationSeconds;      // Only set when call ends

        // No-arg constructor for Lombok
        public AudioCallSession() {
        }
    }
}
