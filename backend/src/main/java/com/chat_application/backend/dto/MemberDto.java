package com.chat_application.backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberDto {
    private Long userId;
    private String username;
    private String avatarUrl;
    private String status;
    private String role;           // OWNER | ADMIN | MEMBER
    private boolean muted;
    private LocalDateTime joinedAt;
}
