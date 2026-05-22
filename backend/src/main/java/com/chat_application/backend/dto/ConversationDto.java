package com.chat_application.backend.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationDto {
    private Long id;
    private String type;               // DIRECT | GROUP

    // DIRECT only
    private Long otherUserId;
    private String otherUsername;
    private String otherUserAvatarUrl;
    private String otherUserStatus;

    // GROUP only
    private String groupName;
    private String groupDescription;
    private String groupAvatarUrl;
    private List<MemberDto> members;

    // Common
    private MessageDto lastMessage;
    private long unreadCount;
    private boolean muted;
    private LocalDateTime lastMessageAt;
    private LocalDateTime createdAt;
}
