package com.chat_application.backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PinnedMessageDto {
    private Long id;
    private Long conversationId;
    private MessageDto message;
    private Long pinnedById;
    private String pinnedByUsername;
    private LocalDateTime pinnedAt;
}
