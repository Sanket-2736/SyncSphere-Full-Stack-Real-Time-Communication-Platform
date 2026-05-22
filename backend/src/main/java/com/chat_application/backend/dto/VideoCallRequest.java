package com.chat_application.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for initiating a video call request.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoCallRequest {
    
    /**
     * ID of the user to call.
     */
    private Long targetUserId;
    
    /**
     * Username of the user to call (optional, for convenience).
     */
    private String targetUsername;
    
    /**
     * Call type: "VIDEO" or "AUDIO".
     * Defaults to "VIDEO".
     */
    @Builder.Default
    private String callType = "VIDEO";
    
    /**
     * Optional metadata about the call (e.g., call context, group ID).
     */
    private String metadata;
}
