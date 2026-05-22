package com.chat_application.backend.dto;

import lombok.*;

/**
 * Generic WebRTC signaling message transported over STOMP.
 * type: "offer" | "answer" | "ice-candidate" | "call-request" | "call-accepted" | "call-rejected" | "call-ended"
 *        "video-call-request" | "video-call-accepted" | "video-call-rejected" | "video-call-ended"
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignalMessage {

    /** Signaling type */
    private String type;

    /** Sender's user ID (set server-side, not trusted from client) */
    private Long senderId;

    /** Sender's username */
    private String senderUsername;

    /** Target user ID */
    private Long targetUserId;

    /** Call session ID (for tracking audio/video calls) */
    private String callId;

    /** SDP offer or answer (for "offer" / "answer" types) */
    private String sdp;

    /** ICE candidate JSON string (for "ice-candidate" type) */
    private String candidate;
}
