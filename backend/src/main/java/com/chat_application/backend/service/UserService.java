package com.chat_application.backend.service;

import com.chat_application.backend.dto.*;
import com.chat_application.backend.model.User;
import com.chat_application.backend.model.UserStatus;
import com.chat_application.backend.repository.UserRepository;
import com.chat_application.backend.security.JwtTokenProvider;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
@Slf4j
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * Register a new user
     */
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already taken");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .status(UserStatus.OFFLINE)
                .enabled(true)
                .accountNonExpired(true)
                .accountNonLocked(true)
                .credentialsNonExpired(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(user);
        log.info("User registered successfully: {}", savedUser.getUsername());

        String token = jwtTokenProvider.generateToken(savedUser.getUsername(), savedUser.getId());

        return AuthResponse.builder()
                .userId(savedUser.getId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .firstName(savedUser.getFirstName())
                .lastName(savedUser.getLastName())
                .token(token)
                .status(savedUser.getStatus().toString())
                .build();
    }

    /**
     * Login user
     */
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtTokenProvider.generateToken(user.getUsername(), user.getId());
        log.info("User logged in: {}", user.getUsername());

        return AuthResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .token(token)
                .status(user.getStatus().toString())
                .build();
    }

    /**
     * Get user by ID
     */
    public UserDto getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return convertToUserDto(user);
    }

    /**
     * Get user by username
     */
    public UserDto getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return convertToUserDto(user);
    }

    /**
     * Update user status
     */
    public void updateUserStatus(Long userId, UserStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setStatus(status);
        user.setLastSeen(LocalDateTime.now());
        userRepository.save(user);
        log.info("User status updated for user {}: {}", userId, status);
    }

    /**
     * Update user profile
     */
    public UserDto updateUserProfile(Long userId, String firstName, String lastName, String avatarUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (firstName != null && !firstName.isEmpty()) {
            user.setFirstName(firstName);
        }
        if (lastName != null && !lastName.isEmpty()) {
            user.setLastName(lastName);
        }
        if (avatarUrl != null && !avatarUrl.isEmpty()) {
            user.setAvatarUrl(avatarUrl);
        }

        user.setUpdatedAt(LocalDateTime.now());
        User updatedUser = userRepository.save(user);
        log.info("User profile updated for user: {}", userId);

        return convertToUserDto(updatedUser);
    }

    /**
     * Search users by name or username
     */
    public List<UserSearchResponse> searchUsers(String searchTerm, Long currentUserId) {
        List<User> users = userRepository.searchUsersByNameOrUsernameExcludingSelf(currentUserId, searchTerm);
        return users.stream()
                .map(this::convertToUserSearchResponse)
                .collect(Collectors.toList());
    }

    /**
     * Search all users (excluding self)
     */
    public List<UserSearchResponse> getAllUsers(Long currentUserId) {
        List<User> users = userRepository.findAllNonBlockedUsers(currentUserId);
        return users.stream()
                .map(this::convertToUserSearchResponse)
                .collect(Collectors.toList());
    }

    /**
     * Block a user
     */
    public void blockUser(Long userId, Long blockedUserId) {
        if (userId.equals(blockedUserId)) {
            throw new RuntimeException("Cannot block yourself");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        User blockedUser = userRepository.findById(blockedUserId)
                .orElseThrow(() -> new RuntimeException("Blocked user not found"));

        user.getBlockedUsers().add(blockedUser);
        userRepository.save(user);
        log.info("User {} blocked by {}", blockedUserId, userId);
    }

    /**
     * Unblock a user
     */
    public void unblockUser(Long userId, Long unblockedUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        User unblockedUser = userRepository.findById(unblockedUserId)
                .orElseThrow(() -> new RuntimeException("User to unblock not found"));

        user.getBlockedUsers().remove(unblockedUser);
        userRepository.save(user);
        log.info("User {} unblocked by {}", unblockedUserId, userId);
    }

    /**
     * Check if user is blocked
     */
    public boolean isUserBlocked(Long userId, Long targetUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return user.getBlockedUsers().stream()
                .anyMatch(blockedUser -> blockedUser.getId().equals(targetUserId));
    }

    /**
     * Get blocked users
     */
    public List<UserSearchResponse> getBlockedUsers(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return user.getBlockedUsers().stream()
                .map(this::convertToUserSearchResponse)
                .collect(Collectors.toList());
    }

    /**
     * Helper method to convert User to UserDto
     */
    private UserDto convertToUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .status(user.getStatus().toString())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }

    /**
     * Helper method to convert User to UserSearchResponse
     */
    private UserSearchResponse convertToUserSearchResponse(User user) {
        return UserSearchResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .status(user.getStatus().toString())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }
}
