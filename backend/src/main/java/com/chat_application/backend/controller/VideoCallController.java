package com.chat_application.backend.controller;

import com.chat_application.backend.model.User;
import com.chat_application.backend.service.VideoCallService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

/**
 * REST API endpoints for video call management.
 * Provides endpoints to check call status, get call history, and manage video calls.
 */
@RestController
@RequestMapping("/api/video-calls")
@AllArgsConstructor
@Slf4j
public class VideoCallController {

    private final VideoCallService videoCallService;

    /**
     * Check if the current user is in an active video call.
     * GET /api/video-calls/status
     */
    @GetMapping("/status")
    public ResponseEntity<?> getVideoCallStatus(Principal principal) {
        System.out.println("🔵 [VIDEO_CALL_STATUS] Checking video call status");
        try {
            User user = (User) ((org.springframework.security.core.Authentication) principal).getPrincipal();
            
            VideoCallService.VideoCallSession activeCall = videoCallService.getUserActiveVideoCall(user.getId());
            
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
                System.out.println("✅ [VIDEO_CALL_STATUS] User is in call: " + activeCall.getCallId());
            } else {
                System.out.println("✅ [VIDEO_CALL_STATUS] User is not in any call");
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("❌ [VIDEO_CALL_STATUS] Error - " + e.getMessage());
            log.error("Error getting video call status: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to get call status"));
        }
    }

    /**
     * Get all active video call sessions (admin/monitoring endpoint).
     * GET /api/video-calls/active
     */
    @GetMapping("/active")
    public ResponseEntity<?> getActiveVideoCallSessions() {
        System.out.println("🔵 [GET_ACTIVE_VIDEO_CALLS] Fetching active video call sessions");
        try {
            Collection<VideoCallService.VideoCallSession> activeSessions = 
                    videoCallService.getAllActiveVideoCallSessions();
            
            Map<String, Object> response = new HashMap<>();
            response.put("activeCallCount", activeSessions.size());
            response.put("sessions", activeSessions);
            
            System.out.println("✅ [GET_ACTIVE_VIDEO_CALLS] Found " + activeSessions.size() + " active calls");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("❌ [GET_ACTIVE_VIDEO_CALLS] Error - " + e.getMessage());
            log.error("Error getting active video call sessions: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to get active sessions"));
        }
    }

    /**
     * Check if a specific user is in a video call.
     * GET /api/video-calls/user/{userId}/in-call
     */
    @GetMapping("/user/{userId}/in-call")
    public ResponseEntity<?> isUserInVideoCall(@PathVariable Long userId) {
        System.out.println("🔵 [IS_USER_IN_VIDEO_CALL] Checking if user " + userId + " is in video call");
        try {
            boolean inCall = videoCallService.isUserInVideoCall(userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("userId", userId);
            response.put("inCall", inCall);
            
            System.out.println("✅ [IS_USER_IN_VIDEO_CALL] Result: " + inCall);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("❌ [IS_USER_IN_VIDEO_CALL] Error - " + e.getMessage());
            log.error("Error checking if user is in video call: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to check user call status"));
        }
    }

    /**
     * Get video call session details by call ID.
     * GET /api/video-calls/{callId}
     */
    @GetMapping("/{callId}")
    public ResponseEntity<?> getVideoCallSession(@PathVariable String callId) {
        System.out.println("🔵 [GET_VIDEO_CALL_SESSION] Fetching video call session: " + callId);
        try {
            VideoCallService.VideoCallSession session = videoCallService.getVideoCallSession(callId);
            
            if (session == null) {
                System.out.println("❌ [GET_VIDEO_CALL_SESSION] Session not found: " + callId);
                return ResponseEntity.notFound().build();
            }
            
            System.out.println("✅ [GET_VIDEO_CALL_SESSION] Session found: " + callId);
            return ResponseEntity.ok(session);
        } catch (Exception e) {
            System.out.println("❌ [GET_VIDEO_CALL_SESSION] Error - " + e.getMessage());
            log.error("Error getting video call session: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to get call session"));
        }
    }

    /**
     * Health check endpoint for video call service.
     * GET /api/video-calls/health
     */
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        System.out.println("🔵 [VIDEO_CALL_HEALTH] Health check");
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "VideoCallService");
        health.put("activeCallCount", videoCallService.getAllActiveVideoCallSessions().size());
        health.put("timestamp", System.currentTimeMillis());
        
        System.out.println("✅ [VIDEO_CALL_HEALTH] Service is UP");
        
        return ResponseEntity.ok(health);
    }
}
