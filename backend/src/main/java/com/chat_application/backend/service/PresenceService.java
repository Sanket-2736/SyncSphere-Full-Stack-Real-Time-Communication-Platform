package com.chat_application.backend.service;

import com.chat_application.backend.dto.PresenceEvent;
import com.chat_application.backend.model.UserStatus;
import com.chat_application.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class PresenceService {

    private final UserRepository        userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * username → sessionId for all currently connected WebSocket sessions.
     * Not injected — initialised here as a plain field.
     */
    private final Map<String, String> activeSessions = new ConcurrentHashMap<>();

    @Transactional
    public void userConnected(String username, String sessionId) {
        activeSessions.put(username, sessionId);
        updateAndBroadcast(username, UserStatus.ONLINE);
        log.info("User connected: {} (session: {})", username, sessionId);
    }

    @Transactional
    public void userDisconnected(String username, String sessionId) {
        activeSessions.remove(username, sessionId);
        if (!activeSessions.containsKey(username)) {
            updateAndBroadcast(username, UserStatus.OFFLINE);
            log.info("User disconnected: {} (session: {})", username, sessionId);
        }
    }

    @Transactional
    public void updateStatus(String username, UserStatus status) {
        updateAndBroadcast(username, status);
    }

    public boolean isOnline(String username) {
        return activeSessions.containsKey(username);
    }

    private void updateAndBroadcast(String username, UserStatus status) {
        userRepository.findByUsername(username).ifPresent(user -> {
            user.setStatus(status);
            user.setLastSeen(LocalDateTime.now());
            userRepository.save(user);

            messagingTemplate.convertAndSend("/topic/presence",
                    PresenceEvent.builder()
                            .userId(user.getId())
                            .username(user.getUsername())
                            .status(status.name())
                            .build());
        });
    }
}
