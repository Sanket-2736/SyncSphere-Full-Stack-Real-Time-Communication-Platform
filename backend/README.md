# Chat Application Backend - Complete Documentation

A feature-rich, real-time chat application backend built with **Spring Boot 4.0.5**, **WebSocket/STOMP**, **JWT Authentication**, and **PostgreSQL**. This backend powers a modern messaging platform with support for direct conversations, group chats, WebRTC signaling, real-time notifications, voice calls, and rich media sharing.

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Core Features](#core-features)
3. [Technology Stack](#technology-stack)
4. [Architecture](#architecture)
5. [Database Schema](#database-schema)
6. [Project Structure](#project-structure)
7. [Installation & Setup](#installation--setup)
8. [Configuration](#configuration)
9. [Running the Application](#running-the-application)
10. [REST API Documentation](#rest-api-documentation)
11. [WebSocket/STOMP Guide](#websocketstomp-guide)
12. [Security & Authentication](#security--authentication)
13. [Troubleshooting](#troubleshooting)
14. [Development Guidelines](#development-guidelines)

---

## 🎯 Project Overview

The Chat Application Backend is a comprehensive messaging service that provides real-time communication capabilities with advanced features including:

- **Real-time Messaging**: Instant message delivery via WebSocket connections
- **User Management**: Complete user lifecycle management with profiles and status
- **Group Conversations**: Create, manage, and interact within group chats
- **Rich Media Support**: Share images, videos, and other files up to 50MB
- **WebRTC Integration**: Video and audio call signaling
- **Presence Management**: Real-time user online/offline status tracking
- **Message Features**: Reactions, pinned messages, message editing, read receipts
- **Notifications System**: In-app notifications for messages and events
- **User Blocking**: Block/unblock users with blocked list management
- **Typing Indicators**: Real-time typing status indicators
- **JWT-Based Security**: Stateless authentication with token-based security

---

## ✨ Core Features

### 1. **Authentication & Authorization**
- User registration and login with password hashing (BCrypt)
- JWT token-based authentication (stateless)
- Role-based access control (Group Owner, Admin, Member)
- Automatic token validation on WebSocket connections
- Session management with configurable expiration

### 2. **Messaging System**
- Send/receive messages in real-time
- Support for text, media, and system messages
- Message reactions (emoji reactions)
- Pin/unpin important messages
- Edit and delete message capabilities
- Message status tracking (SENT, DELIVERED, READ)
- Conversation read receipts

### 3. **Group Management**
- Create group conversations with multiple members
- Assign group roles (OWNER, ADMIN, MEMBER)
- Add/remove members from groups
- Edit group details (name, description, avatar)
- Owner-controlled group settings
- Group dissolution and archival

### 4. **Presence & Status**
- Real-time online/offline status
- Last seen timestamp tracking
- User availability indicators
- Presence event broadcasting

### 5. **Notification System**
- In-app notifications for messages
- Notification preferences management
- Mark notifications as read
- Notification history
- Multiple notification types (MESSAGE, CALL, GROUP_INVITE, etc.)

### 6. **Media Handling**
- Upload and download media files
- Support for images, videos, and documents
- Configurable file size limits (50MB max)
- Media URL generation for easy access
- Automatic media organization

### 7. **WebRTC Signaling**
- SDP offer/answer exchange for voice/video calls
- ICE candidate management
- Call initiation and termination
- Real-time signaling via WebSocket

---

## 🛠️ Technology Stack

### **Backend Framework**
- **Spring Boot**: 4.0.5 (Latest stable version)
- **Java**: 17 (LTS version with modern features)
- **Maven**: Build and dependency management

### **Database**
- **PostgreSQL**: 12+ (primary data store)
- **Spring Data JPA**: ORM and data access layer
- **Hibernate**: Entity relationship management

### **Real-time Communication**
- **Spring WebSocket**: WebSocket support
- **STOMP (Simple Text Oriented Messaging Protocol)**: Message protocol over WebSocket
- **Spring Messaging**: Message broadcasting and routing

### **Security**
- **Spring Security**: 6.x (authentication and authorization)
- **JWT (JSON Web Tokens)**: jjwt-0.12.3 (stateless authentication)
- **BCrypt**: Password hashing and verification

### **Data Validation & Serialization**
- **Spring Validation**: Bean validation (JSR-380)
- **Jackson**: JSON serialization/deserialization
- **Lombok**: Reduce boilerplate code

### **Logging**
- **SLF4J**: Logging facade
- **Logback**: Logging implementation

### **Testing**
- **Spring Boot Test**: Testing framework
- **Spring Security Test**: Security testing utilities

---

## 🏗️ Architecture

### **Architectural Pattern: Layered Architecture**

```
┌─────────────────────────────────────────────────────┐
│           Presentation Layer (Controllers)           │
│  (AuthController, ChatController, UserController)   │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│            Service Layer (Business Logic)            │
│  (ChatService, UserService, NotificationService)    │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│          Repository Layer (Data Access)              │
│  (JPA Repositories, Database Queries)               │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│         Database Layer (PostgreSQL)                  │
│  (Tables, Relations, Constraints)                   │
└─────────────────────────────────────────────────────┘
```

### **Communication Patterns**

#### **1. REST API Pattern** (HTTP Request/Response)
- Used for authentication, user management, configuration
- Stateless request-response cycle
- Standard HTTP methods (GET, POST, PUT, DELETE)

#### **2. WebSocket/STOMP Pattern** (Real-time bidirectional)
- Used for live messaging, presence, typing indicators
- Persistent connection maintains for duration of session
- STOMP frame-based protocol over WebSocket

#### **3. Event-Driven Pattern**
- Services emit events that broadcast to connected clients
- Decouples components through message passing
- Used for notifications, presence updates

---

## 🗄️ Database Schema

### **Core Entities**

#### **Users**
```sql
TABLE users (
  id BIGINT PRIMARY KEY,
  username VARCHAR UNIQUE NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  first_name VARCHAR,
  last_name VARCHAR,
  avatar BYTEA,
  avatar_url VARCHAR,
  status ENUM(ONLINE, OFFLINE, AWAY, DND),
  last_seen TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

#### **Conversations**
```sql
TABLE conversations (
  id BIGINT PRIMARY KEY,
  type ENUM(DIRECT, GROUP),
  group_name VARCHAR,
  group_description TEXT,
  group_avatar_url VARCHAR,
  created_by BIGINT FOREIGN KEY,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

#### **ConversationMembers**
```sql
TABLE conversation_members (
  id BIGINT PRIMARY KEY,
  conversation_id BIGINT FOREIGN KEY,
  user_id BIGINT FOREIGN KEY,
  role ENUM(OWNER, ADMIN, MEMBER),
  joined_at TIMESTAMP
)
```

#### **Messages**
```sql
TABLE messages (
  id BIGINT PRIMARY KEY,
  conversation_id BIGINT FOREIGN KEY,
  sender_id BIGINT FOREIGN KEY,
  content TEXT,
  type ENUM(TEXT, IMAGE, VIDEO, FILE, SYSTEM),
  status ENUM(SENT, DELIVERED, READ),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

#### **MessageReactions**
```sql
TABLE message_reactions (
  id BIGINT PRIMARY KEY,
  message_id BIGINT FOREIGN KEY,
  user_id BIGINT FOREIGN KEY,
  emoji VARCHAR(10),
  created_at TIMESTAMP
)
```

#### **PinnedMessages**
```sql
TABLE pinned_messages (
  id BIGINT PRIMARY KEY,
  message_id BIGINT FOREIGN KEY,
  conversation_id BIGINT FOREIGN KEY,
  pinned_by BIGINT FOREIGN KEY,
  pinned_at TIMESTAMP
)
```

#### **Notifications**
```sql
TABLE notifications (
  id BIGINT PRIMARY KEY,
  user_id BIGINT FOREIGN KEY,
  type ENUM(MESSAGE, CALL, GROUP_INVITE, USER_BLOCKED),
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

#### **User Relationships**
- **Blocked Users**: Many-to-many relationship for blocking functionality
- **Conversation Membership**: One-to-many from User to ConversationMember

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/chat_application/backend/
│   │   │   ├── BackendApplication.java          # Application entry point
│   │   │   │
│   │   │   ├── config/                          # Configuration classes
│   │   │   │   ├── GlobalExceptionHandler.java  # Centralized exception handling
│   │   │   │   ├── MediaConfig.java             # Media file handling config
│   │   │   │   ├── SecurityConfig.java          # Spring Security setup
│   │   │   │   ├── WebSocketConfig.java         # WebSocket/STOMP config
│   │   │   │   └── WebSocketEventListener.java  # WebSocket event handling
│   │   │   │
│   │   │   ├── controller/                      # REST Controllers
│   │   │   │   ├── AuthController.java          # Authentication endpoints
│   │   │   │   ├── ChatController.java          # Messaging endpoints
│   │   │   │   ├── NotificationController.java  # Notification endpoints
│   │   │   │   ├── SignalingController.java     # WebRTC signaling endpoints
│   │   │   │   └── UserController.java          # User management endpoints
│   │   │   │
│   │   │   ├── dto/                             # Data Transfer Objects
│   │   │   │   ├── AuthResponse.java            # Login/register response
│   │   │   │   ├── ConversationDto.java         # Conversation data transfer
│   │   │   │   ├── LoginRequest.java            # Login request payload
│   │   │   │   ├── MessageDto.java              # Message data transfer
│   │   │   │   ├── ProfileUpdateRequest.java    # Profile update payload
│   │   │   │   ├── RegisterRequest.java         # Registration payload
│   │   │   │   ├── SendMessageRequest.java      # Send message payload
│   │   │   │   └── ...other DTOs...
│   │   │   │
│   │   │   ├── model/                           # JPA Entity classes
│   │   │   │   ├── User.java                    # User entity
│   │   │   │   ├── Conversation.java            # Conversation entity
│   │   │   │   ├── ConversationMember.java      # Conversation membership
│   │   │   │   ├── Message.java                 # Message entity
│   │   │   │   ├── MessageReaction.java         # Message emoji reaction
│   │   │   │   ├── MessageStatus.java           # Status enum (SENT, DELIVERED, READ)
│   │   │   │   ├── MessageType.java             # Type enum (TEXT, IMAGE, etc)
│   │   │   │   ├── Notification.java            # Notification entity
│   │   │   │   ├── PinnedMessage.java           # Pinned message entity
│   │   │   │   ├── UserStatus.java              # Status enum (ONLINE, OFFLINE, etc)
│   │   │   │   └── ...other models...
│   │   │   │
│   │   │   ├── repository/                      # Spring Data JPA Repositories
│   │   │   │   ├── ConversationRepository.java
│   │   │   │   ├── MessageRepository.java
│   │   │   │   ├── UserRepository.java
│   │   │   │   └── ...other repositories...
│   │   │   │
│   │   │   ├── security/                        # Security & JWT components
│   │   │   │   ├── JwtAuthenticationFilter.java # JWT validation filter
│   │   │   │   ├── JwtTokenProvider.java        # JWT token generation/validation
│   │   │   │   └── CustomUserDetailsService.java # User details loader
│   │   │   │
│   │   │   └── service/                         # Business logic services
│   │   │       ├── ChatService.java             # Messaging business logic
│   │   │       ├── UserService.java             # User management logic
│   │   │       ├── NotificationService.java     # Notification logic
│   │   │       ├── MediaService.java            # Media upload/download
│   │   │       ├── PresenceService.java         # Online status management
│   │   │       └── ...other services...
│   │   │
│   │   └── resources/
│   │       ├── application.properties            # Main configuration file
│   │       └── static/                           # Static files (CSS, JS)
│   │
│   └── test/
│       └── java/                                # Unit tests
│           └── BackendApplicationTests.java
│
├── target/                                      # Compiled output
├── uploads/                                     # User-uploaded media files
├── pom.xml                                      # Maven configuration
├── mvnw                                         # Maven wrapper (Unix)
├── mvnw.cmd                                     # Maven wrapper (Windows)
└── README.md                                    # This file
```

---

## 🚀 Installation & Setup

### **Prerequisites**

Before you begin, ensure you have the following installed:

- **Java Development Kit (JDK)**: Version 17 or higher
  ```bash
  java -version  # Check if installed
  ```

- **PostgreSQL**: Version 12 or higher
  ```bash
  psql --version  # Check if installed
  ```

- **Maven**: Version 3.6.0 or higher
  ```bash
  mvn --version  # Check if installed
  ```

- **Git**: For version control (optional but recommended)

### **Step 1: Clone the Repository**

```bash
git clone https://github.com/your-repo/chat-with-video-call.git
cd chat-with-video-call/backend
```

### **Step 2: Create PostgreSQL Database**

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE chat_db;

# Create user (optional but recommended)
CREATE USER chat_user WITH PASSWORD 'your_secure_password';
ALTER ROLE chat_user SET client_encoding TO 'utf8';
ALTER ROLE chat_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE chat_user SET default_transaction_deferrable TO on;
ALTER ROLE chat_user SET timezone TO 'UTC';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE chat_db TO chat_user;

# Exit psql
\q
```

### **Step 3: Configure Application Properties**

Edit `src/main/resources/application.properties`:

```properties
# Server Configuration
spring.application.name=backend
server.port=8080

# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/chat_db
spring.datasource.username=postgres
spring.datasource.password=SKBelekar2736
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA/Hibernate Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.properties.hibernate.format_sql=true

# JWT Configuration
jwt.secret=ChatApp_SuperSecret_Key_ChangeInProd_MustBe256BitsLong!
jwt.expiration=86400000  # 24 hours in milliseconds

# WebSocket Configuration
spring.websocket.max-text-message-size=65536
spring.websocket.max-binary-message-size=65536

# File Upload Configuration
spring.servlet.multipart.enabled=true
spring.servlet.multipart.max-file-size=50MB
spring.servlet.multipart.max-request-size=55MB

# Media Configuration
app.media.upload-dir=uploads
app.media.base-url=http://localhost:8080/media

# Logging Configuration
logging.level.com.chat_application=INFO
logging.level.org.springframework.web.socket=WARN
logging.level.org.springframework.messaging=WARN
```

### **Step 4: Install Dependencies**

```bash
# Using Maven Wrapper (recommended)
./mvnw.cmd clean install

# Or using installed Maven
mvn clean install
```

---

## ⚙️ Configuration

### **Environment-Specific Profiles**

Create environment-specific property files:

#### **Development Environment** (`application-dev.properties`)
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/chat_db_dev
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.show-sql=true
logging.level.com.chat_application=DEBUG
jwt.secret=dev-secret-key-short-for-testing-only
app.media.base-url=http://localhost:8080/media
```

#### **Production Environment** (`application-prod.properties`)
```properties
spring.datasource.url=jdbc:postgresql://prod-db-server:5432/chat_db
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
logging.level.com.chat_application=WARN
jwt.secret=${JWT_SECRET}
app.media.base-url=${MEDIA_BASE_URL}
server.ssl.key-store=${SSL_KEYSTORE_PATH}
server.ssl.key-store-password=${SSL_KEYSTORE_PASSWORD}
```

### **Running with Specific Profile**

```bash
# Development
./mvnw.cmd spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"

# Production
./mvnw.cmd spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=prod"
```

---

## 🏃 Running the Application

### **Method 1: Using Maven Wrapper**

```bash
# Windows
./mvnw.cmd spring-boot:run

# Mac/Linux
./mvnw spring-boot:run
```

### **Method 2: Using Maven (if installed globally)**

```bash
mvn spring-boot:run
```

### **Method 3: Building and Running JAR**

```bash
# Build JAR file
./mvnw.cmd clean package

# Run the JAR
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

### **Verify Application is Running**

```bash
# Visit health endpoint
curl http://localhost:8080/actuator/health

# Or open in browser
http://localhost:8080/api/auth/health
```

Expected output:
```json
{
  "status": "UP"
}
```

---

## 📡 REST API Documentation

### **Base URL**
```
http://localhost:8080/api
```

### **Authentication Endpoints** (`/api/auth`)

#### **1. Register User**
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}

Response: 201 CREATED
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### **2. Login User**
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePass123!"
}

Response: 200 OK
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "firstName": "John",
  "lastName": "Doe"
}
```

### **User Management Endpoints** (`/api/users`)

#### **1. Get User Profile**
```http
GET /api/users/{userId}
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "avatarUrl": "http://localhost:8080/media/avatar-1.jpg",
  "status": "ONLINE",
  "lastSeen": "2024-04-23T10:30:00"
}
```

#### **2. Update Profile**
```http
PUT /api/users/{userId}
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "avatarUrl": "http://example.com/avatar.jpg"
}

Response: 200 OK
{
  "id": 1,
  "username": "john_doe",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### **3. Get User by Username**
```http
GET /api/users/username/{username}
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "status": "ONLINE"
}
```

#### **4. Search Users**
```http
GET /api/users/search?query=john&limit=10
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
[
  {
    "id": 1,
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe"
  },
  {
    "id": 5,
    "username": "john_smith",
    "firstName": "John",
    "lastName": "Smith"
  }
]
```

#### **5. Block User**
```http
POST /api/users/{userId}/block
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "blockedUserId": 2
}

Response: 200 OK
{
  "success": true,
  "message": "User blocked successfully"
}
```

#### **6. Unblock User**
```http
POST /api/users/{userId}/unblock
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "blockedUserId": 2
}

Response: 200 OK
{
  "success": true,
  "message": "User unblocked successfully"
}
```

#### **7. Get Blocked Users List**
```http
GET /api/users/{userId}/blocked
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
[
  {
    "id": 2,
    "username": "blocked_user",
    "firstName": "Blocked",
    "lastName": "User"
  }
]
```

### **Chat/Conversation Endpoints** (`/api/chat`)

#### **1. Get or Create Direct Conversation**
```http
POST /api/chat/direct/{targetUserId}
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
{
  "id": 1,
  "type": "DIRECT",
  "members": [
    {"id": 1, "username": "john_doe"},
    {"id": 2, "username": "jane_doe"}
  ],
  "lastMessage": "Hello!",
  "unreadCount": 3,
  "createdAt": "2024-04-23T10:00:00"
}
```

#### **2. Create Group Conversation**
```http
POST /api/chat/group
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "Project Team",
  "description": "Team discussion group",
  "avatarUrl": "http://example.com/group-avatar.jpg",
  "memberIds": [1, 2, 3, 4]
}

Response: 201 CREATED
{
  "id": 5,
  "type": "GROUP",
  "groupName": "Project Team",
  "groupDescription": "Team discussion group",
  "members": [
    {"id": 1, "username": "john_doe", "role": "OWNER"},
    {"id": 2, "username": "jane_doe", "role": "MEMBER"}
  ],
  "createdAt": "2024-04-23T10:30:00"
}
```

#### **3. Get Conversation Messages**
```http
GET /api/chat/conversations/{conversationId}/messages?page=0&size=20
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
{
  "content": [
    {
      "id": 1,
      "conversationId": 5,
      "senderId": 1,
      "senderUsername": "john_doe",
      "content": "Hello everyone!",
      "type": "TEXT",
      "status": "READ",
      "createdAt": "2024-04-23T10:30:00"
    }
  ],
  "totalElements": 150,
  "totalPages": 8,
  "currentPage": 0
}
```

#### **4. Get User Conversations**
```http
GET /api/chat/conversations?page=0&size=20
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
[
  {
    "id": 1,
    "type": "DIRECT",
    "otherUsername": "jane_doe",
    "lastMessage": "See you tomorrow!",
    "unreadCount": 2,
    "lastMessageTime": "2024-04-23T15:45:00"
  },
  {
    "id": 5,
    "type": "GROUP",
    "groupName": "Project Team",
    "lastMessage": "Great work everyone!",
    "unreadCount": 5,
    "lastMessageTime": "2024-04-23T14:20:00"
  }
]
```

#### **5. Edit Message**
```http
PUT /api/chat/messages/{messageId}
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "content": "Updated message content"
}

Response: 200 OK
{
  "id": 1,
  "content": "Updated message content",
  "edited": true,
  "editedAt": "2024-04-23T10:35:00"
}
```

#### **6. Delete Message**
```http
DELETE /api/chat/messages/{messageId}
Authorization: Bearer <JWT_TOKEN>

Response: 204 NO CONTENT
```

#### **7. Add Reaction to Message**
```http
POST /api/chat/messages/{messageId}/reactions
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "emoji": "👍"
}

Response: 201 CREATED
{
  "messageId": 1,
  "userId": 1,
  "emoji": "👍",
  "createdAt": "2024-04-23T10:40:00"
}
```

#### **8. Pin Message**
```http
POST /api/chat/messages/{messageId}/pin
Authorization: Bearer <JWT_TOKEN>

{
  "conversationId": 5
}

Response: 201 CREATED
{
  "id": 100,
  "messageId": 1,
  "conversationId": 5,
  "pinnedAt": "2024-04-23T10:45:00"
}
```

#### **9. Get Pinned Messages**
```http
GET /api/chat/conversations/{conversationId}/pinned
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
[
  {
    "id": 100,
    "messageId": 1,
    "content": "Important announcement",
    "pinnedAt": "2024-04-23T10:45:00"
  }
]
```

### **Group Management Endpoints**

#### **1. Edit Group**
```http
PUT /api/chat/groups/{conversationId}
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "Updated Group Name",
  "description": "Updated description",
  "avatarUrl": "http://example.com/new-avatar.jpg"
}

Response: 200 OK
{
  "id": 5,
  "groupName": "Updated Group Name",
  "groupDescription": "Updated description"
}
```

#### **2. Add Member to Group**
```http
POST /api/chat/groups/{conversationId}/members
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "userId": 10
}

Response: 201 CREATED
{
  "id": 1,
  "conversationId": 5,
  "userId": 10,
  "role": "MEMBER"
}
```

#### **3. Remove Member from Group**
```http
DELETE /api/chat/groups/{conversationId}/members/{userId}
Authorization: Bearer <JWT_TOKEN>

Response: 204 NO CONTENT
```

#### **4. Update Member Role**
```http
PUT /api/chat/groups/{conversationId}/members/{userId}/role
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "role": "ADMIN"
}

Response: 200 OK
{
  "id": 1,
  "conversationId": 5,
  "userId": 10,
  "role": "ADMIN"
}
```

### **Media Endpoints**

#### **1. Upload Media**
```http
POST /api/chat/media/upload
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

Form Data:
- file: <binary file data>
- conversationId: 5

Response: 200 OK
{
  "mediaId": 1,
  "fileName": "image.jpg",
  "fileSize": 2048576,
  "mediaUrl": "http://localhost:8080/media/image_1.jpg",
  "uploadedAt": "2024-04-23T11:00:00"
}
```

#### **2. Download Media**
```http
GET /api/chat/media/{mediaId}
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
[Binary file content]
```

### **Notification Endpoints**

#### **1. Get User Notifications**
```http
GET /api/notifications?page=0&size=20&unreadOnly=false
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
{
  "content": [
    {
      "id": 1,
      "type": "MESSAGE",
      "content": "john_doe sent you a message",
      "isRead": false,
      "createdAt": "2024-04-23T10:30:00"
    }
  ],
  "totalElements": 45,
  "totalPages": 3
}
```

#### **2. Mark Notification as Read**
```http
PUT /api/notifications/{notificationId}/read
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
{
  "id": 1,
  "isRead": true,
  "readAt": "2024-04-23T10:35:00"
}
```

#### **3. Mark All Notifications as Read**
```http
PUT /api/notifications/mark-all-read
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
{
  "markedCount": 12
}
```

---

## 🌐 WebSocket/STOMP Guide

### **WebSocket Connection**

#### **Connecting to WebSocket**
```javascript
// JavaScript example
const wsUrl = 'ws://localhost:8080/ws';
const stompClient = new StompJs.Client({
  brokerURL: wsUrl,
  login: 'user',
  passcode: 'password',
  reconnectDelay: 5000,
  heartbeatIncoming: 4000,
  heartbeatOutgoing: 4000,
  connectHeaders: {
    'Authorization': 'Bearer ' + jwtToken
  }
});

stompClient.onConnect = (frame) => {
  console.log('Connected to WebSocket');
  // Subscribe to channels
};

stompClient.activate();
```

### **Message Endpoints**

#### **1. Send Message** (Real-time messaging)
```javascript
stompClient.publish({
  destination: '/app/chat.send',
  body: JSON.stringify({
    conversationId: 5,
    content: 'Hello everyone!',
    type: 'TEXT'
  })
});
```

**Clients receive on:**
- Personal queue: `/user/queue/messages`
- Topic: `/topic/conversation/{conversationId}/messages`

**Response Format:**
```json
{
  "id": 101,
  "conversationId": 5,
  "senderId": 1,
  "senderUsername": "john_doe",
  "content": "Hello everyone!",
  "type": "TEXT",
  "status": "SENT",
  "createdAt": "2024-04-23T11:00:00",
  "reactions": [],
  "mediaUrl": null
}
```

#### **2. Mark as Read**
```javascript
stompClient.publish({
  destination: '/app/chat.read',
  body: JSON.stringify({
    conversationId: 5
  })
});
```

#### **3. Typing Indicator**
```javascript
stompClient.publish({
  destination: '/app/chat.typing',
  body: JSON.stringify({
    conversationId: 5,
    typing: true
  })
});

// Stop typing when done
stompClient.publish({
  destination: '/app/chat.typing',
  body: JSON.stringify({
    conversationId: 5,
    typing: false
  })
});
```

**Listen on:**
```javascript
stompClient.subscribe('/topic/conversation/5/typing', (message) => {
  const data = JSON.parse(message.body);
  // {
  //   userId: 2,
  //   username: "jane_doe",
  //   typing: true
  // }
});
```

### **Presence Events**

#### **User Online/Offline Status**
```javascript
stompClient.subscribe('/topic/presence', (message) => {
  const data = JSON.parse(message.body);
  // {
  //   userId: 1,
  //   username: "john_doe",
  //   status: "ONLINE",
  //   lastSeen: "2024-04-23T11:05:00"
  // }
});
```

**Broadcast to:** `/topic/presence`

### **Notification Events**

#### **Listen for Notifications**
```javascript
stompClient.subscribe('/user/queue/notifications', (message) => {
  const notification = JSON.parse(message.body);
  // {
  //   id: 1,
  //   type: "MESSAGE",
  //   content: "john_doe sent you a message",
  //   conversationId: 5,
  //   senderId: 1,
  //   createdAt: "2024-04-23T11:00:00"
  // }
});
```

### **WebRTC Signaling**

#### **Send Offer (Initiate Call)**
```javascript
stompClient.publish({
  destination: '/app/signaling.send',
  body: JSON.stringify({
    to: 2,  // target user ID
    type: 'offer',
    sdp: offerSDP
  })
});
```

#### **Send Answer**
```javascript
stompClient.publish({
  destination: '/app/signaling.send',
  body: JSON.stringify({
    to: 1,  // target user ID
    type: 'answer',
    sdp: answerSDP
  })
});
```

#### **Send ICE Candidate**
```javascript
stompClient.publish({
  destination: '/app/signaling.send',
  body: JSON.stringify({
    to: 2,
    type: 'ice-candidate',
    candidate: iceCandidate
  })
});
```

### **Subscription Topics Overview**

| Topic | Purpose | Example |
|-------|---------|---------|
| `/user/queue/messages` | Personal message queue | Receive sent messages |
| `/topic/conversation/{id}/messages` | Conversation broadcast | All members receive |
| `/topic/conversation/{id}/typing` | Typing indicator | Who is typing |
| `/topic/presence` | Online/offline status | User presence changes |
| `/user/queue/notifications` | Personal notifications | Important events |
| `/user/queue/signaling` | WebRTC offer/answer | Call signaling |
| `/user/queue/call-incoming` | Incoming call signal | Someone calling you |

---

## 🔐 Security & Authentication

### **JWT Authentication Flow**

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. POST /api/auth/login
       │    {username, password}
       ▼
┌─────────────────────────────────────┐
│   AuthController.java               │
│   ↓                                 │
│   UserService.login()              │
│   ↓                                 │
│   Validate credentials             │
│   ↓                                 │
│   Generate JWT Token              │
└──────┬──────────────────────────────┘
       │
       │ 2. Return AuthResponse
       │    {token, userId, username}
       ▼
┌─────────────┐
│   Client    │ (Stores token in localStorage/sessionStorage)
└──────┬──────┘
       │
       │ 3. Attach token to requests
       │    Authorization: Bearer <token>
       ▼
┌──────────────────────────────────────┐
│   JwtAuthenticationFilter.java       │
│   ↓                                  │
│   Extract token from header          │
│   ↓                                  │
│   Validate token signature           │
│   ↓                                  │
│   Check expiration                   │
│   ↓                                  │
│   Load user details                  │
│   ↓                                  │
│   Set authentication context         │
└──────┬───────────────────────────────┘
       │
       ▼
  Allow/Deny Request
```

### **JWT Token Structure**

```
eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJqb2huX2RvZSIsImlhdCI6MTcxMzg3NzIwMCwiZXhwIjoxNzEzOTYzNjAwfQ.signature
└─────┬─────┘ └──────────────┬──────────────┘ └────────┬────────┘
   Header           Payload                    Signature

Header: {
  "alg": "HS512",
  "typ": "JWT"
}

Payload: {
  "sub": "john_doe",           // Username
  "iat": 1713877200,           // Issued at
  "exp": 1713963600            // Expiration time (24 hours)
}
```

### **JWT Configuration**

```properties
jwt.secret=ChatApp_SuperSecret_Key_ChangeInProd_MustBe256BitsLong!
jwt.expiration=86400000  # 24 hours in milliseconds
```

**⚠️ IMPORTANT**: 
- Change `jwt.secret` in production to a strong, random 256-bit key
- Use environment variables for sensitive data
- Never commit secret keys to version control

### **WebSocket Security**

WebSocket connections are authenticated using JWT:

1. Client includes JWT in the `Authorization` header when connecting
2. `WebSocketConfig` intercepts CONNECT frames
3. Token is validated before establishing connection
4. User details are loaded and set as authentication principal

```java
// In WebSocketConfig.java
String authHeader = accessor.getFirstNativeHeader("Authorization");
if (authHeader.startsWith("Bearer ")) {
    String token = authHeader.substring(7);
    if (jwtTokenProvider.validateToken(token)) {
        String username = jwtTokenProvider.getUsernameFromToken(token);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        // Set authentication
    }
}
```

### **CORS Configuration**

Cross-Origin Resource Sharing (CORS) is configured to allow requests from:
- `http://localhost:3000` (frontend dev server)
- `http://localhost:8080` (backend)
- Any origin (can be restricted in production)

Allowed methods: GET, POST, PUT, DELETE, OPTIONS, PATCH  
Allowed headers: All (can be restricted to specific headers)

### **Security Best Practices Implemented**

| Practice | Implementation |
|----------|-----------------|
| Password Hashing | BCrypt with strength 10 |
| Stateless Auth | JWT tokens, no server sessions |
| CSRF Protection | Disabled for stateless API |
| CORS | Configured with allowed origins |
| HTTPOnly Cookies | Not used (stateless JWT) |
| HTTPS | Recommended for production |
| Input Validation | Entity validation annotations |
| SQL Injection | Parameterized queries via JPA |
| Rate Limiting | Not implemented (add Spring Cloud) |
| Token Rotation | Not implemented (add refresh tokens) |

### **Security Vulnerabilities & Mitigations**

1. **Weak JWT Secret**
   - **Issue**: Default secret is too short
   - **Mitigation**: Change to 256+ bit random key in production

2. **No Token Refresh**
   - **Issue**: Tokens valid for 24 hours
   - **Mitigation**: Implement refresh token mechanism

3. **Broad CORS Policy**
   - **Issue**: Allows all origins
   - **Mitigation**: Restrict to specific frontend domains in production

4. **No Rate Limiting**
   - **Issue**: No protection against brute force
   - **Mitigation**: Add Spring Cloud Gateway or `RateLimiter`

5. **Password Requirements**
   - **Issue**: No minimum complexity
   - **Mitigation**: Add validation rules in `RegisterRequest`

---

## 🐛 Troubleshooting

### **Database Connection Issues**

#### **Error: `ERROR: database "chat_db" does not exist`**

**Solution:**
```bash
# Create the database
psql -U postgres -c "CREATE DATABASE chat_db;"

# Or using interactive psql
psql -U postgres
postgres=# CREATE DATABASE chat_db;
postgres=# \q
```

#### **Error: `org.postgresql.util.PSQLException: Connection refused`**

**Solution:**
1. Ensure PostgreSQL is running:
   ```bash
   # Windows
   pg_isready -h localhost -p 5432
   
   # Mac/Linux
   pg_isready -h localhost -p 5432
   ```

2. Check PostgreSQL is listening on port 5432:
   ```bash
   netstat -an | findstr 5432  # Windows
   lsof -i :5432              # Mac/Linux
   ```

3. Verify database credentials in `application.properties`

### **Maven Build Issues**

#### **Error: `[ERROR] COMPILATION ERROR`**

**Solution:**
```bash
# Clean and rebuild
./mvnw.cmd clean compile

# If still fails, check Java version
java -version  # Should be 17+

# Set JAVA_HOME if needed
set JAVA_HOME=C:\Program Files\Java\jdk-17
```

#### **Error: `[ERROR] Cannot access javax.servlet:javax.servlet-api:4.0.1`**

**Solution:**
```bash
# Clear Maven cache and rebuild
./mvnw.cmd clean install -U
```

### **WebSocket Connection Issues**

#### **Error: `WebSocket connection failed`**

**Symptoms:**
- Browser console shows connection refused
- STOMP client cannot connect to `/ws` endpoint

**Solutions:**
1. Verify WebSocket endpoint is accessible:
   ```bash
   curl http://localhost:8080/ws
   ```

2. Check browser doesn't block WebSocket:
   - Ensure CORS headers are correct
   - Check browser console for errors

3. Verify JWT token is valid:
   - Decode token at [jwt.io](https://jwt.io)
   - Ensure token hasn't expired
   - Check token format in Authorization header

#### **Error: `Unauthorized` on WebSocket connection**

**Solution:**
```javascript
// Ensure Authorization header is correct
const headers = {
  'Authorization': 'Bearer ' + jwtToken
};

stompClient.connectHeaders = headers;
```

### **JWT Token Issues**

#### **Error: `Invalid JWT signature`**

**Solution:**
1. Verify `jwt.secret` matches in all servers
2. Ensure token wasn't modified in transit
3. Check JWT wasn't corrupted (no special characters in string)

#### **Error: `JWT expired`**

**Solution:**
1. Login again to get new token:
   ```bash
   curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"user","password":"pass"}'
   ```

2. Implement token refresh logic in frontend

### **File Upload Issues**

#### **Error: `File size exceeds maximum size`**

**Solution:**
Increase file size limits in `application.properties`:
```properties
spring.servlet.multipart.max-file-size=100MB
spring.servlet.multipart.max-request-size=105MB
```

#### **Error: `uploads` directory not found**

**Solution:**
```bash
# Create uploads directory in project root
mkdir uploads

# Or configure custom path
app.media.upload-dir=/absolute/path/to/uploads
```

### **Performance Issues**

#### **Slow Message Query**

**Symptom:** `/api/chat/conversations/{id}/messages` endpoint is slow

**Solutions:**
1. Add database index on `conversation_id` and `created_at`:
   ```sql
   CREATE INDEX idx_message_conversation_created 
   ON messages(conversation_id, created_at DESC);
   ```

2. Use pagination in API requests (already implemented)

3. Lazy-load reactions and attachments

#### **High Memory Usage**

**Symptom:** Spring Boot process using excessive memory

**Solutions:**
1. Limit WebSocket message size:
   ```properties
   spring.websocket.max-text-message-size=65536
   ```

2. Disable `show-sql` in production:
   ```properties
   spring.jpa.show-sql=false
   ```

3. Increase JVM heap size:
   ```bash
   java -Xmx1024m -jar target/backend-0.0.1-SNAPSHOT.jar
   ```

---

## 👥 Development Guidelines

### **Code Style & Conventions**

1. **Naming Conventions**
   - Classes: PascalCase (`UserService`, `AuthresponseDto`)
   - Methods: camelCase (`sendMessage`, `getConversation`)
   - Constants: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
   - Packages: lowercase (`com.chat_application.backend.service`)

2. **Imports**
   - Use wildcard imports sparingly
   - Organize imports (java, javax, org, com)
   - Remove unused imports before committing

3. **Code Format**
   - Indentation: 4 spaces
   - Max line length: 120 characters
   - One class per file

### **Best Practices**

1. **Error Handling**
   - Use custom exceptions extending `RuntimeException`
   - Log errors with context information
   - Return appropriate HTTP status codes

2. **Database Queries**
   - Use JPA `@Query` annotations for complex queries
   - Implement pagination for list endpoints
   - Avoid N+1 query problems with joins/fetch

3. **WebSocket Communication**
   - Validate all incoming WebSocket messages
   - Use try-catch in message handlers
   - Broadcast responses to relevant clients only

4. **Security**
   - Never log sensitive data (passwords, tokens)
   - Validate input at controller level
   - Check authorization before business logic

### **Adding New Features**

#### **Example: Adding a Thumbs-up Reaction Feature**

1. **Create DTO**
   ```java
   @Data
   public class ThumbsUpRequest {
       private Long messageId;
   }
   ```

2. **Add to Service**
   ```java
   public void addThumbsUp(Long messageId, Long userId) {
       Message message = messageRepository.findById(messageId)
           .orElseThrow(() -> new RuntimeException("Message not found"));
       
       MessageReaction reaction = MessageReaction.builder()
           .message(message)
           .user(userRepository.findById(userId).orElseThrow())
           .emoji("👍")
           .build();
       
       reactionRepository.save(reaction);
   }
   ```

3. **Add Controller Endpoint**
   ```java
   @PostMapping("/messages/{messageId}/thumbs-up")
   public ResponseEntity<?> addThumbsUp(@PathVariable Long messageId, 
                                        Principal principal) {
       Long userId = extractUserId(principal);
       chatService.addThumbsUp(messageId, userId);
       return ResponseEntity.ok().build();
   }
   ```

4. **Add WebSocket Handler**
   ```java
   @MessageMapping("/chat.thumbsup")
   public void handleThumbsUp(@Payload Map<String, Long> payload, 
                              Principal principal) {
       Long messageId = payload.get("messageId");
       Long userId = extractUserId(principal);
       chatService.addThumbsUp(messageId, userId);
       // Broadcast to relevant clients
   }
   ```

### **Testing Guidelines**

#### **Unit Test Example**
```java
@SpringBootTest
public class ChatServiceTest {
    
    @MockBean
    private ConversationRepository conversationRepository;
    
    @InjectMocks
    private ChatService chatService;
    
    @Test
    public void testGetOrCreateDirectConversation() {
        // Arrange
        Long user1Id = 1L;
        Long user2Id = 2L;
        User user1 = new User();
        user1.setId(user1Id);
        User user2 = new User();
        user2.setId(user2Id);
        
        // Act
        ConversationDto result = chatService.getOrCreateDirectConversation(
            user1Id, user2Id);
        
        // Assert
        assertNotNull(result);
        assertEquals(ConversationType.DIRECT, result.getType());
    }
}
```

---

## 📚 Additional Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Spring WebSocket Guide](https://spring.io/guides/gs/messaging-stomp-websocket/)
- [JWT.io - JWT Information](https://jwt.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Spring Security Documentation](https://spring.io/projects/spring-security)

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes following coding conventions
4. Commit changes (`git commit -m 'Add AmazingFeature'`)
5. Push to branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

---

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Contact the development team
- Check existing issues for solutions

---

**Last Updated**: April 23, 2024  
**Version**: 1.0.0  
**Status**: Active Development
