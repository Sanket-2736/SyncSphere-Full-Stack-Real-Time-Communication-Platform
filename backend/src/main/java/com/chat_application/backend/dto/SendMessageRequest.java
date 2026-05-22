package com.chat_application.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendMessageRequest {

    @NotNull(message = "Conversation ID is required")
    private Long conversationId;

    /** Text content — optional if mediaUrl is provided. */
    private String content;

    /** Reply to a specific message (optional). */
    private Long replyToId;

    /** For media messages: pre-uploaded URL. */
    private String mediaUrl;
    private String mediaType;
    private String mediaFileName;
    private Long mediaSize;
}
