package com.chat_application.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "pinned_messages",
       uniqueConstraints = @UniqueConstraint(columnNames = {"conversation_id", "message_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PinnedMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pinned_by_id", nullable = false)
    private User pinnedBy;

    @Column(name = "pinned_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime pinnedAt = LocalDateTime.now();
}
