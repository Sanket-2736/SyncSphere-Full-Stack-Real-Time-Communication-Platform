package com.chat_application.backend.controller;

import com.chat_application.backend.dto.AuthResponse;
import com.chat_application.backend.dto.LoginRequest;
import com.chat_application.backend.dto.RegisterRequest;
import com.chat_application.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@AllArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        System.out.println("🔵 [REGISTER] Incoming request - Username: " + request.getUsername() + ", Email: " + request.getEmail());
        try {
            AuthResponse response = userService.register(request);
            System.out.println("✅ [REGISTER] Success - User registered: " + request.getUsername());
            log.info("User registered: {}", request.getUsername());
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            System.out.println("❌ [REGISTER] Error - " + e.getMessage());
            log.error("Registration failed: {}", e.getMessage());
            throw e;
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        System.out.println("🔵 [LOGIN] Incoming request - Username: " + request.getUsername());
        try {
            AuthResponse response = userService.login(request);
            System.out.println("✅ [LOGIN] Success - User logged in: " + request.getUsername());
            log.info("User logged in: {}", request.getUsername());
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            System.out.println("❌ [LOGIN] Error - " + e.getMessage());
            log.error("Login failed: {}", e.getMessage());
            throw e;
        }
    }
}
