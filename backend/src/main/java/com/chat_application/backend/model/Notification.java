package com.chat_application.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Persisted notification record.
 * Real-time delivery happens via WebSocket; persistence ensures
 * users see missed notifications when they reconnect.
 */
@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_notif_recipient", columnList = "recipient_id"),
    @Index(name = "idx_notif_read",      columnList = "recipient_id, is_read")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The user who receives this notification. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    /** The user who triggered the notification (sender, caller, etc.). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private User actor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    /** Human-readable title, e.g. "New message from Alice". */
    @Column(nullable = false)
    private String title;

    /** Optional body text, e.g. message snippet or call duration. */
    @Column(columnDefinition = "TEXT")
    private String body;

    /** ID of the related conversation (if applicable). */
    @Column(name = "conversation_id")
    private Long conversationId;

    /** ID of the related message (if applicable). */
    @Column(name = "message_id")
    private Long messageId;

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean read = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "read_at")
    private LocalDateTime readAt;
}
