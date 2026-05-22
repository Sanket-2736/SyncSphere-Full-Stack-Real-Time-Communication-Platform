package com.chat_application.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Join entity between Conversation and User.
 * Carries per-member metadata: role, mute state, join time.
 */
@Entity
@Table(name = "conversation_members",
       uniqueConstraints = @UniqueConstraint(columnNames = {"conversation_id", "user_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private GroupRole role = GroupRole.MEMBER;

    /** Null = not muted. Non-null = muted until this timestamp (use far-future for indefinite). */
    @Column(name = "muted_until")
    private LocalDateTime mutedUntil;

    @Column(name = "joined_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime joinedAt = LocalDateTime.now();

    /** Soft-left: member left the group but history is preserved. */
    @Column(name = "left_at")
    private LocalDateTime leftAt;

    public boolean isMuted() {
        return mutedUntil != null && mutedUntil.isAfter(LocalDateTime.now());
    }

    public boolean hasLeft() {
        return leftAt != null;
    }
}
