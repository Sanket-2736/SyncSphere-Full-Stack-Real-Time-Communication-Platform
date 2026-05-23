import { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      console.log('🔐 [AUTH] Initializing auth context');
      console.log('🔐 [AUTH] Stored token exists:', !!storedToken);
      console.log('🔐 [AUTH] Stored user exists:', !!storedUser);
      
      if (storedToken && storedUser && storedUser !== 'undefined') {
        setToken(storedToken);
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log('🔐 [AUTH] Parsed user:', parsedUser);
          setUser(parsedUser);
        } catch (parseError) {
          console.error('❌ [AUTH] Failed to parse stored user:', parseError);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      } else {
        // Clear invalid data
        console.warn('⚠️ [AUTH] Invalid stored data, clearing');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('❌ [AUTH] Error initializing auth:', error);
    } finally {
      console.log('✅ [AUTH] Auth initialization complete');
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      console.log('🔐 [AUTH] Attempting login for:', username);
      const { data } = await axiosInstance.post('/api/auth/login', {
        username,
        password,
      });

      console.log('🔐 [AUTH] Login response:', data);
      
      // Backend returns AuthResponse with flat structure: { userId, username, email, firstName, lastName, token, status }
      // Not nested as { token, user: {...} }
      const { token: newToken, ...userData } = data;
      
      console.log('🔐 [AUTH] Extracted token:', !!newToken);
      console.log('🔐 [AUTH] Extracted user data:', userData);
      
      if (!newToken) {
        console.error('❌ [AUTH] No token in login response');
        return { success: false, message: 'No token received from server' };
      }
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      console.log('🔐 [AUTH] Stored in localStorage - token:', !!newToken, 'user:', !!userData);
      
      setToken(newToken);
      setUser(userData);
      
      console.log('✅ [AUTH] Login successful, user:', userData);
      return { success: true };
    } catch (error) {
      console.error('❌ [AUTH] Login error:', error);
      const message = error.response?.data?.message || 'Login failed';
      const details = error.response?.data?.details || {};
      return { success: false, message, details };
    }
  };

  const register = async (username, email, password, firstName, lastName) => {
    try {
      console.log('🔐 [AUTH] Attempting register for:', username);
      const { data } = await axiosInstance.post('/api/auth/register', {
        username,
        email,
        password,
        firstName,
        lastName,
      });

      console.log('🔐 [AUTH] Register response:', data);
      
      // Backend returns AuthResponse with flat structure
      const { token: newToken, ...userData } = data;
      
      console.log('🔐 [AUTH] Extracted token:', !!newToken);
      console.log('🔐 [AUTH] Extracted user data:', userData);
      
      if (!newToken) {
        console.error('❌ [AUTH] No token in register response');
        return { success: false, message: 'No token received from server' };
      }
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(newToken);
      setUser(userData);
      
      console.log('✅ [AUTH] Register successful, user:', userData);
      return { success: true };
    } catch (error) {
      console.error('❌ [AUTH] Register error:', error);
      const message = error.response?.data?.message || 'Registration failed';
      const details = error.response?.data?.details || {};
      return { success: false, message, details };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token,
  };

  useEffect(() => {
    console.log('🔐 [AUTH] Auth state changed:', {
      user: user ? { id: user.id, username: user.username } : null,
      token: token ? 'exists' : 'missing',
      isAuthenticated: !!token,
      loading,
    });
  }, [user, token, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
