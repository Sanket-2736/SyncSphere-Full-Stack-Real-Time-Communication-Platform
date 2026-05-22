package com.chat_application.backend.service;

import com.chat_application.backend.dto.MediaUploadResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
public class MediaService {

    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024L; // 50 MB

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain",
            "video/mp4", "video/webm",
            "audio/mpeg", "audio/ogg", "audio/wav"
    );

    @Value("${app.media.upload-dir:uploads}")
    private String uploadDir;

    @Value("${app.media.base-url:http://localhost:8080/media}")
    private String baseUrl;

    public MediaUploadResponse store(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException("File exceeds maximum size of 50 MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new RuntimeException("File type not allowed: " + contentType);
        }

        String originalName = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
        String extension = "";
        int dotIdx = originalName.lastIndexOf('.');
        if (dotIdx >= 0) extension = originalName.substring(dotIdx);

        String storedName = UUID.randomUUID() + extension;

        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(uploadPath);

        Path target = uploadPath.resolve(storedName);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        log.info("Stored media file: {} ({} bytes)", storedName, file.getSize());

        return MediaUploadResponse.builder()
                .url(baseUrl + "/" + storedName)
                .fileName(originalName)
                .mediaType(contentType)
                .size(file.getSize())
                .build();
    }
}
