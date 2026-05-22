package com.chat_application.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EditMessageRequest {

    @NotBlank(message = "Content cannot be blank")
    private String content;
}
