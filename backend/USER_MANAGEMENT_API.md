# User Management API Documentation

## Overview
This document describes all user management endpoints in the Chat Application Backend. The API supports user registration, authentication, profile management, presence status, user search, and blocking functionality.

---

## Authentication

Most endpoints require **JWT Bearer Token** authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Base URL

```
http://localhost:8080/api
```

---

## Authentication Endpoints (`/auth`)

### 1. User Registration
**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201 Created):**
```json
{
  "userId": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "status": "OFFLINE"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Username already taken"
}
```

---

### 2. User Login
**POST** `/auth/login`

Authenticate user and obtain JWT token.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "userId": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "status": "OFFLINE"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Invalid username or password"
}
```

---

## User Endpoints (`/users`)

### 1. Get Current User Profile
**GET** `/users/profile`

Retrieve the authenticated user's profile.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "status": "ONLINE",
  "avatarUrl": "https://example.com/avatars/john.jpg"
}
```

---

### 2. Get User by ID
**GET** `/users/{userId}`

Retrieve a specific user's public profile by ID.

**Path Parameters:**
- `userId` (Long) - The user's ID

**Response (200 OK):**
```json
{
  "id": 2,
  "username": "jane_smith",
  "email": "jane@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "status": "ONLINE",
  "avatarUrl": "https://example.com/avatars/jane.jpg"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "User not found"
}
```

---

### 3. Get User by Username
**GET** `/users/username/{username}`

Retrieve a user's public profile by username.

**Path Parameters:**
- `username` (String) - The user's username

**Response (200 OK):**
```json
{
  "id": 2,
  "username": "jane_smith",
  "email": "jane@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "status": "AWAY",
  "avatarUrl": "https://example.com/avatars/jane.jpg"
}
```

---

### 4. Update Current User Profile
**PUT** `/users/profile`

Update the authenticated user's profile information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe Updated",
  "avatarUrl": "https://example.com/avatars/john-new.jpg"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe Updated",
  "status": "ONLINE",
  "avatarUrl": "https://example.com/avatars/john-new.jpg"
}
```

---

### 5. Update User Status
**PUT** `/users/status`

Update the authenticated user's presence status.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "status": "ONLINE"
}
```

**Allowed Status Values:**
- `ONLINE` - User is actively using the application
- `OFFLINE` - User is not connected
- `AWAY` - User is away or idle
- `DO_NOT_DISTURB` - User doesn't want to be contacted

**Response (200 OK):**
```json
{
  "message": "Status updated successfully",
  "status": "ONLINE"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Status cannot be null"
}
```

---

### 6. Search Users
**GET** `/users/search?query={searchTerm}`

Search for users by name or username. Excludes the authenticated user and blocked users.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `query` (String, required) - Search term (name or username)

**Example Request:**
```
GET /users/search?query=john
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe",
    "status": "ONLINE",
    "avatarUrl": "https://example.com/avatars/john.jpg"
  },
  {
    "id": 5,
    "username": "john_smith",
    "firstName": "John",
    "lastName": "Smith",
    "status": "AWAY",
    "avatarUrl": "https://example.com/avatars/john-smith.jpg"
  }
]
```

---

### 7. Get All Users
**GET** `/users/all`

Retrieve a list of all users (excluding self and blocked users).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
[
  {
    "id": 2,
    "username": "jane_smith",
    "firstName": "Jane",
    "lastName": "Smith",
    "status": "ONLINE",
    "avatarUrl": "https://example.com/avatars/jane.jpg"
  },
  {
    "id": 3,
    "username": "bob_wilson",
    "firstName": "Bob",
    "lastName": "Wilson",
    "status": "OFFLINE",
    "avatarUrl": "https://example.com/avatars/bob.jpg"
  }
]
```

---

## Blocking Endpoints

### 1. Block a User
**POST** `/users/{userId}/block`

Block a user from contacting you.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**
- `userId` (Long) - The user ID to block

**Response (200 OK):**
```json
{
  "message": "User blocked successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Cannot block yourself"
}
```

---

### 2. Unblock a User
**POST** `/users/{userId}/unblock`

Unblock a previously blocked user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**
- `userId` (Long) - The user ID to unblock

**Response (200 OK):**
```json
{
  "message": "User unblocked successfully"
}
```

---

### 3. Get Blocked Users
**GET** `/users/blocked`

Retrieve a list of all blocked users.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
[
  {
    "id": 4,
    "username": "spammer_user",
    "firstName": "Spam",
    "lastName": "User",
    "status": "ONLINE",
    "avatarUrl": "https://example.com/avatars/spammer.jpg"
  }
]
```

---

### 4. Check if User is Blocked
**GET** `/users/{userId}/is-blocked`

Check if a specific user is blocked.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**
- `userId` (Long) - The user ID to check

**Response (200 OK):**
```json
{
  "isBlocked": false
}
```

---

## User Status Enum

The system supports four user status values:

| Status | Description |
|--------|-------------|
| `ONLINE` | User is actively using the application |
| `OFFLINE` | User is not connected |
| `AWAY` | User is away or idle |
| `DO_NOT_DISTURB` | User is available but doesn't want interruptions |

---

## Error Handling

All endpoints may return the following error responses:

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 400 Bad Request
```json
{
  "error": "Invalid request data"
}
```

### 500 Internal Server Error
```json
{
  "error": "An unexpected error occurred"
}
```

---

## Usage Examples

### Example 1: Complete Authentication Flow

```bash
# 1. Register a new user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Response includes JWT token

# 2. Use token for subsequent requests
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 3. Get user profile
curl -X GET http://localhost:8080/api/users/profile \
  -H "Authorization: Bearer $TOKEN"

# 4. Update status
curl -X PUT http://localhost:8080/api/users/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "ONLINE"}'
```

### Example 2: Search and Block Users

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Search for users
curl -X GET "http://localhost:8080/api/users/search?query=jane" \
  -H "Authorization: Bearer $TOKEN"

# Block a user (ID: 2)
curl -X POST http://localhost:8080/api/users/2/block \
  -H "Authorization: Bearer $TOKEN"

# Get blocked users list
curl -X GET http://localhost:8080/api/users/blocked \
  -H "Authorization: Bearer $TOKEN"

# Unblock a user
curl -X POST http://localhost:8080/api/users/2/unblock \
  -H "Authorization: Bearer $TOKEN"
```

---

## Security Considerations

1. **JWT Token Storage**: Store tokens securely on the client-side (use HttpOnly cookies if possible)
2. **Token Expiration**: Implement token refresh mechanisms
3. **Password Security**: Enforce strong password requirements
4. **HTTPS**: Always use HTTPS in production
5. **Rate Limiting**: Consider implementing rate limiting on auth endpoints
6. **Input Validation**: All inputs are validated before processing

---

## Database Schema

### Users Table
- `id` (PK) - Auto-incremented user ID
- `username` - Unique username
- `email` - Unique email address
- `password` - Encrypted password
- `first_name` - User's first name
- `last_name` - User's last name
- `avatar_url` - URL to user's avatar image
- `status` - Current user status (ENUM)
- `created_at` - Account creation timestamp
- `updated_at` - Last profile update timestamp
- `last_seen` - Last activity timestamp
- `enabled` - Account active status
- `account_non_expired` - Account expiration flag
- `account_non_locked` - Account lock status
- `credentials_non_expired` - Credentials expiration flag

### User Blocked Users Table (Junction Table)
- `user_id` (FK) - The user doing the blocking
- `blocked_user_id` (FK) - The user being blocked

---

## Configuration

The API is configured with:
- **Base Path**: `/api`
- **CORS**: Enabled for all origins (configurable)
- **Authentication**: JWT Bearer Token
- **Response Format**: JSON
- **Charset**: UTF-8

---

## Future Enhancements

- [ ] Two-factor authentication (2FA)
- [ ] OAuth2 integration
- [ ] Email verification
- [ ] Password reset functionality
- [ ] User role-based permissions
- [ ] Activity logging
- [ ] Account deactivation
- [ ] Bulk user import
