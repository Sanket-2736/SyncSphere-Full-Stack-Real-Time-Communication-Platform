package com.chat_application.backend.controller;

import com.chat_application.backend.dto.NotificationDto;
import com.chat_application.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST API for managing user notifications.
 * 
 * Endpoints:
 * - GET  /api/notifications        → List notifications (paginated)
 * - GET  /api/notifications/unread → Get unread count
 * - PUT  /api/notifications/{id}/read → Mark specific notification as read
 * - PUT  /api/notifications/read-all  → Mark all notifications as read
 * - DELETE /api/notifications/cleanup → Clean up old read notifications
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Get paginated list of notifications for the authenticated user.
     * 
     * @param user Current authenticated user
     * @param page Page number (default: 0)
     * @param size Page size (default: 20, max: 100)
     * @return PageResponse with notifications ordered by creation date (newest first)
     */
    @GetMapping
    public ResponseEntity<com.chat_application.backend.dto.PageResponse<NotificationDto>> getNotifications(
            @AuthenticationPrincipal com.chat_application.backend.model.User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        System.out.println("🔵 [GET_NOTIFICATIONS] Fetching notifications for user: " + user.getUsername() + " (page: " + page + ", size: " + size + ")");
        
        // Limit page size to prevent abuse
        if (size > 100) size = 100;
        
        com.chat_application.backend.dto.PageResponse<NotificationDto> response = notificationService.getNotifications(user.getId(), page, size);
        
        System.out.println("✅ [GET_NOTIFICATIONS] Retrieved " + response.getContent().size() + " notifications");
        log.debug("Retrieved {} notifications for user {} (page {}, size {})", 
                response.getContent().size(), user.getUsername(), page, size);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get the count of unread notifications for the authenticated user.
     * 
     * @param user Current authenticated user
     * @return JSON object with unread count
     */
    @GetMapping("/unread")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal com.chat_application.backend.model.User user) {
        
        System.out.println("🔵 [GET_UNREAD_COUNT] Fetching unread count for user: " + user.getUsername());
        
        long unreadCount = notificationService.getUnreadCount(user.getId());
        
        System.out.println("✅ [GET_UNREAD_COUNT] Unread count: " + unreadCount);
        
        return ResponseEntity.ok(Map.of("unreadCount", unreadCount));
    }

    /**
     * Mark a specific notification as read.
     * 
     * @param notificationId ID of the notification to mark as read
     * @param user Current authenticated user
     * @return Success response
     */
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Map<String, String>> markAsRead(
            @PathVariable Long notificationId,
            @AuthenticationPrincipal com.chat_application.backend.model.User user) {
        
        System.out.println("🔵 [MARK_NOTIFICATION_READ] Marking notification " + notificationId + " as read");
        
        notificationService.markAsRead(notificationId, user.getId());
        
        System.out.println("✅ [MARK_NOTIFICATION_READ] Notification marked as read");
        log.debug("Marked notification {} as read for user {}", notificationId, user.getUsername());
        
        return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
    }

    /**
     * Mark all notifications as read for the authenticated user.
     * 
     * @param user Current authenticated user
     * @return Success response with count of updated notifications
     */
    @PutMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead(
            @AuthenticationPrincipal com.chat_application.backend.model.User user) {
        
        System.out.println("🔵 [MARK_ALL_NOTIFICATIONS_READ] Marking all notifications as read for user: " + user.getUsername());
        
        notificationService.markAllAsRead(user.getId());
        
        System.out.println("✅ [MARK_ALL_NOTIFICATIONS_READ] All notifications marked as read");
        log.info("Marked all notifications as read for user {}", user.getUsername());
        
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    /**
     * Clean up old read notifications (housekeeping endpoint).
     * Removes read notifications older than the specified number of days.
     * 
     * @param user Current authenticated user
     * @param daysOld Number of days old (default: 30, max: 365)
     * @return Success response
     */
    @DeleteMapping("/cleanup")
    public ResponseEntity<Map<String, String>> cleanupOldNotifications(
            @AuthenticationPrincipal com.chat_application.backend.model.User user,
            @RequestParam(defaultValue = "30") int daysOld) {
        
        System.out.println("🔵 [CLEANUP_NOTIFICATIONS] Cleaning up notifications older than " + daysOld + " days");
        
        // Limit cleanup range to prevent accidental mass deletion
        if (daysOld > 365) daysOld = 365;
        if (daysOld < 1) daysOld = 1;
        
        notificationService.cleanupOldNotifications(user.getId(), daysOld);
        
        System.out.println("✅ [CLEANUP_NOTIFICATIONS] Cleanup completed");
        log.info("Cleaned up old notifications for user {} (older than {} days)", 
                user.getUsername(), daysOld);
        
        return ResponseEntity.ok(Map.of("message", 
                String.format("Cleaned up notifications older than %d days", daysOld)));
    }
}