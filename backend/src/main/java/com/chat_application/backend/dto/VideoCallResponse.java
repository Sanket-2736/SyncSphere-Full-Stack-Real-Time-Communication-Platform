package com.chat_application.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for video call session information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoCallResponse {
    
    /**
     * Unique call session ID.
     */
    private String callId;
    
    /**
     * ID of the caller.
     */
    private Long callerId;
    
    /**
     * Username of the caller.
     */
    private String callerUsername;
    
    /**
     * ID of the recipient.
     */
    private Long recipientId;
    
    /**
     * Username of the recipient.
     */
    private String recipientUsername;
    
    /**
     * Call type: "VIDEO" or "AUDIO".
     */
    private String callType;
    
    /**
     * Current call status: "INITIATED", "ACCEPTED", "REJECTED", "ENDED".
     */
    private String status;
    
    /**
     * When the call was initiated.
     */
    private LocalDateTime startedAt;
    
    /**
     * When the call was accepted (null if not accepted).
     */
    private LocalDateTime acceptedAt;
    
    /**
     * When the call ended (null if still active).
     */
    private LocalDateTime endedAt;
    
    /**
     * Call duration in seconds (only set when call ends).
     */
    private Long durationSeconds;
    
    /**
     * Success message or error message.
     */
    private String message;
}
