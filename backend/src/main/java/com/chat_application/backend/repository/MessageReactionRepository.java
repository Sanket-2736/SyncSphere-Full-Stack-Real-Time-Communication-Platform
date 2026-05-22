package com.chat_application.backend.repository;

import com.chat_application.backend.model.Message;
import com.chat_application.backend.model.MessageReaction;
import com.chat_application.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageReactionRepository extends JpaRepository<MessageReaction, Long> {

    List<MessageReaction> findByMessage(Message message);

    Optional<MessageReaction> findByMessageAndUserAndEmoji(Message message, User user, String emoji);

    boolean existsByMessageAndUserAndEmoji(Message message, User user, String emoji);

    /** Aggregate reaction counts per emoji for a message. */
    @Query("""
           SELECT r.emoji, COUNT(r) FROM MessageReaction r
           WHERE r.message = :message
           GROUP BY r.emoji
           """)
    List<Object[]> countByEmoji(@Param("message") Message message);
}
