package com.chat_application.backend.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageDto {
    private Long id;
    private Long conversationId;

    private Long senderId;
    private String senderUsername;
    private String senderAvatarUrl;

    private String type;           // TEXT | IMAGE | FILE | SYSTEM
    private String content;
    private boolean deleted;

    // Media
    private String mediaUrl;
    private String mediaType;
    private String mediaFileName;
    private Long mediaSize;

    // Reply
    private Long replyToId;
    private String replyToContent;     // snippet of the replied-to message
    private String replyToSenderUsername;

    // Status
    private String status;             // SENT | DELIVERED | READ
    private LocalDateTime sentAt;
    private LocalDateTime editedAt;
    private LocalDateTime readAt;

    // Reactions: emoji → count
    private Map<String, Long> reactions;

    // Users who reacted with each emoji (for tooltip)
    private Map<String, List<String>> reactionUsers;
}
