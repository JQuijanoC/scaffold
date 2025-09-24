import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

const AuthContext = createContext();

// A helper function to parse the JWT token
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = parseJwt(token);
      // Check if the token is expired
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setUser(decoded);
      } else {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Login failed');
    }

    const { token } = await res.json();
    const decoded = parseJwt(token);
    if (decoded) {
      localStorage.setItem('token', token);
      setUser(decoded);
      router.push('/');
    }
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login?message=session_expired');
  }, [router]);

  const hasCapability = (capability) => {
    return user?.capabilities?.includes(capability) ?? false;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, hasCapability }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);