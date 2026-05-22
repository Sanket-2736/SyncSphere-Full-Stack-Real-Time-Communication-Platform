package com.chat_application.backend.repository;

import com.chat_application.backend.model.Conversation;
import com.chat_application.backend.model.Message;
import com.chat_application.backend.model.PinnedMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PinnedMessageRepository extends JpaRepository<PinnedMessage, Long> {

    List<PinnedMessage> findByConversationOrderByPinnedAtDesc(Conversation conversation);

    Optional<PinnedMessage> findByConversationAndMessage(Conversation conversation, Message message);

    boolean existsByConversationAndMessage(Conversation conversation, Message message);
}
