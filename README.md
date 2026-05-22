# Chat Application with Video Call

A modern, full-featured real-time chat application with integrated audio and video calling capabilities. Built with Spring Boot backend and React frontend, featuring WebSocket for real-time messaging and WebRTC for peer-to-peer calls.

## 🌟 Features

### Messaging
- **Real-time Chat**: Instant message delivery with WebSocket
- **Optimistic UI**: Messages appear instantly before server confirmation
- **Message Status**: SENDING → SENT → DELIVERED → READ progression
- **Message Editing**: Edit sent messages with edit indicator
- **Message Deletion**: Delete messages with "This message was deleted" placeholder
- **Reactions**: Add emoji reactions to messages
- **Reply to Messages**: Quote and reply to specific messages
- **Pinned Messages**: Pin important messages for easy reference
- **Typing Indicators**: See when others are typing (debounced 300ms)
- **Read Receipts**: Know when messages are read
- **Unread Count**: Badge showing unread messages per conversation

### Conversations
- **Direct Messages**: One-on-one conversations with user search
- **Group Chats**: Create and manage group conversations
- **Conversation Management**: Delete conversations with confirmation
- **Last Message Preview**: See last message in conversation list
- **Conversation Search**: Search through conversations
- **User Search**: Find and start conversations with users

### Audio & Video Calls
- **Audio Calls**: Crystal clear peer-to-peer audio
- **Video Calls**: HD video calling with WebRTC
- **Call Notifications**: Incoming call alerts with ringtone
- **Call Controls**: Mute (M), Camera toggle (V), End call (Escape)
- **Call Duration**: Timer showing call length
- **Call State Persistence**: Resume calls after page reload
- **ICE Candidates**: Automatic NAT traversal with STUN servers

### User Management
- **User Authentication**: Secure login and registration
- **Status Management**: Online, Away, Do Not Disturb, Offline
- **User Profiles**: View and edit user information
- **User Blocking**: Block users from messaging you
- **Presence Tracking**: See user online status in real-time

### UI/UX
- **Modern Design**: Gradient backgrounds, shadows, smooth transitions
- **Dark Theme**: Easy on the eyes with slate color palette
- **Responsive Layout**: Works on desktop and tablet
- **Notification Bell**: Centralized notification management
- **Connection Status**: Visual indicator for WebSocket connection
- **Empty States**: Helpful messages when no data available
- **Loading States**: Smooth loading indicators

## 🏗️ Architecture

### Backend (Spring Boot)
```
backend/
├── controller/          # REST & WebSocket endpoints
├── service/            # Business logic
├── model/              # JPA entities
├── dto/                # Data transfer objects
├── config/             # Spring configuration
├── security/           # JWT authentication
└── repository/         # Database access
```

**Key Technologies:**
- Spring Boot 3.x
- Spring WebSocket (STOMP)
- Spring Security (JWT)
- JPA/Hibernate
- PostgreSQL/MySQL
- Maven

### Frontend (React)
```
frontend/
├── components/         # React components
├── pages/             # Page components
├── hooks/             # Custom React hooks
├── store/             # Zustand state management
├── context/           # React context (Auth, WebSocket)
├── api/               # Axios instance & API calls
└── styles/            # Tailwind CSS
```

**Key Technologies:**
- React 18
- Vite (build tool)
- Zustand (state management)
- Axios (HTTP client)
- WebRTC (peer-to-peer calls)
- SockJS (WebSocket fallback)
- Tailwind CSS (styling)

## 🚀 Getting Started

### Prerequisites
- Java 17+
- Node.js 16+
- PostgreSQL 12+ (or MySQL)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Configure database** in `src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/chat_db
   spring.datasource.username=postgres
   spring.datasource.password=your_password
   spring.jpa.hibernate.ddl-auto=update
   ```

3. **Build and run:**
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

   Backend runs on `http://localhost:8080`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

   Frontend runs on `http://localhost:5173`

4. **Build for production:**
   ```bash
   npm run build
   ```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new user

### Conversations
- `GET /api/chat/conversations` - List all conversations
- `POST /api/chat/conversations/direct` - Create/get direct conversation
- `POST /api/chat/conversations/group` - Create group
- `DELETE /api/chat/conversations/{id}` - Delete conversation

### Messages
- `GET /api/chat/conversations/{id}/messages` - Get messages (paginated)
- `POST /api/chat/messages` - Send message
- `PUT /api/chat/messages/{id}` - Edit message
- `DELETE /api/chat/messages/{id}` - Delete message
- `POST /api/chat/messages/{id}/reactions` - Add reaction
- `POST /api/chat/messages/{id}/pin` - Pin message
- `DELETE /api/chat/messages/{id}/pin` - Unpin message

### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/status` - Update user status
- `GET /api/users/search` - Search users
- `PUT /api/users/block` - Block user

### Calls
- `GET /api/audio-calls/status` - Get active audio call status
- `GET /api/video-calls/status` - Get active video call status

## 🔌 WebSocket Events

### Client → Server
- `/app/chat.send` - Send message
- `/app/chat.typing` - Send typing indicator
- `/app/chat.read` - Mark message as read
- `/app/signal` - WebRTC signaling (call-request, offer, answer, ice-candidate)

### Server → Client
- `/user/queue/messages` - Receive messages
- `/topic/conversation/{id}/typing` - Typing indicators
- `/user/queue/signal` - WebRTC signals
- `/topic/conversation/{id}/updates` - Message updates (edit, delete, reactions)

## 🔐 Security

- **JWT Authentication**: Secure token-based auth
- **CORS Configuration**: Restricted cross-origin requests
- **Password Hashing**: BCrypt for password security
- **WebSocket Security**: Authenticated WebSocket connections
- **Input Validation**: Server-side validation on all inputs

## 📊 Database Schema

### Key Tables
- `users` - User accounts and profiles
- `conversations` - Chat conversations (direct & group)
- `conversation_members` - Conversation membership
- `messages` - Chat messages
- `message_reactions` - Emoji reactions
- `pinned_messages` - Pinned message references
- `user_blocks` - User blocking relationships

## 🎯 Key Features Implementation

### Optimistic UI
Messages appear instantly in the UI before server confirmation. If the server rejects the message, it's marked as FAILED with a retry button.

### Typing Indicators
Debounced (300ms) typing events prevent excessive WebSocket traffic while providing real-time feedback.

### Read Receipts
When a conversation is opened, a read event is published for the latest message, updating the message status to READ.

### Call State Persistence
On app load, the system checks for active calls via API and restores the call overlay if needed.

### Message Status Progression
- **SENDING**: Message being transmitted
- **SENT**: Server received message
- **DELIVERED**: Message delivered to recipient
- **READ**: Recipient has read the message

## 🛠️ Development

### Code Style
- **Backend**: Java conventions, Spring best practices
- **Frontend**: React hooks, functional components, Tailwind CSS

### State Management
- **Backend**: Spring services with dependency injection
- **Frontend**: Zustand for global state, React Context for auth/WebSocket

### Error Handling
- Comprehensive error messages
- Graceful fallbacks for network issues
- User-friendly error notifications

## 📝 Commit Message

```
feat: Complete chat application with video calling

- Implement real-time messaging with WebSocket (STOMP)
- Add audio and video calling with WebRTC
- Create modern UI with gradient backgrounds and smooth transitions
- Add message features: reactions, replies, pins, editing, deletion
- Implement optimistic UI for instant message feedback
- Add typing indicators with 300ms debounce
- Implement read receipts and message status progression
- Add conversation management with delete functionality
- Implement user search and direct messaging
- Add group chat creation and management
- Implement user status management (Online, Away, DND, Offline)
- Add notification system with unread count badges
- Implement call state persistence across page reloads
- Add comprehensive error handling and validation
- Improve UI/UX with modern design patterns
- Add connection status indicator
- Implement message pagination for performance
- Add user blocking functionality
- Implement JWT authentication and security
- Add responsive design for multiple screen sizes
```

## 🐛 Known Issues & Future Improvements

### Known Issues
- None currently reported

### Future Improvements
- [ ] Message search across conversations
- [ ] Voice messages
- [ ] File sharing with preview
- [ ] Screen sharing during calls
- [ ] Message encryption
- [ ] User presence indicators
- [ ] Conversation archiving
- [ ] Message reactions with custom emojis
- [ ] Call recording
- [ ] Mobile app (React Native)

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 👥 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the development team.

## 🙏 Acknowledgments

- Spring Boot team for excellent framework
- React community for amazing tools
- WebRTC for peer-to-peer communication
- Tailwind CSS for beautiful styling

---

**Last Updated**: May 22, 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅
