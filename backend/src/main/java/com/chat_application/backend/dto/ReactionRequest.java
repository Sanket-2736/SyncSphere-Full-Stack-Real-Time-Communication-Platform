package com.chat_application.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReactionRequest {

    @NotBlank(message = "Emoji is required")
    private String emoji;
}
