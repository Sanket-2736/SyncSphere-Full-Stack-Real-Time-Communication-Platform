package com.chat_application.backend.controller;

import com.chat_application.backend.dto.SignalMessage;
import com.chat_application.backend.model.User;
import com.chat_application.backend.repository.UserRepository;
import com.chat_application.backend.service.AudioCallService;
import com.chat_application.backend.service.NotificationService;
import com.chat_application.backend.service.VideoCallService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

/**
 * WebRTC Signaling Server over STOMP/WebSocket.
 *
 * Audio Call Flow:
 *  1. Caller sends "call-request"   → /app/signal → forwarded to callee
 *  2. Callee sends "call-accepted"  → /app/signal → forwarded to caller
 *  3. Caller sends "offer"          → /app/signal → forwarded to callee
 *  4. Callee sends "answer"         → /app/signal → forwarded to caller
 *  5. Both sides exchange "ice-candidate" messages as they are discovered
 *  6. Either side sends "call-ended" to terminate
 *
 * Video Call Flow:
 *  1. Caller sends "video-call-request"   → /app/signal → forwarded to callee
 *  2. Callee sends "video-call-accepted"  → /app/signal → forwarded to caller
 *  3. Caller sends "offer"                → /app/signal → forwarded to callee
 *  4. Callee sends "answer"               → /app/signal → forwarded to caller
 *  5. Both sides exchange "ice-candidate" messages as they are discovered
 *  6. Either side sends "video-call-ended" to terminate
 *
 * All messages are delivered to the target user's personal queue:
 *   /user/{targetUsername}/queue/signal
 *
 * Clients subscribe to: /user/queue/signal
 */
@Controller
@AllArgsConstructor
@Slf4j
public class SignalingController {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AudioCallService audioCallService;
    private final VideoCallService videoCallService;

    /**
     * Relay a WebRTC signaling message to the target user.
     * Client sends to: /app/signal
     *
     * Required payload fields:
     *   - type        : "call-request" | "call-accepted" | "call-rejected" |
     *                   "video-call-request" | "video-call-accepted" | "video-call-rejected" |
     *                   "offer" | "answer" | "ice-candidate" | "call-ended" | "video-call-ended"
     *   - targetUserId: ID of the user to deliver the signal to
     *   - sdp         : (for offer/answer) SDP string
     *   - candidate   : (for ice-candidate) ICE candidate JSON string
     *   - callId      : (optional) Call session ID for tracking
     */
    @MessageMapping("/signal")
    public void relay(@Payload SignalMessage signal, Principal principal) {
        System.out.println("🔵 [SIGNAL] Received signal: " + signal.getType() + " from " + principal.getName() + " to user " + signal.getTargetUserId());
        
        if (signal.getTargetUserId() == null || signal.getType() == null) {
            System.out.println("❌ [SIGNAL] Invalid signal message: missing type or targetUserId");
            log.warn("Invalid signal message from {}: missing type or targetUserId", principal.getName());
            return;
        }

        // Always overwrite sender info from the authenticated principal
        User sender = (User) ((org.springframework.security.core.Authentication) principal).getPrincipal();
        signal.setSenderId(sender.getId());
        signal.setSenderUsername(sender.getUsername());

        // Resolve target username for STOMP user-destination routing
        userRepository.findById(signal.getTargetUserId()).ifPresentOrElse(
                target -> {
                    System.out.println("✅ [SIGNAL] Relaying signal [" + signal.getType() + "] from " + sender.getUsername() + " to " + target.getUsername());
                    log.info("Relaying signal [{}] from {} to {}",
                            signal.getType(), sender.getUsername(), target.getUsername());
                    
                    // Send the signal message
                    messagingTemplate.convertAndSendToUser(
                            target.getUsername(),
                            "/queue/signal",
                            signal
                    );
                    
                    // Handle call session tracking and notifications based on signal type
                    handleCallSessionTracking(signal.getType(), sender, target, signal.getCallId());
                    handleCallNotifications(signal.getType(), sender, target);
                },
                () -> {
                    System.out.println("❌ [SIGNAL] Signal target user " + signal.getTargetUserId() + " not found");
                    log.warn("Signal target user {} not found", signal.getTargetUserId());
                }
        );
    }
    
    /**
     * Handle call session tracking based on the signal type.
     * Creates, updates, or removes call sessions in the appropriate service.
     */
    private void handleCallSessionTracking(String signalType, User caller, User target, String callId) {
        try {
            switch (signalType.toLowerCase()) {
                case "call-request":
                    // Initiate audio call session
                    System.out.println("📞 [CALL_SESSION] Initiating audio call from " + caller.getUsername() + " to " + target.getUsername());
                    audioCallService.initiateAudioCall(caller, target);
                    log.debug("Audio call session initiated from {} to {}", 
                            caller.getUsername(), target.getUsername());
                    break;

                case "call-accepted":
                    // Accept audio call session
                    if (callId != null) {
                        System.out.println("📞 [CALL_SESSION] Audio call accepted by " + target.getUsername());
                        audioCallService.acceptAudioCall(callId, target);
                        log.debug("Audio call session accepted by {}", target.getUsername());
                    }
                    break;

                case "call-rejected":
                    // Reject audio call session
                    if (callId != null) {
                        System.out.println("📞 [CALL_SESSION] Audio call rejected by " + target.getUsername());
                        audioCallService.rejectAudioCall(callId, target);
                        log.debug("Audio call session rejected by {}", target.getUsername());
                    }
                    break;

                case "call-ended":
                    // End audio call session
                    if (callId != null) {
                        System.out.println("📞 [CALL_SESSION] Audio call ended by " + caller.getUsername());
                        audioCallService.endAudioCall(callId, caller);
                        log.debug("Audio call session ended by {}", caller.getUsername());
                    }
                    break;

                case "video-call-request":
                    // Initiate video call session
                    System.out.println("📹 [CALL_SESSION] Initiating video call from " + caller.getUsername() + " to " + target.getUsername());
                    videoCallService.initiateVideoCall(caller, target);
                    log.debug("Video call session initiated from {} to {}", 
                            caller.getUsername(), target.getUsername());
                    break;

                case "video-call-accepted":
                    // Accept video call session
                    if (callId != null) {
                        System.out.println("📹 [CALL_SESSION] Video call accepted by " + target.getUsername());
                        videoCallService.acceptVideoCall(callId, target);
                        log.debug("Video call session accepted by {}", target.getUsername());
                    }
                    break;

                case "video-call-rejected":
                    // Reject video call session
                    if (callId != null) {
                        System.out.println("📹 [CALL_SESSION] Video call rejected by " + target.getUsername());
                        videoCallService.rejectVideoCall(callId, target);
                        log.debug("Video call session rejected by {}", target.getUsername());
                    }
                    break;

                case "video-call-ended":
                    // End video call session
                    if (callId != null) {
                        System.out.println("📹 [CALL_SESSION] Video call ended by " + caller.getUsername());
                        videoCallService.endVideoCall(callId, caller);
                        log.debug("Video call session ended by {}", caller.getUsername());
                    }
                    break;

                default:
                    // For offer, answer, ice-candidate - no session tracking needed
                    break;
            }
        } catch (Exception e) {
            System.out.println("❌ [CALL_SESSION] Error - " + e.getMessage());
            log.error("Error handling call session tracking for signal type {}: {}", 
                    signalType, e.getMessage(), e);
        }
    }
    
    /**
     * Handle call-related notifications based on the signal type.
     */
    private void handleCallNotifications(String signalType, User caller, User target) {
        try {
            switch (signalType.toLowerCase()) {
                case "call-request":
                    // Send incoming call notification (real-time only, not persisted)
                    System.out.println("🔔 [NOTIFICATION] Sending incoming call notification");
                    notificationService.notifyIncomingCall(caller, target);
                    log.debug("Sent incoming call notification from {} to {}", 
                            caller.getUsername(), target.getUsername());
                    break;

                case "video-call-request":
                    // Send incoming video call notification (real-time only, not persisted)
                    System.out.println("🔔 [NOTIFICATION] Sending incoming video call notification");
                    notificationService.notifyIncomingVideoCall(caller, target);
                    log.debug("Sent incoming video call notification from {} to {}", 
                            caller.getUsername(), target.getUsername());
                    break;
                    
                case "call-rejected":
                case "call-ended":
                    // If the call was rejected or ended before being answered, 
                    // send a missed call notification (persisted)
                    System.out.println("🔔 [NOTIFICATION] Sending missed call notification");
                    notificationService.notifyMissedCall(caller, target);
                    log.debug("Sent missed call notification from {} to {}", 
                            caller.getUsername(), target.getUsername());
                    break;

                case "video-call-rejected":
                case "video-call-ended":
                    // If the video call was rejected or ended before being answered, 
                    // send a missed video call notification (persisted)
                    System.out.println("🔔 [NOTIFICATION] Sending missed video call notification");
                    notificationService.notifyMissedVideoCall(caller, target);
                    log.debug("Sent missed video call notification from {} to {}", 
                            caller.getUsername(), target.getUsername());
                    break;
                    
                case "call-accepted":
                case "video-call-accepted":
                    // Call was accepted, no missed call notification needed
                    System.out.println("🔔 [NOTIFICATION] Call accepted, no notification needed");
                    log.debug("Call accepted between {} and {}", 
                            caller.getUsername(), target.getUsername());
                    break;
                    
                default:
                    // For offer, answer, ice-candidate - no notifications needed
                    break;
            }
        } catch (Exception e) {
            System.out.println("❌ [NOTIFICATION] Error - " + e.getMessage());
            log.error("Error handling call notification for signal type {}: {}", 
                    signalType, e.getMessage(), e);
        }
    }
}
