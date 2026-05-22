package com.chat_application.backend.controller;

import com.chat_application.backend.model.User;
import com.chat_application.backend.service.AudioCallService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

/**
 * REST API endpoints for audio call management.
 * Provides endpoints to check call status, get call history, and manage audio calls.
 */
@RestController
@RequestMapping("/api/audio-calls")
@AllArgsConstructor
@Slf4j
public class AudioCallController {

    private final AudioCallService audioCallService;

    /**
     * Check if the current user is in an active audio call.
     * GET /api/audio-calls/status
     */
    @GetMapping("/status")
    public ResponseEntity<?> getAudioCallStatus(Principal principal) {
        System.out.println("🔵 [AUDIO_CALL_STATUS] Checking audio call status");
        try {
            User user = (User) ((org.springframework.security.core.Authentication) principal).getPrincipal();
            
            AudioCallService.AudioCallSession activeCall = audioCallService.getUserActiveAudioCall(user.getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("inCall", activeCall != null);
            
            if (activeCall != null) {
                response.put("callId", activeCall.getCallId());
                response.put("callType", activeCall.getCallType());
                response.put("status", activeCall.getStatus());
                response.put("otherPartyId", activeCall.getCallerId().equals(user.getId()) 
                        ? activeCall.getRecipientId() 
                        : activeCall.getCallerId());
                response.put("otherPartyUsername", activeCall.getCallerId().equals(user.getId()) 
                        ? activeCall.getRecipientUsername() 
                        : activeCall.getCallerUsername());
                response.put("startedAt", activeCall.getStartedAt());
                response.put("acceptedAt", activeCall.getAcceptedAt());
                System.out.println("✅ [AUDIO_CALL_STATUS] User is in call: " + activeCall.getCallId());
            } else {
                System.out.println("✅ [AUDIO_CALL_STATUS] User is not in any call");
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("❌ [AUDIO_CALL_STATUS] Error - " + e.getMessage());
            log.error("Error getting audio call status: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to get call status"));
        }
    }

    /**
     * Get all active audio call sessions (admin/monitoring endpoint).
     * GET /api/audio-calls/active
     */
    @GetMapping("/active")
    public ResponseEntity<?> getActiveAudioCallSessions() {
        System.out.println("🔵 [GET_ACTIVE_AUDIO_CALLS] Fetching active audio call sessions");
        try {
            Collection<AudioCallService.AudioCallSession> activeSessions = 
                    audioCallService.getAllActiveAudioCallSessions();
            
            Map<String, Object> response = new HashMap<>();
            response.put("activeCallCount", activeSessions.size());
            response.put("sessions", activeSessions);
            
            System.out.println("✅ [GET_ACTIVE_AUDIO_CALLS] Found " + activeSessions.size() + " active calls");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("❌ [GET_ACTIVE_AUDIO_CALLS] Error - " + e.getMessage());
            log.error("Error getting active audio call sessions: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to get active sessions"));
        }
    }

    /**
     * Check if a specific user is in an audio call.
     * GET /api/audio-calls/user/{userId}/in-call
     */
    @GetMapping("/user/{userId}/in-call")
    public ResponseEntity<?> isUserInAudioCall(@PathVariable Long userId) {
        System.out.println("🔵 [IS_USER_IN_AUDIO_CALL] Checking if user " + userId + " is in audio call");
        try {
            boolean inCall = audioCallService.isUserInAudioCall(userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("userId", userId);
            response.put("inCall", inCall);
            
            System.out.println("✅ [IS_USER_IN_AUDIO_CALL] Result: " + inCall);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("❌ [IS_USER_IN_AUDIO_CALL] Error - " + e.getMessage());
            log.error("Error checking if user is in audio call: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to check user call status"));
        }
    }

    /**
     * Get audio call session details by call ID.
     * GET /api/audio-calls/{callId}
     */
    @GetMapping("/{callId}")
    public ResponseEntity<?> getAudioCallSession(@PathVariable String callId) {
        System.out.println("🔵 [GET_AUDIO_CALL_SESSION] Fetching audio call session: " + callId);
        try {
            AudioCallService.AudioCallSession session = audioCallService.getAudioCallSession(callId);
            
            if (session == null) {
                System.out.println("❌ [GET_AUDIO_CALL_SESSION] Session not found: " + callId);
                return ResponseEntity.notFound().build();
            }
            
            System.out.println("✅ [GET_AUDIO_CALL_SESSION] Session found: " + callId);
            return ResponseEntity.ok(session);
        } catch (Exception e) {
            System.out.println("❌ [GET_AUDIO_CALL_SESSION] Error - " + e.getMessage());
            log.error("Error getting audio call session: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to get call session"));
        }
    }

    /**
     * Health check endpoint for audio call service.
     * GET /api/audio-calls/health
     */
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        System.out.println("🔵 [AUDIO_CALL_HEALTH] Health check");
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "AudioCallService");
        health.put("activeCallCount", audioCallService.getAllActiveAudioCallSessions().size());
        health.put("timestamp", System.currentTimeMillis());
        
        System.out.println("✅ [AUDIO_CALL_HEALTH] Service is UP");
        
        return ResponseEntity.ok(health);
    }
}
