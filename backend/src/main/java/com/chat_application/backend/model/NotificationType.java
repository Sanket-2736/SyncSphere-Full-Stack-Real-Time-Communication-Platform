package com.chat_application.backend.model;

public enum NotificationType {
    // ── Chat ──────────────────────────────────────────────────────────────────
    NEW_MESSAGE,          // Someone sent you a message
    NEW_GROUP_MESSAGE,    // New message in a group you belong to
    MENTION,              // You were @mentioned (future use)

    // ── Audio Calls ───────────────────────────────────────────────────────────
    INCOMING_CALL,        // Someone is calling you right now (real-time only)
    MISSED_CALL,          // You didn't answer a call

    // ── Video Calls ───────────────────────────────────────────────────────────
    INCOMING_VIDEO_CALL,  // Someone is video calling you right now (real-time only)
    MISSED_VIDEO_CALL,    // You didn't answer a video call

    // ── Social ────────────────────────────────────────────────────────────────
    GROUP_ADDED,          // You were added to a group
    GROUP_REMOVED         // You were removed from a group
}
