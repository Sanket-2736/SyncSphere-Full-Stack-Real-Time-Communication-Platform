package com.chat_application.backend.dto;

import com.chat_application.backend.model.UserStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatusUpdateRequest {
    @NotNull(message = "Status cannot be null")
    private UserStatus status;
}
