package com.chat_application.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockUserRequest {
    @NotNull(message = "User ID to block cannot be null")
    private Long blockedUserId;
}
