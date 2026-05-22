package com.chat_application.backend.dto;

import lombok.*;

/**
 * Broadcast to /topic/presence when a user's status changes.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PresenceEvent {
    private Long userId;
    private String username;
    private String status;
}
