package com.chat_application.backend.config;

import com.chat_application.backend.service.AudioCallService;
import com.chat_application.backend.service.VideoCallService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled tasks for audio and video call management.
 * Handles cleanup of stale sessions and monitoring.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class VideoCallScheduler {

    private final VideoCallService videoCallService;
    private final AudioCallService audioCallService;

    /**
     * Clean up stale video call sessions every 30 minutes.
     * Removes sessions that have been inactive for more than 1 hour.
     */
    @Scheduled(fixedDelay = 1800000) // 30 minutes in milliseconds
    public void cleanupStaleVideoCallSessions() {
        try {
            log.debug("Starting cleanup of stale video call sessions...");
            videoCallService.cleanupStaleVideoCallSessions();
            log.debug("Cleanup of stale video call sessions completed");
        } catch (Exception e) {
            log.error("Error during video call session cleanup: {}", e.getMessage(), e);
        }
    }

    /**
     * Clean up stale audio call sessions every 30 minutes.
     * Removes sessions that have been inactive for more than 1 hour.
     */
    @Scheduled(fixedDelay = 1800000) // 30 minutes in milliseconds
    public void cleanupStaleAudioCallSessions() {
        try {
            log.debug("Starting cleanup of stale audio call sessions...");
            audioCallService.cleanupStaleAudioCallSessions();
            log.debug("Cleanup of stale audio call sessions completed");
        } catch (Exception e) {
            log.error("Error during audio call session cleanup: {}", e.getMessage(), e);
        }
    }

    /**
     * Log active video and audio call sessions every 5 minutes (for monitoring).
     */
    @Scheduled(fixedDelay = 300000) // 5 minutes in milliseconds
    public void logActiveCallSessions() {
        try {
            long activeVideoCallCount = videoCallService.getAllActiveVideoCallSessions().size();
            long activeAudioCallCount = audioCallService.getAllActiveAudioCallSessions().size();
            
            if (activeVideoCallCount > 0 || activeAudioCallCount > 0) {
                log.info("Currently active call sessions - Video: {}, Audio: {}", 
                        activeVideoCallCount, activeAudioCallCount);
            }
        } catch (Exception e) {
            log.error("Error logging active call sessions: {}", e.getMessage(), e);
        }
    }
}
