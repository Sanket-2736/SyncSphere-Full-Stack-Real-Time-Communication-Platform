package com.chat_application.backend.repository;

import com.chat_application.backend.model.Conversation;
import com.chat_application.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    /**
     * Find an existing DIRECT conversation shared by exactly two users.
     * Uses subquery style to avoid non-standard JOIN ON in JPQL.
     */
    @Query("""
           SELECT c FROM Conversation c
           WHERE c.type = 'DIRECT'
             AND EXISTS (
                 SELECT m1 FROM ConversationMember m1
                 WHERE m1.conversation = c AND m1.user = :userA AND m1.leftAt IS NULL
             )
             AND EXISTS (
                 SELECT m2 FROM ConversationMember m2
                 WHERE m2.conversation = c AND m2.user = :userB AND m2.leftAt IS NULL
             )
           """)
    Optional<Conversation> findDirectConversation(@Param("userA") User userA,
                                                  @Param("userB") User userB);

    /**
     * All conversations (DIRECT + GROUP) for a user, newest activity first.
     */
    @Query("""
           SELECT DISTINCT c FROM Conversation c
           JOIN c.members m
           WHERE m.user = :user AND m.leftAt IS NULL
           ORDER BY c.lastMessageAt DESC NULLS LAST
           """)
    List<Conversation> findAllByMember(@Param("user") User user);

    /**
     * All GROUP conversations a user belongs to.
     */
    @Query("""
           SELECT DISTINCT c FROM Conversation c
           JOIN c.members m
           WHERE m.user = :user AND m.leftAt IS NULL AND c.type = 'GROUP'
           ORDER BY c.lastMessageAt DESC NULLS LAST
           """)
    List<Conversation> findGroupsByMember(@Param("user") User user);
}
