package com.chat_application.backend.repository;

import com.chat_application.backend.model.Notification;
import com.chat_application.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /** Paginated notifications for a user, newest first. */
    Page<Notification> findByRecipientOrderByCreatedAtDesc(User recipient, Pageable pageable);

    /** Count unread notifications for a user. */
    long countByRecipientAndReadFalse(User recipient);

    /** Mark a single notification as read. */
    @Modifying
    @Query("""
           UPDATE Notification n
           SET n.read = true, n.readAt = CURRENT_TIMESTAMP
           WHERE n.id = :id AND n.recipient = :recipient
           """)
    int markAsRead(@Param("id") Long id, @Param("recipient") User recipient);

    /** Mark all notifications for a user as read. */
    @Modifying
    @Query("""
           UPDATE Notification n
           SET n.read = true, n.readAt = CURRENT_TIMESTAMP
           WHERE n.recipient = :recipient AND n.read = false
           """)
    int markAllAsRead(@Param("recipient") User recipient);

    /** Delete notifications older than a given number of days (housekeeping). */
    @Modifying
    @Query("""
           DELETE FROM Notification n
           WHERE n.recipient = :recipient
             AND n.read = true
             AND n.createdAt < :before
           """)
    int deleteOldRead(@Param("recipient") User recipient,
                      @Param("before") java.time.LocalDateTime before);
}
