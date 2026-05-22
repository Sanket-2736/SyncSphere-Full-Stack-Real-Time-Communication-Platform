# Chat Application Frontend

A modern React 18 + Vite + Tailwind CSS v3 chat application frontend.

## Features

- ✅ React 18 with Hooks
- ✅ Vite for fast development
- ✅ Tailwind CSS v3 with dark mode
- ✅ React Router v6 with protected routes
- ✅ Axios with JWT authentication
- ✅ AuthContext for state management
- ✅ Error boundary for error handling
- ✅ Field-level validation errors
- ✅ Responsive design

## Project Structure

```
src/
├── api/
│   └── axiosInstance.js      # Axios instance with JWT interceptor
├── components/
│   ├── ErrorBoundary.jsx     # Global error boundary
│   └── ProtectedRoute.jsx    # Protected route wrapper
├── context/
│   └── AuthContext.jsx       # Authentication context
├── pages/
│   ├── LoginPage.jsx         # Login page
│   ├── RegisterPage.jsx      # Register page
│   └── ChatPage.jsx          # Chat page (protected)
├── App.jsx                   # Main app component
├── main.jsx                  # Entry point
└── index.css                 # Global styles
```

## Setup

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Configuration

### Backend URL

Update the base URL in `src/api/axiosInstance.js`:

```javascript
const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080', // Change this
});
```

### Tailwind Theme

Customize the theme in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      // Add custom colors
    },
  },
},
```

## Authentication Flow

1. User registers or logs in
2. Backend returns JWT token and user object
3. Token is stored in localStorage
4. Token is automatically attached to all API requests
5. On 401 error, user is redirected to login
6. User can logout to clear auth data

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register

### Response Format

```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "user",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Error Response

```json
{
  "message": "Validation failed",
  "details": {
    "username": "Username is required",
    "email": "Invalid email format"
  }
}
```

## Styling

The app uses Tailwind CSS with a dark theme by default:

- Background: `bg-slate-900`
- Surfaces: `bg-slate-800`
- Borders: `border-slate-700`
- Text: `text-white`

To enable light mode, remove the `dark` class from `index.html`:

```html
<html lang="en"> <!-- Remove class="dark" -->
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
