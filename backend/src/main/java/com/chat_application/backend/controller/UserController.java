package com.chat_application.backend.controller;

import com.chat_application.backend.dto.*;
import com.chat_application.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@AllArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {

    private final UserService userService;

    /**
     * Get current user's profile
     * Requires authentication
     */
    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDto> getCurrentUserProfile(Principal principal) {
        System.out.println("🔵 [GET_PROFILE] Fetching profile for user: " + principal.getName());
        try {
            log.info("Fetching profile for user: {}", principal.getName());
            UserDto userDto = userService.getUserByUsername(principal.getName());
            System.out.println("✅ [GET_PROFILE] Profile fetched: " + userDto.getId());
            return ResponseEntity.ok(userDto);
        } catch (RuntimeException e) {
            System.out.println("❌ [GET_PROFILE] Error - " + e.getMessage());
            log.error("Error fetching user profile: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Get user profile by ID
     */
    @GetMapping("/{userId}")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long userId) {
        System.out.println("🔵 [GET_USER_BY_ID] Fetching user profile for ID: " + userId);
        try {
            log.info("Fetching user profile for ID: {}", userId);
            UserDto userDto = userService.getUserById(userId);
            System.out.println("✅ [GET_USER_BY_ID] User found: " + userDto.getUsername());
            return ResponseEntity.ok(userDto);
        } catch (RuntimeException e) {
            System.out.println("❌ [GET_USER_BY_ID] Error - " + e.getMessage());
            log.error("Error fetching user by ID: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Get user profile by username
     */
    @GetMapping("/username/{username}")
    public ResponseEntity<UserDto> getUserByUsername(@PathVariable String username) {
        System.out.println("🔵 [GET_USER_BY_USERNAME] Fetching user profile for username: " + username);
        try {
            log.info("Fetching user profile for username: {}", username);
            UserDto userDto = userService.getUserByUsername(username);
            System.out.println("✅ [GET_USER_BY_USERNAME] User found: " + userDto.getId());
            return ResponseEntity.ok(userDto);
        } catch (RuntimeException e) {
            System.out.println("❌ [GET_USER_BY_USERNAME] Error - " + e.getMessage());
            log.error("Error fetching user by username: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Update current user's profile
     * Requires authentication
     */
    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDto> updateUserProfile(
            @Valid @RequestBody ProfileUpdateRequest request,
            Principal principal) {
        System.out.println("🔵 [UPDATE_PROFILE] Updating profile for user: " + principal.getName());
        try {
            log.info("Updating profile for user: {}", principal.getName());
            UserDto userDto = userService.getUserByUsername(principal.getName());
            
            UserDto updatedUser = userService.updateUserProfile(
                    userDto.getId(),
                    request.getFirstName(),
                    request.getLastName(),
                    request.getAvatarUrl()
            );
            System.out.println("✅ [UPDATE_PROFILE] Profile updated");
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            System.out.println("❌ [UPDATE_PROFILE] Error - " + e.getMessage());
            log.error("Error updating user profile: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Update user's status (Online, Offline, Away, Do Not Disturb)
     * Requires authentication
     */
    @PutMapping("/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> updateUserStatus(
            @Valid @RequestBody StatusUpdateRequest request,
            Principal principal) {
        System.out.println("🔵 [UPDATE_STATUS] Updating status for user: " + principal.getName() + " to " + request.getStatus());
        try {
            log.info("Updating status for user: {} to {}", principal.getName(), request.getStatus());
            UserDto userDto = userService.getUserByUsername(principal.getName());
            userService.updateUserStatus(userDto.getId(), request.getStatus());
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Status updated successfully");
            response.put("status", request.getStatus().toString());
            System.out.println("✅ [UPDATE_STATUS] Status updated");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            System.out.println("❌ [UPDATE_STATUS] Error - " + e.getMessage());
            log.error("Error updating user status: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Search users by name or username
     * Requires authentication
     */
    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UserSearchResponse>> searchUsers(
            @RequestParam String query,
            Principal principal) {
        System.out.println("🔵 [SEARCH_USERS] Searching for users with query: " + query);
        try {
            log.info("Searching for users with query: {}", query);
            UserDto currentUser = userService.getUserByUsername(principal.getName());
            List<UserSearchResponse> results = userService.searchUsers(query, currentUser.getId());
            System.out.println("✅ [SEARCH_USERS] Found " + results.size() + " users");
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            System.out.println("❌ [SEARCH_USERS] Error - " + e.getMessage());
            log.error("Error searching users: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Get all users (excluding self and blocked users)
     * Requires authentication
     */
    @GetMapping("/all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UserSearchResponse>> getAllUsers(Principal principal) {
        System.out.println("🔵 [GET_ALL_USERS] Fetching all users for: " + principal.getName());
        try {
            log.info("Fetching all users for: {}", principal.getName());
            UserDto currentUser = userService.getUserByUsername(principal.getName());
            List<UserSearchResponse> results = userService.getAllUsers(currentUser.getId());
            System.out.println("✅ [GET_ALL_USERS] Found " + results.size() + " users");
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            System.out.println("❌ [GET_ALL_USERS] Error - " + e.getMessage());
            log.error("Error fetching all users: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Block a user
     * Requires authentication
     */
    @PostMapping("/{userId}/block")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> blockUser(
            @PathVariable Long userId,
            Principal principal) {
        System.out.println("🔵 [BLOCK_USER] User " + principal.getName() + " is blocking user " + userId);
        try {
            log.info("User {} is blocking user {}", principal.getName(), userId);
            UserDto currentUser = userService.getUserByUsername(principal.getName());
            
            if (currentUser.getId().equals(userId)) {
                System.out.println("❌ [BLOCK_USER] Cannot block yourself");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Cannot block yourself"));
            }
            
            userService.blockUser(currentUser.getId(), userId);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "User blocked successfully");
            System.out.println("✅ [BLOCK_USER] User blocked");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            System.out.println("❌ [BLOCK_USER] Error - " + e.getMessage());
            log.error("Error blocking user: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Unblock a user
     * Requires authentication
     */
    @PostMapping("/{userId}/unblock")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> unblockUser(
            @PathVariable Long userId,
            Principal principal) {
        System.out.println("🔵 [UNBLOCK_USER] User " + principal.getName() + " is unblocking user " + userId);
        try {
            log.info("User {} is unblocking user {}", principal.getName(), userId);
            UserDto currentUser = userService.getUserByUsername(principal.getName());
            userService.unblockUser(currentUser.getId(), userId);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "User unblocked successfully");
            System.out.println("✅ [UNBLOCK_USER] User unblocked");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            System.out.println("❌ [UNBLOCK_USER] Error - " + e.getMessage());
            log.error("Error unblocking user: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get current user's blocked users list
     * Requires authentication
     */
    @GetMapping("/blocked")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UserSearchResponse>> getBlockedUsers(Principal principal) {
        System.out.println("🔵 [GET_BLOCKED_USERS] Fetching blocked users for: " + principal.getName());
        try {
            log.info("Fetching blocked users for: {}", principal.getName());
            UserDto currentUser = userService.getUserByUsername(principal.getName());
            List<UserSearchResponse> blockedUsers = userService.getBlockedUsers(currentUser.getId());
            System.out.println("✅ [GET_BLOCKED_USERS] Found " + blockedUsers.size() + " blocked users");
            return ResponseEntity.ok(blockedUsers);
        } catch (RuntimeException e) {
            System.out.println("❌ [GET_BLOCKED_USERS] Error - " + e.getMessage());
            log.error("Error fetching blocked users: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Check if a user is blocked
     * Requires authentication
     */
    @GetMapping("/{userId}/is-blocked")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Boolean>> isUserBlocked(
            @PathVariable Long userId,
            Principal principal) {
        System.out.println("🔵 [IS_USER_BLOCKED] Checking if user " + userId + " is blocked by " + principal.getName());
        try {
            log.info("Checking if user {} is blocked by {}", userId, principal.getName());
            UserDto currentUser = userService.getUserByUsername(principal.getName());
            boolean isBlocked = userService.isUserBlocked(currentUser.getId(), userId);
            
            Map<String, Boolean> response = new HashMap<>();
            response.put("isBlocked", isBlocked);
            System.out.println("✅ [IS_USER_BLOCKED] Result: " + isBlocked);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            System.out.println("❌ [IS_USER_BLOCKED] Error - " + e.getMessage());
            log.error("Error checking if user is blocked: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}
