# Audio and Video Calling Features

This document describes the audio and video calling implementation in the chat application using WebRTC signaling over WebSocket (STOMP).

## Overview

The application supports both **audio** and **video** calling through WebRTC peer-to-peer connections. The signaling (call setup, negotiation) is handled via WebSocket, while the actual media streams are transmitted directly between peers using WebRTC.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Chat Application                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         WebSocket (STOMP) - Signaling               │  │
│  │  - Call requests/responses                          │  │
│  │  - WebRTC offer/answer                              │  │
│  │  - ICE candidates                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │    SignalingController (Relay Messages)             │  │
│  │    AudioCallService (Session Management)            │  │
│  │    VideoCallService (Session Management)            │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         WebRTC Peer-to-Peer Connection              │  │
│  │  - Audio/Video Media Streams                        │  │
│  │  - Direct peer communication                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. SignalingController
**Location:** `controller/SignalingController.java`

Handles WebRTC signaling messages over WebSocket. Routes messages between peers and manages call lifecycle.

**Endpoints:**
- `@MessageMapping("/signal")` - Relay WebRTC signaling messages

**Signal Types:**
- **Audio Calls:**
  - `call-request` - Initiate audio call
  - `call-accepted` - Accept audio call
  - `call-rejected` - Reject audio call
  - `call-ended` - End audio call
  
- **Video Calls:**
  - `video-call-request` - Initiate video call
  - `video-call-accepted` - Accept video call
  - `video-call-rejected` - Reject video call
  - `video-call-ended` - End video call
  
- **WebRTC Negotiation (both audio & video):**
  - `offer` - WebRTC offer
  - `answer` - WebRTC answer
  - `ice-candidate` - ICE candidate for NAT traversal

### 2. AudioCallService
**Location:** `service/AudioCallService.java`

Manages audio call sessions, tracking active calls and call history.

**Key Methods:**
- `initiateAudioCall(User caller, User recipient)` - Start new audio call
- `acceptAudioCall(String callId, User recipient)` - Accept incoming call
- `rejectAudioCall(String callId, User recipient)` - Reject incoming call
- `endAudioCall(String callId, User user)` - End active call
- `isUserInAudioCall(Long userId)` - Check if user is in call
- `getUserActiveAudioCall(Long userId)` - Get user's active call
- `getAllActiveAudioCallSessions()` - Get all active sessions
- `cleanupStaleAudioCallSessions()` - Clean up old sessions

**Session Data:**
```java
AudioCallSession {
    String callId;                  // Unique call identifier
    Long callerId;                  // Caller's user ID
    String callerUsername;          // Caller's username
    Long recipientId;               // Recipient's user ID
    String recipientUsername;       // Recipient's username
    String callType;                // "AUDIO"
    String status;                  // "INITIATED", "ACCEPTED", "REJECTED", "ENDED"
    LocalDateTime startedAt;        // Call start time
    LocalDateTime acceptedAt;       // Call acceptance time
    LocalDateTime endedAt;          // Call end time
    Long durationSeconds;           // Call duration (when ended)
}
```

### 3. VideoCallService
**Location:** `service/VideoCallService.java`

Manages video call sessions, tracking active calls and call history.

**Key Methods:**
- `initiateVideoCall(User caller, User recipient)` - Start new video call
- `acceptVideoCall(String callId, User recipient)` - Accept incoming call
- `rejectVideoCall(String callId, User recipient)` - Reject incoming call
- `endVideoCall(String callId, User user)` - End active call
- `isUserInVideoCall(Long userId)` - Check if user is in call
- `getUserActiveVideoCall(Long userId)` - Get user's active call
- `getAllActiveVideoCallSessions()` - Get all active sessions
- `cleanupStaleVideoCallSessions()` - Clean up old sessions

**Session Data:**
```java
VideoCallSession {
    String callId;                  // Unique call identifier
    Long callerId;                  // Caller's user ID
    String callerUsername;          // Caller's username
    Long recipientId;               // Recipient's user ID
    String recipientUsername;       // Recipient's username
    String callType;                // "VIDEO"
    String status;                  // "INITIATED", "ACCEPTED", "REJECTED", "ENDED"
    LocalDateTime startedAt;        // Call start time
    LocalDateTime acceptedAt;       // Call acceptance time
    LocalDateTime endedAt;          // Call end time
    Long durationSeconds;           // Call duration (when ended)
}
```

### 4. AudioCallController
**Location:** `controller/AudioCallController.java`

REST API endpoints for audio call management and monitoring.

**Endpoints:**
- `GET /api/audio-calls/status` - Get current user's audio call status
- `GET /api/audio-calls/active` - Get all active audio call sessions
- `GET /api/audio-calls/user/{userId}/in-call` - Check if user is in audio call
- `GET /api/audio-calls/{callId}` - Get audio call session details
- `GET /api/audio-calls/health` - Health check

### 5. VideoCallController
**Location:** `controller/VideoCallController.java`

REST API endpoints for video call management and monitoring.

**Endpoints:**
- `GET /api/video-calls/status` - Get current user's video call status
- `GET /api/video-calls/active` - Get all active video call sessions
- `GET /api/video-calls/user/{userId}/in-call` - Check if user is in video call
- `GET /api/video-calls/{callId}` - Get video call session details
- `GET /api/video-calls/health` - Health check

### 6. VideoCallScheduler
**Location:** `config/VideoCallScheduler.java`

Scheduled tasks for call session cleanup and monitoring.

**Tasks:**
- `cleanupStaleVideoCallSessions()` - Runs every 30 minutes
- `cleanupStaleAudioCallSessions()` - Runs every 30 minutes
- `logActiveCallSessions()` - Runs every 5 minutes

## Call Flow

### Audio Call Flow

```
Caller                          Server                          Recipient
  │                               │                               │
  ├─ call-request ──────────────→ │                               │
  │                               ├─ Create AudioCallSession      │
  │                               ├─ Send notification            │
  │                               ├─ Relay to recipient ─────────→│
  │                               │                               │
  │                               │ ←─ call-accepted ─────────────┤
  │                               ├─ Update session status        │
  │                               ├─ Relay to caller ────────────→│
  │                               │                               │
  ├─ offer ──────────────────────→ │                               │
  │                               ├─ Relay to recipient ─────────→│
  │                               │                               │
  │                               │ ←─ answer ────────────────────┤
  │                               ├─ Relay to caller ────────────→│
  │                               │                               │
  ├─ ice-candidate ──────────────→ │                               │
  │                               ├─ Relay to recipient ─────────→│
  │                               │                               │
  │                               │ ←─ ice-candidate ─────────────┤
  │                               ├─ Relay to caller ────────────→│
  │                               │                               │
  │ ◄─────── WebRTC Connection ──────────────────────────────────→│
  │          (Audio Stream)                                        │
  │                               │                               │
  ├─ call-ended ─────────────────→ │                               │
  │                               ├─ End session                  │
  │                               ├─ Relay to recipient ─────────→│
  │                               │                               │
```

### Video Call Flow

Same as audio call flow, but with:
- `video-call-request` instead of `call-request`
- `video-call-accepted` instead of `call-accepted`
- `video-call-ended` instead of `call-ended`
- Video stream instead of audio stream

## WebSocket Message Format

### SignalMessage DTO
```json
{
  "type": "call-request|call-accepted|call-rejected|call-ended|video-call-request|video-call-accepted|video-call-rejected|video-call-ended|offer|answer|ice-candidate",
  "senderId": 123,
  "senderUsername": "john_doe",
  "targetUserId": 456,
  "callId": "audio-call-123-456-1234567890",
  "sdp": "v=0\r\no=- ...",
  "candidate": "{\"candidate\": \"candidate:...\", ...}"
}
```

### WebSocket Subscription
Clients should subscribe to:
```
/user/queue/signal
```

### WebSocket Publishing
Clients should publish to:
```
/app/signal
```

## REST API Examples

### Check Audio Call Status
```bash
curl -X GET http://localhost:8080/api/audio-calls/status \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "inCall": true,
  "callId": "audio-call-123-456-1234567890",
  "callType": "AUDIO",
  "status": "ACCEPTED",
  "otherPartyId": 456,
  "otherPartyUsername": "jane_doe",
  "startedAt": "2024-01-15T10:30:00",
  "acceptedAt": "2024-01-15T10:30:05"
}
```

### Check Video Call Status
```bash
curl -X GET http://localhost:8080/api/video-calls/status \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "inCall": true,
  "callId": "video-call-123-456-1234567890",
  "callType": "VIDEO",
  "status": "ACCEPTED",
  "otherPartyId": 456,
  "otherPartyUsername": "jane_doe",
  "startedAt": "2024-01-15T10:30:00",
  "acceptedAt": "2024-01-15T10:30:05"
}
```

### Get All Active Audio Calls
```bash
curl -X GET http://localhost:8080/api/audio-calls/active \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "activeCallCount": 2,
  "sessions": [
    {
      "callId": "audio-call-123-456-1234567890",
      "callerId": 123,
      "callerUsername": "john_doe",
      "recipientId": 456,
      "recipientUsername": "jane_doe",
      "callType": "AUDIO",
      "status": "ACCEPTED",
      "startedAt": "2024-01-15T10:30:00",
      "acceptedAt": "2024-01-15T10:30:05"
    }
  ]
}
```

## Notifications

The system sends notifications for call events:

### Incoming Call Notification
- **Type:** Real-time (not persisted)
- **Trigger:** When `call-request` or `video-call-request` is received
- **Recipient:** Target user

### Missed Call Notification
- **Type:** Persisted
- **Trigger:** When call is rejected or ended before being answered
- **Recipient:** Target user

### Incoming Video Call Notification
- **Type:** Real-time (not persisted)
- **Trigger:** When `video-call-request` is received
- **Recipient:** Target user

### Missed Video Call Notification
- **Type:** Persisted
- **Trigger:** When video call is rejected or ended before being answered
- **Recipient:** Target user

## Client Implementation Example

### JavaScript/TypeScript Client

```typescript
// Connect to WebSocket
const stompClient = new StompJs.Client({
  brokerURL: 'ws://localhost:8080/ws',
  connectHeaders: {
    Authorization: `Bearer ${token}`
  }
});

stompClient.onConnect = () => {
  // Subscribe to incoming signals
  stompClient.subscribe('/user/queue/signal', (message) => {
    const signal = JSON.parse(message.body);
    handleSignal(signal);
  });
};

stompClient.activate();

// Initiate audio call
function initiateAudioCall(targetUserId) {
  const signal = {
    type: 'call-request',
    targetUserId: targetUserId
  };
  stompClient.publish({
    destination: '/app/signal',
    body: JSON.stringify(signal)
  });
}

// Initiate video call
function initiateVideoCall(targetUserId) {
  const signal = {
    type: 'video-call-request',
    targetUserId: targetUserId
  };
  stompClient.publish({
    destination: '/app/signal',
    body: JSON.stringify(signal)
  });
}

// Accept call
function acceptCall(callId, targetUserId, isVideo = false) {
  const signal = {
    type: isVideo ? 'video-call-accepted' : 'call-accepted',
    targetUserId: targetUserId,
    callId: callId
  };
  stompClient.publish({
    destination: '/app/signal',
    body: JSON.stringify(signal)
  });
}

// Send WebRTC offer
function sendOffer(targetUserId, sdp) {
  const signal = {
    type: 'offer',
    targetUserId: targetUserId,
    sdp: sdp
  };
  stompClient.publish({
    destination: '/app/signal',
    body: JSON.stringify(signal)
  });
}

// Send ICE candidate
function sendIceCandidate(targetUserId, candidate) {
  const signal = {
    type: 'ice-candidate',
    targetUserId: targetUserId,
    candidate: JSON.stringify(candidate)
  };
  stompClient.publish({
    destination: '/app/signal',
    body: JSON.stringify(signal)
  });
}

// End call
function endCall(targetUserId, isVideo = false) {
  const signal = {
    type: isVideo ? 'video-call-ended' : 'call-ended',
    targetUserId: targetUserId
  };
  stompClient.publish({
    destination: '/app/signal',
    body: JSON.stringify(signal)
  });
}

// Handle incoming signals
function handleSignal(signal) {
  switch (signal.type) {
    case 'call-request':
      handleIncomingAudioCall(signal);
      break;
    case 'video-call-request':
      handleIncomingVideoCall(signal);
      break;
    case 'call-accepted':
    case 'video-call-accepted':
      handleCallAccepted(signal);
      break;
    case 'offer':
      handleOffer(signal);
      break;
    case 'answer':
      handleAnswer(signal);
      break;
    case 'ice-candidate':
      handleIceCandidate(signal);
      break;
    case 'call-ended':
    case 'video-call-ended':
      handleCallEnded(signal);
      break;
  }
}
```

## Security Considerations

1. **Authentication:** All WebSocket connections require JWT authentication
2. **Authorization:** Users can only receive signals intended for them
3. **Sender Verification:** Server overwrites sender info from authenticated principal
4. **Call Validation:** Only call participants can accept/reject/end calls
5. **Session Cleanup:** Stale sessions are automatically cleaned up every 30 minutes

## Performance Considerations

1. **In-Memory Storage:** Call sessions are stored in ConcurrentHashMap for fast access
2. **Scalability:** For distributed deployments, consider using Redis for session storage
3. **Cleanup:** Automatic cleanup prevents memory leaks from abandoned sessions
4. **Monitoring:** Active call count is logged every 5 minutes for monitoring

## Future Enhancements

1. **Call History:** Persist call records to database
2. **Call Recording:** Add support for recording audio/video calls
3. **Group Calls:** Extend to support multi-party calls
4. **Call Transfer:** Implement call transfer between users
5. **Call Forwarding:** Add call forwarding capabilities
6. **Voicemail:** Add voicemail support for missed calls
7. **Call Analytics:** Track call metrics and statistics
8. **Screen Sharing:** Add screen sharing capability for video calls

## Troubleshooting

### Call Not Connecting
1. Check WebSocket connection status
2. Verify JWT token is valid
3. Check firewall/NAT settings
4. Verify both users are online

### Audio/Video Not Working
1. Check browser permissions for microphone/camera
2. Verify WebRTC configuration
3. Check ICE candidate exchange
4. Review browser console for errors

### Missed Notifications
1. Verify notification service is running
2. Check user subscription status
3. Review notification logs

## References

- [WebRTC Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [STOMP Protocol](https://stomp.github.io/)
- [Spring WebSocket Documentation](https://spring.io/guides/gs/messaging-stomp-websocket/)
