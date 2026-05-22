package com.chat_application.backend.dto;

import lombok.*;

/**
 * Broadcast over WebSocket when a user starts/stops typing.
 * Delivered to /topic/conversation/{conversationId}/typing
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TypingEvent {
    private Long conversationId;
    private Long userId;
    private String username;
    private boolean typing;   // true = started, false = stopped
}
