/**
 * Admin API Service Layer for Mobile
 * All admin-specific API endpoints with admin token authentication
 */

import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Get API URL from Expo constants
// Set via environment variable: API_URL=http://YOUR_IP:3001/api npx expo start
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001/api';

// Debug: Log the API URL being used
console.log('[AdminAPI] Using API URL:', API_BASE_URL);

// In-memory flag for fresh login (more reliable than AsyncStorage for immediate checks)
let adminJustLoggedIn = false;

export const setAdminJustLoggedIn = (value: boolean) => {
  adminJustLoggedIn = value;
};

export const checkAndClearJustLoggedIn = (): boolean => {
  if (adminJustLoggedIn) {
    adminJustLoggedIn = false;
    return true;
  }
  return false;
};

// Types
export interface ApiError {
  error: string;
  details?: any;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isMember: boolean;
  monthlyAmount?: number | null;
  hasPasswordResetRequest?: boolean;
  createdAt: string;
  profile?: {
    id: string;
    name: string;
    year: number;
    bio?: string | null;
    phone?: string | null;
  } | null;
}

export interface PendingMember {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  whatsapp: string;
  monthlyAmount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  userId?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface AdminStats {
  totalUsers: number;
  totalMembers: number;
  pendingMembers: number;
  totalStories: number;
  totalMemorials: number;
  totalReunions: number;
  totalProjects: number;
  totalYearGroups: number;
}

export interface Story {
  id: string;
  title: string;
  content: string;
  images?: string[];
  date?: string;
  createdAt: string;
  author?: {
    id: string;
    name: string;
  };
}

export interface Memorial {
  id: string;
  name: string;
  year: number;
  photo?: string | null;
  imageLink?: string | null;
  tribute: string;
  dateOfPassing: string;
  funeralDate?: string | null;
  funeralLocation?: string | null;
  contactNumber?: string | null;
  createdAt: string;
}

export interface Reunion {
  id: string;
  title: string;
  date: string;
  location: string;
  description?: string | null;
  targetYearGroups?: number[] | null;
  createdAt: string;
  _count?: {
    registrations: number;
  };
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  goal?: number;
  raised?: number;
  images?: string[];
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  branchCode?: string;
  reference?: string;
  createdAt: string;
}

export interface YearGroup {
  year: number;
  groupPhoto?: string | null;
  photos?: string[] | null;
  yearInfo?: string | null;
  whatsappLink?: string | null;
  _count?: {
    members: number;
  };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

const ADMIN_TOKEN_KEY = 'alumni_admin_token';

// Web fallback for localStorage
const webStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  },
};

const isWeb = Platform.OS === 'web';

// Get admin auth token from secure storage
const getAdminToken = async (): Promise<string | null> => {
  try {
    if (isWeb) {
      return webStorage.getItem(ADMIN_TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(ADMIN_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting admin token:', error);
    return null;
  }
};

// Set admin auth token in secure storage
export const setAdminToken = async (token: string): Promise<void> => {
  try {
    if (isWeb) {
      webStorage.setItem(ADMIN_TOKEN_KEY, token);
      return;
    }
    await SecureStore.setItemAsync(ADMIN_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error setting admin token:', error);
    throw error;
  }
};

// Clear admin auth token from secure storage
export const clearAdminToken = async (): Promise<void> => {
  try {
    if (isWeb) {
      webStorage.removeItem(ADMIN_TOKEN_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(ADMIN_TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing admin token:', error);
    throw error;
  }
};

// Admin API request wrapper
async function adminApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAdminToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

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

  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    if (!response.ok) {
      throw {
        error: `Server error (${response.status}). Please try again later.`,
        details: `HTTP ${response.status}`,
        status: response.status,
      } as ApiError & { status: number };
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
    const error: ApiError & { status?: number } = {
      error: data.error || `HTTP error! status: ${response.status}`,
      details: data.details || data,
      status: response.status,
    };
    throw error;
  }

  return data;
}

// Admin API endpoints
export const adminApi = {
  // Verify admin session is still valid
  verifySession: async () => {
    return adminApiRequest<{ valid: boolean; user: any }>('/admin/verify');
  },

  // Get dashboard stats from dedicated endpoint
  getStats: async (): Promise<AdminStats> => {
    return adminApiRequest<AdminStats>('/admin/stats');
  },

  // Users management
  getUsers: async (): Promise<AdminUser[]> => {
    const response = await adminApiRequest<{ data: AdminUser[]; total: number }>('/admin/users?limit=10000');
    return response.data || [];
  },

  updateUserMembership: async (userId: string, data: { isMember: boolean; monthlyAmount?: number }) => {
    return adminApiRequest<any>(`/admin/users/${userId}/member`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  resetUserPassword: async (userId: string, newPassword: string) => {
    return adminApiRequest<{ message: string; newPassword: string }>(`/admin/users/${userId}/reset-password`, {
      method: 'PATCH',
      body: JSON.stringify({ newPassword }),
    });
  },

  deleteUser: async (userId: string) => {
    return adminApiRequest<{ message: string }>(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },
};

// Admin Membership API
export const adminMembershipApi = {
  getAll: async (status?: 'pending' | 'approved' | 'rejected'): Promise<PendingMember[]> => {
    const query = status ? `?status=${status}` : '';
    return adminApiRequest<PendingMember[]>(`/membership/requests${query}`);
  },

  getPending: async (): Promise<PendingMember[]> => {
    return adminMembershipApi.getAll('pending');
  },

  approve: async (id: string, monthlyAmount?: number) => {
    return adminApiRequest<{ message: string; request: any }>(`/membership/requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'approved',
        monthlyAmount,
      }),
    });
  },

  reject: async (id: string, rejectionReason?: string) => {
    return adminApiRequest<{ message: string; request: any }>(`/membership/requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'rejected', rejectionReason }),
    });
  },

  delete: async (id: string) => {
    return adminApiRequest<{ message: string }>(`/membership/requests/${id}`, {
      method: 'DELETE',
    });
  },
};

// Admin Stories API
export const adminStoriesApi = {
  getAll: async (): Promise<Story[]> => {
    const response = await adminApiRequest<{ data: Story[]; total: number }>('/stories');
    return response.data || [];
  },

  getById: async (id: string): Promise<Story> => {
    return adminApiRequest<Story>(`/stories/${id}`);
  },

  create: async (data: { title: string; content: string; images?: string[]; date?: string }) => {
    return adminApiRequest<Story>('/stories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: { title?: string; content?: string; images?: string[]; date?: string }) => {
    return adminApiRequest<Story>(`/stories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return adminApiRequest<{ message: string }>(`/stories/${id}`, {
      method: 'DELETE',
    });
  },
};

// Admin Memorials API
export const adminMemorialsApi = {
  getAll: async (): Promise<Memorial[]> => {
    return adminApiRequest<Memorial[]>('/memorials');
  },

  getById: async (id: string): Promise<Memorial> => {
    return adminApiRequest<Memorial>(`/memorials/${id}`);
  },

  create: async (data: {
    name: string;
    year: number;
    photo?: string | null;
    imageLink?: string | null;
    tribute: string;
    dateOfPassing: string;
    funeralDate?: string | null;
    funeralLocation?: string | null;
    contactNumber?: string | null;
  }) => {
    return adminApiRequest<Memorial>('/memorials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: {
    name?: string;
    year?: number;
    photo?: string | null;
    imageLink?: string | null;
    tribute?: string;
    dateOfPassing?: string;
    funeralDate?: string | null;
    funeralLocation?: string | null;
    contactNumber?: string | null;
  }) => {
    return adminApiRequest<Memorial>(`/memorials/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return adminApiRequest<{ message: string }>(`/memorials/${id}`, {
      method: 'DELETE',
    });
  },
};

// Admin Reunions API
export const adminReunionsApi = {
  getAll: async (): Promise<Reunion[]> => {
    return adminApiRequest<Reunion[]>('/reunions');
  },

  getById: async (id: string): Promise<Reunion> => {
    return adminApiRequest<Reunion>(`/reunions/${id}`);
  },

  create: async (data: {
    title: string;
    date: string;
    location: string;
    description?: string | null;
    targetYearGroups?: number[] | null;
  }) => {
    return adminApiRequest<Reunion>('/reunions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: {
    title?: string;
    date?: string;
    location?: string;
    description?: string | null;
    targetYearGroups?: number[] | null;
  }) => {
    return adminApiRequest<Reunion>(`/reunions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return adminApiRequest<{ message: string }>(`/reunions/${id}`, {
      method: 'DELETE',
    });
  },

  getRegistrations: async (id: string) => {
    return adminApiRequest<{
      reunion: Reunion;
      registrations: any[];
      totalRegistrations: number;
    }>(`/reunions/${id}/registrations`);
  },
};

// Admin Year Groups API
export const adminYearGroupsApi = {
  getAll: async (): Promise<YearGroup[]> => {
    return adminApiRequest<YearGroup[]>('/year-groups');
  },

  getByYear: async (year: number): Promise<YearGroup> => {
    return adminApiRequest<YearGroup>(`/year-groups/${year}`);
  },

  create: async (data: {
    year: number;
    groupPhoto?: string | null;
    photos?: string[] | null;
    yearInfo?: string | null;
    whatsappLink?: string | null;
  }) => {
    return adminApiRequest<YearGroup>('/year-groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (year: number, data: {
    groupPhoto?: string | null;
    photos?: string[] | null;
    yearInfo?: string | null;
    whatsappLink?: string | null;
  }) => {
    return adminApiRequest<YearGroup>(`/year-groups/${year}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (year: number) => {
    return adminApiRequest<{ message: string }>(`/year-groups/${year}`, {
      method: 'DELETE',
    });
  },
};

// Admin Projects API
export const adminProjectsApi = {
  getAll: async (): Promise<Project[]> => {
    const response = await adminApiRequest<{ data: Project[]; total: number }>('/projects');
    return response.data || [];
  },

  getById: async (id: string): Promise<Project> => {
    return adminApiRequest<Project>(`/projects/${id}`);
  },

  create: async (data: {
    title: string;
    description?: string;
    goal?: number;
    images?: string[];
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
    branchCode?: string;
    reference?: string;
  }) => {
    return adminApiRequest<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: {
    title?: string;
    description?: string;
    goal?: number;
    images?: string[];
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
    branchCode?: string;
    reference?: string;
  }) => {
    return adminApiRequest<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return adminApiRequest<{ message: string }>(`/projects/${id}`, {
      method: 'DELETE',
    });
  },
};

// Admin Notifications API
export const adminNotificationsApi = {
  getAll: async (): Promise<Notification[]> => {
    const response = await adminApiRequest<{ data: Notification[]; total: number }>('/notifications');
    return response.data || [];
  },

  markAsRead: async (id: string) => {
    return adminApiRequest<any>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  markAllAsRead: async () => {
    return adminApiRequest<{ message: string }>('/notifications/read-all', {
      method: 'PATCH',
    });
  },

  getUnreadCount: async () => {
    return adminApiRequest<{ count: number }>('/notifications/unread');
  },

  delete: async (id: string) => {
    return adminApiRequest<{ message: string }>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },
};
