package com.chat_application.backend.repository;

import com.chat_application.backend.model.Conversation;
import com.chat_application.backend.model.ConversationMember;
import com.chat_application.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationMemberRepository extends JpaRepository<ConversationMember, Long> {

    Optional<ConversationMember> findByConversationAndUser(Conversation conversation, User user);

    List<ConversationMember> findByConversationAndLeftAtIsNull(Conversation conversation);

    @Query("SELECT cm FROM ConversationMember cm WHERE cm.conversation = :conversation AND cm.leftAt IS NULL")
    List<ConversationMember> findActiveMembers(@Param("conversation") Conversation conversation);

    boolean existsByConversationAndUserAndLeftAtIsNull(Conversation conversation, User user);
}
