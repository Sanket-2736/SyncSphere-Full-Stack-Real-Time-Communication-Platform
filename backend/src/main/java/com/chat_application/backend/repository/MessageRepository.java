package com.chat_application.backend.repository;

import com.chat_application.backend.model.Conversation;
import com.chat_application.backend.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    /** Paginated history for a conversation, newest first. */
    @Query("""
           SELECT m FROM Message m
           WHERE m.conversation = :conversation AND m.deleted = false
           ORDER BY m.sentAt DESC
           """)
    Page<Message> findByConversationOrderBySentAtDesc(
            @Param("conversation") Conversation conversation, Pageable pageable);

    /**
     * Count messages in a conversation that were NOT sent by the given user
     * and have not been read yet — i.e. the user's unread count.
     */
    @Query("""
           SELECT COUNT(m) FROM Message m
           WHERE m.conversation = :conversation
             AND m.sender.id != :userId
             AND m.deleted = false
             AND m.status != 'READ'
           """)
    long countUnreadMessages(@Param("conversation") Conversation conversation,
                             @Param("userId") Long userId);

    /**
     * Mark all messages in a conversation as READ for the given user
     * (only messages they did not send themselves).
     */
    @Modifying
    @Query("""
           UPDATE Message m
           SET m.status = 'READ', m.readAt = CURRENT_TIMESTAMP
           WHERE m.conversation = :conversation
             AND m.sender.id != :userId
             AND m.status != 'READ'
             AND m.deleted = false
           """)
    int markMessagesAsRead(@Param("conversation") Conversation conversation,
                           @Param("userId") Long userId);

    /**
     * Mark all SENT messages in a conversation as DELIVERED
     * (called when the recipient comes online / opens the conversation).
     */
    @Modifying
    @Query("""
           UPDATE Message m
           SET m.status = 'DELIVERED'
           WHERE m.conversation = :conversation
             AND m.sender.id != :userId
             AND m.status = 'SENT'
             AND m.deleted = false
           """)
    int markMessagesAsDelivered(@Param("conversation") Conversation conversation,
                                @Param("userId") Long userId);

    /** Full-text search within a single conversation. */
    @Query("""
           SELECT m FROM Message m
           WHERE m.conversation = :conversation
             AND m.deleted = false
             AND LOWER(m.content) LIKE LOWER(CONCAT('%', :query, '%'))
           ORDER BY m.sentAt DESC
           """)
    Page<Message> searchInConversation(@Param("conversation") Conversation conversation,
                                       @Param("query") String query,
                                       Pageable pageable);

    /**
     * Global search across all conversations the user is an active member of.
     */
    @Query("""
           SELECT m FROM Message m
           JOIN m.conversation c
           JOIN c.members cm
           WHERE cm.user.id = :userId
             AND cm.leftAt IS NULL
             AND m.deleted = false
             AND LOWER(m.content) LIKE LOWER(CONCAT('%', :query, '%'))
           ORDER BY m.sentAt DESC
           """)
    Page<Message> searchGlobal(@Param("userId") Long userId,
                               @Param("query") String query,
                               Pageable pageable);
}
