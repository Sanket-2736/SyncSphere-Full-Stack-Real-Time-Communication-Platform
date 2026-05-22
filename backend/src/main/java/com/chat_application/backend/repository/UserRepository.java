package com.chat_application.backend.repository;

import com.chat_application.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByUsername(String username);
    
    Optional<User> findByEmail(String email);
    
    Boolean existsByUsername(String username);
    
    Boolean existsByEmail(String email);
    
    @Query("SELECT u FROM User u WHERE LOWER(CONCAT(u.firstName, ' ', u.lastName)) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(u.username) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<User> searchUsersByNameOrUsername(@Param("searchTerm") String searchTerm);
    
    @Query("SELECT u FROM User u WHERE u.id != :userId " +
           "AND u NOT IN (SELECT bu FROM User u2 JOIN u2.blockedUsers bu WHERE u2.id = :userId) " +
           "AND (LOWER(CONCAT(u.firstName, ' ', u.lastName)) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(u.username) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<User> searchUsersByNameOrUsernameExcludingSelf(@Param("userId") Long userId, @Param("searchTerm") String searchTerm);
    
    @Query("SELECT u FROM User u WHERE u.id != :userId AND u NOT IN (SELECT bu FROM User u2 JOIN u2.blockedUsers bu WHERE u2.id = :userId)")
    List<User> findAllNonBlockedUsers(@Param("userId") Long userId);
}
