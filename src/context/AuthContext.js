"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // To handle initial load

  useEffect(() => {
    // On initial load, try to load token and user from localStorage
    try {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('authUser');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      // If localStorage is not available (e.g. in server-side rendering)
      console.warn("Could not access localStorage. Continuing without persisted auth state.");
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to login');
      }

      // Store token and user data
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));

      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    // Clear state and localStorage
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    // Optional: redirect to login page
    window.location.href = '/login';
  };

  const hasCapability = (capability) => {
    if (!user || !user.capabilities) {
      return false;
    }
    return user.capabilities.includes(capability);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    loading,
    login,
    logout,
    hasCapability,
  };

  // Render children only after loading is complete to avoid flicker
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    // This can happen during initial render before context is available.
    // Return a default shape or handle accordingly.
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      loading: true,
      login: async () => {},
      logout: () => {},
      hasCapability: () => false
    };
  }
  return context;
}
