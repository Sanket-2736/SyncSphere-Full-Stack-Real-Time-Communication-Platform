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
      
      if (storedToken && storedUser && storedUser !== 'undefined') {
        setToken(storedToken);
        try {
          setUser(JSON.parse(storedUser));
        } catch (parseError) {
          console.error('Failed to parse stored user:', parseError);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      } else {
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const { data } = await axiosInstance.post('/api/auth/login', {
        username,
        password,
      });

      const { token: newToken, user: newUser } = data;
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setToken(newToken);
      setUser(newUser);
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      const details = error.response?.data?.details || {};
      return { success: false, message, details };
    }
  };

  const register = async (username, email, password, firstName, lastName) => {
    try {
      const { data } = await axiosInstance.post('/api/auth/register', {
        username,
        email,
        password,
        firstName,
        lastName,
      });

      const { token: newToken, user: newUser } = data;
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setToken(newToken);
      setUser(newUser);
      
      return { success: true };
    } catch (error) {
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
