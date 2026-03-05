/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Mobile API Service Layer
 * Adapted from web app for React Native with async token storage
 */

import Constants from 'expo-constants';
import { secureStorage } from './storage';

// Get API URL from Expo constants
// Set via environment variable: API_URL=http://YOUR_IP:3001/api npx expo start
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001/api';

// Types
export interface ApiError {
  error: string;
  details?: any;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Profile type matching backend model
export interface Profile {
  id: string;
  name: string;
  year: number;
  bio?: string | null;
  thenPhoto?: string | null;
  nowPhoto?: string | null;
  linkedin?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  email?: string | null;
  phone?: string | null;
  contactPermission?: 'all' | 'year-group' | 'none';
  verificationStatus?: 'pending' | 'verified' | null;
  securityQuestion?: string | null;
}

// User type
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isMember: boolean;
  monthlyAmount?: number | null;
  profile?: Profile | null;
}

// Year Group type
export interface YearGroup {
  year: number;
  groupPhoto?: string | null;
  photos?: string[] | null;
  yearInfo?: string | null;
  whatsappLink?: string | null;
  _count?: { members: number };
}

// Reunion type
export interface Reunion {
  id: string;
  title: string;
  date: string;
  location: string;
  description?: string | null;
  targetYearGroups?: number[] | null;
  userRegistration?: { status: 'coming' | 'maybe' | 'not_coming' } | null;
}

// Async token retrieval for React Native
const getToken = async (): Promise<string | null> => {
  return secureStorage.getAccessToken();
};

// Set auth token
export const setAuthToken = async (token: string): Promise<void> => {
  await secureStorage.setAccessToken(token);
};

// Remove auth token
export const removeAuthToken = async (): Promise<void> => {
  await secureStorage.clearAuthData();
};

// Base fetch wrapper with error handling
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    // Add timeout to fetch request
    const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/register');
    const isProfileEndpoint = endpoint.includes('/alumni/me/profile');
    // Profile endpoints need more time for image uploads (base64 images can be large)
    const timeoutMs = isAuthEndpoint ? 15000 : (isProfileEndpoint ? 60000 : 10000);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw {
        error: 'Request timeout. Please check your connection and try again.',
        details: 'Request took longer than expected.',
      } as ApiError;
    }
    throw {
      error: 'Cannot connect to server. Please check your internet connection.',
      details: error.message,
    } as ApiError;
  }

  // Handle non-JSON responses
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    if (!response.ok) {
      throw {
        error: `Server error (${response.status}). Please try again later.`,
        details: `HTTP ${response.status}`,
      } as ApiError;
    }
    return {} as T;
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    throw {
      error: 'Invalid response from server',
      details: 'Server did not return valid JSON',
    } as ApiError;
  }

  if (!response.ok) {
    const error: ApiError = {
      error: data.error || `HTTP error! status: ${response.status}`,
      details: data.details || data,
    };
    throw error;
  }

  return data;
}

// Registration data type - includes all profile fields for single-call registration
export interface RegisterData {
  email: string;
  password: string;
  name: string;
  year?: number;
  bio?: string | null;
  phone?: string | null;
  contactPermission?: 'all' | 'year-group' | 'none';
  linkedin?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  thenPhoto?: string | null;
  nowPhoto?: string | null;
}

// Auth API
export const authApi = {
  register: async (data: RegisterData) => {
    const response = await apiRequest<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.token) {
      await setAuthToken(response.token);
    }
    return response;
  },

  login: async (email: string, password: string) => {
    const response = await apiRequest<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (response.token) {
      await setAuthToken(response.token);
    }
    return response;
  },

  logout: async () => {
    await removeAuthToken();
  },

  getCurrentUser: async () => {
    return apiRequest<any>('/auth/me');
  },

  checkUserExists: async (email: string) => {
    return apiRequest<{ exists: boolean }>('/auth/check-user', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  forgotDetails: async (email: string) => {
    return apiRequest<{ message: string }>('/auth/forgot-details', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  requestPasswordReset: async (email: string) => {
    return apiRequest<{ message: string }>('/auth/forgot-details', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  getSecurityQuestion: async (email: string) => {
    return apiRequest<{ email: string; securityQuestion: string }>('/auth/forgot-password/get-question', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  verifySecurityAnswer: async (email: string, securityAnswer: string) => {
    return apiRequest<{ success: boolean; message?: string; token?: string; user?: any }>(
      '/auth/forgot-password/verify-answer',
      {
        method: 'POST',
        body: JSON.stringify({ email, securityAnswer }),
      }
    );
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiRequest<{ message: string }>('/auth/change-password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  // Admin login (separate from regular user login)
  adminLogin: async (email: string, password: string) => {
    const response = await apiRequest<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response;
  },

  deleteAccount: async (password: string) => {
    const response = await apiRequest<{ message: string }>('/auth/delete-account', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
    await removeAuthToken();
    return response;
  },
};

// Alumni API
export const alumniApi = {
  getAll: async (filters?: { year?: number; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.search) params.append('search', filters.search);

    const query = params.toString();
    return apiRequest<any[]>(`/alumni${query ? `?${query}` : ''}`);
  },

  getById: async (id: string) => {
    return apiRequest<any>(`/alumni/${id}`);
  },

  getMe: async () => {
    return apiRequest<any>('/alumni/me');
  },

  getMyProfile: async () => {
    return apiRequest<any>('/alumni/me/profile');
  },

  createOrUpdateProfile: async (data: any) => {
    return apiRequest<any>('/alumni/me/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateProfile: async (data: any) => {
    return apiRequest<any>('/alumni/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// Projects API
export const projectsApi = {
  getAll: async () => {
    return apiRequest<any[]>('/projects');
  },

  getById: async (id: string) => {
    return apiRequest<any>(`/projects/${id}`);
  },

  donate: async (id: string, amount: number) => {
    return apiRequest<any>(`/projects/${id}/donate`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },
};

// Year Groups API
export const yearGroupsApi = {
  getAll: async () => {
    return apiRequest<any[]>('/year-groups');
  },

  getByYear: async (year: number) => {
    return apiRequest<any>(`/year-groups/${year}`);
  },

  getMembersByYear: async (year: number) => {
    return apiRequest<{ year: number; totalMembers: number; members: any[] }>(`/year-groups/${year}/members`);
  },
};

// Year Group Posts API
export const yearGroupPostsApi = {
  getByYearGroup: async (yearGroupId: string) => {
    return apiRequest<any[]>(`/year-group-posts/${yearGroupId}`);
  },

  getById: async (id: string) => {
    return apiRequest<any>(`/year-group-posts/post/${id}`);
  },
};

// Stories API
export const storiesApi = {
  getAll: async () => {
    const response = await apiRequest<{ data: any[]; total: number; limit: number; offset: number }>('/stories');
    return response.data || [];
  },

  getById: async (id: string) => {
    return apiRequest<any>(`/stories/${id}`);
  },
};

// Memorials API
export const memorialsApi = {
  getAll: async () => {
    return apiRequest<any[]>('/memorials');
  },

  getById: async (id: string) => {
    return apiRequest<any>(`/memorials/${id}`);
  },
};

// Reunions API
export const reunionsApi = {
  getAll: async () => {
    return apiRequest<any[]>('/reunions');
  },

  getById: async (id: string) => {
    return apiRequest<any>(`/reunions/${id}`);
  },

  register: async (id: string, status: 'coming' | 'maybe' | 'not_coming' = 'coming') => {
    return apiRequest<{ message: string; registration: any }>(`/reunions/${id}/register`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },

  unregister: async (id: string) => {
    return apiRequest<{ message: string }>(`/reunions/${id}/register`, {
      method: 'DELETE',
    });
  },

  checkRegistration: async (id: string) => {
    return apiRequest<{ isRegistered: boolean; registration: any }>(`/reunions/${id}/check-registration`);
  },
};

// Notifications API
export const notificationsApi = {
  getAll: async () => {
    const response = await apiRequest<{ data: any[]; total: number }>('/notifications');
    return response.data || [];
  },

  markAsRead: async (id: string) => {
    return apiRequest<any>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  markAllAsRead: async () => {
    return apiRequest<{ message: string }>('/notifications/read-all', {
      method: 'PATCH',
    });
  },

  getUnreadCount: async () => {
    return apiRequest<{ count: number }>('/notifications/unread');
  },

  delete: async (id: string) => {
    return apiRequest<{ message: string }>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },
};

// Membership API
export const membershipApi = {
  submitRequest: async (data: {
    fullName: string;
    email: string;
    phone: string;
    whatsapp: string;
    monthlyAmount: number;
  }) => {
    return apiRequest<{ message: string; request: any }>('/membership/request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMyRequest: async () => {
    return apiRequest<any>('/membership/my-request');
  },
};

// Push notifications API for Expo (mobile)
export const pushApi = {
  registerToken: async (token: string, platform: 'ios' | 'android') => {
    return apiRequest<{ message: string; tokenId: string }>('/expo-push/register', {
      method: 'POST',
      body: JSON.stringify({ token, platform }),
    });
  },

  unregisterToken: async (token?: string) => {
    return apiRequest<{ message: string }>('/expo-push/unregister', {
      method: 'DELETE',
      body: token ? JSON.stringify({ token }) : undefined,
    });
  },

  getMyTokens: async () => {
    return apiRequest<{ tokens: Array<{ id: string; platform: string; createdAt: string }>; count: number }>(
      '/expo-push/tokens'
    );
  },
};
