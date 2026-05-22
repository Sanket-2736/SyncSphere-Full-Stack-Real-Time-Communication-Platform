package com.chat_application.backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDto {
    private Long   id;
    private String type;           // NotificationType name

    // Actor (who triggered it)
    private Long   actorId;
    private String actorUsername;
    private String actorAvatarUrl;

    // Content
    private String title;
    private String body;

    // Context references
    private Long   conversationId;
    private Long   messageId;

    // State
    private boolean read;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
}
