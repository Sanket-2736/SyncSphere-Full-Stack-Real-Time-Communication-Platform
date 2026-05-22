package com.chat_application.backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MuteRequest {
    /**
     * Mute until this timestamp.
     * Null = unmute.
     * Far-future (e.g. year 9999) = mute indefinitely.
     */
    private LocalDateTime muteUntil;
}
