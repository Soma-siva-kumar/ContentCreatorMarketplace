import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '../services/api';
import { User, CreatorProfileData, BrandProfileData } from '../types';

interface AuthContextType {
  user: User | null;
  profile: CreatorProfileData | BrandProfileData | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (credentials: unknown) => Promise<void>;
  register: (data: unknown) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: Partial<CreatorProfileData | BrandProfileData>) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CreatorProfileData | BrandProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Initialize session from cookies / token
  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getMe();
      if (data && data.user) {
        setUser(data.user);
        setProfile(data.profile);
      }
    } catch {
      // Session not active or expired
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: unknown) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(credentials);
      setUser(res.user);
      setProfile(res.profile);
      if (res.token) {
        localStorage.setItem('hacxlerate_token', res.token);
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Login failed. Please check credentials.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: unknown) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.register(data);
      setUser(res.user);
      setProfile(res.profile);
      if (res.token) {
        localStorage.setItem('hacxlerate_token', res.token);
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Registration failed. Please try again.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('hacxlerate_token');
      setUser(null);
      setProfile(null);
    }
  };

  const updateProfile = async (data: Partial<CreatorProfileData | BrandProfileData>) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      if (user.role === 'creator') {
        const res = await api.updateCreatorProfile(data as Partial<CreatorProfileData>);
        setProfile(res.profile);
      } else if (user.role === 'brand') {
        const res = await api.updateBrandProfile(data as Partial<BrandProfileData>);
        setProfile(res.profile);
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Profile update failed.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        error,
        isAuthenticated: Boolean(user && user.isActive),
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
