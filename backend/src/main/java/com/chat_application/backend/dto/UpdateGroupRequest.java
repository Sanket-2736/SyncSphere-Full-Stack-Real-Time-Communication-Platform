package com.chat_application.backend.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateGroupRequest {
    private String name;
    private String description;
    private String avatarUrl;
}
