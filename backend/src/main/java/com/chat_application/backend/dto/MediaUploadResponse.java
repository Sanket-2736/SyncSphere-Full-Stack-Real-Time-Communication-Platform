package com.chat_application.backend.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MediaUploadResponse {
    private String url;
    private String fileName;
    private String mediaType;
    private Long size;
}
