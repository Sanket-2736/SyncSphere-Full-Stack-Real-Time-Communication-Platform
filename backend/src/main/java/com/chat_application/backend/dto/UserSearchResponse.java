package com.chat_application.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSearchResponse {
    private Long id;
    private String username;
    private String firstName;
    private String lastName;
    private String status;
    private String avatarUrl;
}
