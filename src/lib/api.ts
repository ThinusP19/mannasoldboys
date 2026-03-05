/**
 * API Service Layer
 * Centralized API client for all backend requests
 */

// MOCK MODE - Set to true to disable backend and use mock data
const MOCK_MODE = true;

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// Mock user data for offline mode
const mockUser = {
  id: "mock-user-1",
  email: "test@example.com",
  name: "Johan van der Merwe",
  role: "user",
  isMember: true,
  createdAt: new Date().toISOString(),
};

const mockProfile = {
  id: "mock-profile-1",
  userId: "mock-user-1",
  name: "Johan van der Merwe",
  year: 2005,
  obNumber: "OB2005-001",
  bio: "Proud Monnas Old Boy from the class of 2005. Now working as an engineer in Johannesburg.",
  phone: "0631234567",
  email: "test@example.com",
  contactPermission: "all",
  thenPhoto: null,
  nowPhoto: null,
  linkedin: "https://linkedin.com/in/johanvdm",
  instagram: null,
  facebook: null,
  company: { name: "Van der Merwe Engineering", role: "Director", industry: "Engineering" },
};

// Mock alumni list with OB numbers and company info
const mockAlumni = [
  { id: "1", name: "Johan van der Merwe", year: 2005, obNumber: "OB2005-001", bio: "Engineer in Johannesburg", email: "johan@example.com", phone: "0631234567", contactPermission: "all", company: { name: "Van der Merwe Engineering", role: "Director", industry: "Engineering" } },
  { id: "2", name: "Pieter Botha", year: 2005, obNumber: "OB2005-002", bio: "Doctor in Cape Town", email: "pieter@example.com", phone: "0829876543", contactPermission: "all", company: { name: "Botha Medical Practice", role: "GP", industry: "Medical" } },
  { id: "3", name: "Willem Pretorius", year: 2005, obNumber: "OB2005-003", bio: "Farmer in Free State", email: "willem@example.com", phone: "0721112233", contactPermission: "year-group", company: { name: "Pretorius Farms", role: "Owner", industry: "Agriculture" } },
  { id: "4", name: "Hendrik Steyn", year: 2004, obNumber: "OB2004-001", bio: "Lawyer in Pretoria", email: "hendrik@example.com", phone: "0834445566", contactPermission: "all", company: { name: "Steyn & Associates", role: "Partner", industry: "Legal" } },
  { id: "5", name: "Jan de Klerk", year: 2004, obNumber: "OB2004-002", bio: "Teacher at Monnas", email: "jan@example.com", phone: "0767778899", contactPermission: "all", company: { name: "Monnas", role: "Teacher", industry: "Education" } },
  { id: "6", name: "Danie Venter", year: 2003, obNumber: "OB2003-001", bio: "Accountant in Bloemfontein", email: "danie@example.com", phone: "0610001122", contactPermission: "all", company: { name: "Venter Accounting", role: "CA", industry: "Finance" } },
];

// Mock services for marketplace
const mockServices = [
  { id: "1", title: "Legal Consultation", description: "Expert legal advice for business and personal matters. Specializing in contract law and estate planning.", category: "Legal", price: "From R800/hr", ownerId: "4", ownerName: "Hendrik Steyn", contact: { phone: "0834445566", email: "hendrik@example.com", whatsapp: "0834445566" } },
  { id: "2", title: "Medical Check-ups", description: "Comprehensive health assessments and general practice services.", category: "Medical", price: "R650 per consultation", ownerId: "2", ownerName: "Pieter Botha", contact: { phone: "0829876543", email: "pieter@example.com", whatsapp: "0829876543" } },
  { id: "3", title: "Tax & Accounting Services", description: "Full accounting services for small businesses. Tax returns, bookkeeping, and financial planning.", category: "Finance", price: "From R500/month", ownerId: "6", ownerName: "Danie Venter", contact: { phone: "0610001122", email: "danie@example.com", whatsapp: "0610001122" } },
  { id: "4", title: "Civil Engineering Projects", description: "Structural design, project management, and construction consulting.", category: "Construction", price: "Quote on request", ownerId: "1", ownerName: "Johan van der Merwe", contact: { phone: "0631234567", email: "johan@example.com", whatsapp: "0631234567" } },
  { id: "5", title: "Farm Fresh Produce", description: "Direct from farm organic vegetables and meat. Weekly delivery available in Free State.", category: "Agriculture", price: "Various", ownerId: "3", ownerName: "Willem Pretorius", contact: { phone: "0721112233", email: "willem@example.com", whatsapp: "0721112233" } },
  { id: "6", title: "Private Tutoring", description: "Maths and Science tutoring for Grade 10-12. Exam preparation specialist.", category: "Education", price: "R350/hr", ownerId: "5", ownerName: "Jan de Klerk", contact: { phone: "0767778899", email: "jan@example.com", whatsapp: "0767778899" } },
];

// Mock sponsors
const mockSponsors = [
  { id: "1", companyName: "Potch Motors", logo: null, website: "https://potchmotors.co.za", description: "Proud supporter of Monnas Old Boys since 1985", tier: "Gold", activeUntil: "2025-12-31" },
  { id: "2", companyName: "NWU Business School", logo: null, website: "https://nwu.ac.za", description: "Empowering the next generation of leaders", tier: "Gold", activeUntil: "2025-12-31" },
  { id: "3", companyName: "First National Bank Potch", logo: null, website: "https://fnb.co.za", description: "Banking partner for Old Boys network", tier: "Silver", activeUntil: "2025-06-30" },
  { id: "4", companyName: "Spur Steak Ranches Potch", logo: null, website: "https://spur.co.za", description: "Official reunion venue partner", tier: "Bronze", activeUntil: "2025-06-30" },
];

// Mock stories
const mockStories = [
  { id: "1", title: "Die Groot Rugby Oorwinning van 1998", content: "Dit was 'n koue Saterdagoggend toe ons teen Affies gespeel het...", date: "1998-06-15", authorName: "Oom Koos", images: [] },
  { id: "2", title: "Koshuis Staaltjies", content: "In my matriekjaar het ons die beste grappies uitgehaal in die koshuis...", date: "2002-03-20", authorName: "Pieter Botha", images: [] },
  { id: "3", title: "Die Eerste Dag by Monnas", content: "Ek onthou nog my eerste dag by Monnas. Ek was so senuweeagtig...", date: "1995-01-15", authorName: "Johan vd Merwe", images: [] },
];

// Mock memorials
const mockMemorials = [
  { id: "1", name: "Jannie van Wyk", year: 1985, tribute: "Altyd 'n ware vriend en gentleman. Ons sal hom nooit vergeet nie.", dateOfPassing: "2023-05-10", photo: null },
  { id: "2", name: "Frikkie Marais", year: 1990, tribute: "Legendariese rugbyspeler en mentor vir baie jong manne.", dateOfPassing: "2022-11-22", photo: null },
];

// Mock reunions
const mockReunions = [
  { id: "1", title: "Klas van 2005 - 20 Jaar Reünie", date: "2025-06-15", location: "Monnas Saal", description: "Kom vier saam met ons 20 jaar sedert ons gematrikuleer het!", targetYearGroups: [2005] },
  { id: "2", title: "Monnas Old Boys Braai", date: "2025-03-22", location: "Potch Country Club", description: "Jaarlikse braai vir alle Monnas Old Boys", targetYearGroups: [] },
];

// Mock year groups
const mockYearGroups = [
  { id: "2005", year: 2005, groupPhoto: null, photos: [], yearInfo: "Klas van 2005 - 120 matrieks", whatsappLink: "https://chat.whatsapp.com/example1", totalMembers: 45 },
  { id: "2004", year: 2004, groupPhoto: null, photos: [], yearInfo: "Klas van 2004 - 115 matrieks", whatsappLink: "https://chat.whatsapp.com/example2", totalMembers: 38 },
  { id: "2003", year: 2003, groupPhoto: null, photos: [], yearInfo: "Klas van 2003 - 110 matrieks", whatsappLink: null, totalMembers: 32 },
];

// Mock projects
const mockProjects = [
  { id: "1", title: "Nuwe Rugby Pawiljoen", description: "Help ons om 'n nuwe pawiljoen te bou vir die rugbyvelde.", goal: 500000, raised: 125000, images: [] },
  { id: "2", title: "Beursfonds", description: "Ondersteun verdienstelike studente met beurse.", goal: 200000, raised: 85000, images: [] },
];

// Types
export interface ApiError {
  error: string;
  details?: any;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Safari-safe localStorage helpers (Safari private mode blocks localStorage)
const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    console.warn('localStorage not available');
  }
};

const safeRemoveItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    console.warn('localStorage not available');
  }
};

// Get regular user auth token (for visitor portal only)
const getToken = (): string | null => {
  // ONLY return regular user token - admin has separate system
  return safeGetItem("authToken");
};

// Get admin auth token (for admin portal only)
const getAdminToken = (): string | null => {
  // ONLY return admin token - completely separate from regular users
  return safeGetItem("adminAuthToken");
};

// Set auth token
export const setAuthToken = (token: string): void => {
  safeSetItem("authToken", token);
};

// Remove auth token
export const removeAuthToken = (): void => {
  safeRemoveItem("authToken");
};

// Base fetch wrapper with error handling (for regular user API calls)
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  useAdminToken: boolean = false
): Promise<T> {
  // Use admin token only if explicitly requested (for admin API calls)
  // Otherwise use regular user token (for visitor API calls)
  const token = useAdminToken ? getAdminToken() : getToken();
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    // Add timeout to fetch request
    // Longer timeout for auth endpoints (10 seconds) due to password hashing and database queries
    // Shorter timeout for other endpoints (5 seconds)
    const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/register');
    const timeoutMs = isAuthEndpoint ? 10000 : 5000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
  } catch (error: any) {
    // Network error (backend not running, CORS, timeout, etc.)
    if (error.name === 'AbortError') {
      throw {
        error: "Request timeout. Backend may be slow or unavailable.",
        details: "Request took longer than expected. Please check your connection and try again.",
      } as ApiError;
    }
    throw {
      error: "Cannot connect to server. Make sure the backend is running on port 3001.",
      details: error.message,
    } as ApiError;
  }

  // Handle non-JSON responses
  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    if (!response.ok) {
      throw {
        error: `Server error (${response.status}). Make sure the backend is running.`,
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
      error: "Invalid response from server",
      details: "Server did not return valid JSON",
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

// Auth API
export const authApi = {
  register: async (email: string, password: string, name: string) => {
    if (MOCK_MODE) {
      const token = "mock-token-" + Date.now();
      setAuthToken(token);
      return { user: { ...mockUser, email, name }, token };
    }
    const response = await apiRequest<{ user: any; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
    if (response.token) {
      setAuthToken(response.token);
    }
    return response;
  },

  login: async (email: string, password: string) => {
    if (MOCK_MODE) {
      const token = "mock-token-" + Date.now();
      setAuthToken(token);
      return { user: { ...mockUser, email }, token };
    }
    const response = await apiRequest<{ user: any; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (response.token) {
      setAuthToken(response.token);
    }
    return response;
  },

  // Admin login - separate from regular user login, doesn't set regular auth token
  adminLogin: async (email: string, password: string) => {
    if (MOCK_MODE) {
      return { user: { ...mockUser, email, role: "admin" }, token: "mock-admin-token" };
    }
    const response = await apiRequest<{ user: any; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    // Don't set regular auth token - admin uses separate storage
    return response;
  },

  logout: () => {
    removeAuthToken();
  },

  getCurrentUser: async () => {
    if (MOCK_MODE) {
      return mockUser;
    }
    return apiRequest<any>("/auth/me");
  },

  checkUserExists: async (email: string) => {
    if (MOCK_MODE) {
      return { exists: false };
    }
    return apiRequest<{ exists: boolean }>("/auth/check-user", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  forgotDetails: async (email: string) => {
    if (MOCK_MODE) {
      return { message: "Request submitted (mock mode)" };
    }
    return apiRequest<{ message: string }>("/auth/forgot-details", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  requestPasswordReset: async (email: string) => {
    if (MOCK_MODE) {
      return { message: "Reset email sent (mock mode)" };
    }
    return apiRequest<{ message: string }>("/auth/forgot-details", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  getSecurityQuestion: async (email: string) => {
    if (MOCK_MODE) {
      return { email, securityQuestion: "What is your favorite color?" };
    }
    return apiRequest<{ email: string; securityQuestion: string }>("/auth/forgot-password/get-question", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  verifySecurityAnswer: async (email: string, securityAnswer: string) => {
    if (MOCK_MODE) {
      return { success: true, message: "Verified (mock mode)" };
    }
    return apiRequest<{ success: boolean; message?: string; token?: string; user?: any }>("/auth/forgot-password/verify-answer", {
      method: "POST",
      body: JSON.stringify({ email, securityAnswer }),
    });
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    if (MOCK_MODE) {
      return { message: "Password changed (mock mode)" };
    }
    return apiRequest<{ message: string }>("/auth/change-password", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  deleteAccount: async (password: string) => {
    if (MOCK_MODE) {
      return { message: "Account deleted (mock mode)" };
    }
    return apiRequest<{ message: string }>("/auth/delete-account", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    });
  },
};

// Alumni API
export const alumniApi = {
  getAll: async (filters?: { year?: number; search?: string }) => {
    if (MOCK_MODE) {
      let results = [...mockAlumni];
      if (filters?.year) {
        results = results.filter(a => a.year === filters.year);
      }
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        results = results.filter(a => a.name.toLowerCase().includes(search));
      }
      return results;
    }
    const params = new URLSearchParams();
    if (filters?.year) params.append("year", filters.year.toString());
    if (filters?.search) params.append("search", filters.search);

    const query = params.toString();
    return apiRequest<any[]>(`/alumni${query ? `?${query}` : ""}`);
  },

  getById: async (id: string) => {
    if (MOCK_MODE) {
      return mockProfile;
    }
    return apiRequest<any>(`/alumni/${id}`);
  },

  getMe: async () => {
    if (MOCK_MODE) {
      return { ...mockUser, profile: mockProfile };
    }
    return apiRequest<any>("/alumni/me");
  },

  getMyProfile: async () => {
    if (MOCK_MODE) {
      return mockProfile;
    }
    return apiRequest<any>("/alumni/me/profile");
  },

  createOrUpdateProfile: async (data: any) => {
    if (MOCK_MODE) {
      return { ...mockProfile, ...data };
    }
    return apiRequest<any>("/alumni/me/profile", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateProfile: async (data: any) => {
    if (MOCK_MODE) {
      return { ...mockProfile, ...data };
    }
    return apiRequest<any>("/alumni/me/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};


// Projects API (Public)
export const projectsApi = {
  getAll: async () => {
    if (MOCK_MODE) {
      return mockProjects;
    }
    const response = await apiRequest<{ data: any[]; total: number; limit: number; offset: number }>("/projects");
    return response.data || [];
  },

  getById: async (id: string) => {
    return apiRequest<any>(`/projects/${id}`);
  },

  donate: async (id: string, amount: number) => {
    return apiRequest<any>(`/projects/${id}/donate`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  },
};

// Admin Projects API
export const adminProjectsApi = {
  getAll: async () => {
    const response = await apiRequest<{ data: any[]; total: number; limit: number; offset: number }>("/projects", {}, true);
    return response.data || [];
  },

  getById: async (id: string) => {
    return apiRequest<any>(`/projects/${id}`, {}, true);
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
    return apiRequest<any>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }, true);
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
    return apiRequest<any>(`/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }, true);
  },

  delete: async (id: string) => {
    return apiRequest<any>(`/projects/${id}`, {
      method: "DELETE",
    }, true);
  },
};

// Year Groups API
export const yearGroupsApi = {
  getAll: async () => {
    if (MOCK_MODE) {
      return mockYearGroups;
    }
    return apiRequest<any[]>("/year-groups");
  },

  getByYear: async (year: number) => {
    if (MOCK_MODE) {
      const yg = mockYearGroups.find(y => y.year === year);
      return yg || { year, groupPhoto: null, photos: [], yearInfo: null, whatsappLink: null };
    }
    return apiRequest<any>(`/year-groups/${year}`);
  },

  getMembersByYear: async (year: number) => {
    if (MOCK_MODE) {
      const members = mockAlumni.filter(a => a.year === year);
      return { year, totalMembers: members.length, members };
    }
    return apiRequest<{ year: number; totalMembers: number; members: any[] }>(`/year-groups/${year}/members`);
  },

  create: async (data: {
    year: number;
    groupPhoto?: string | null;
    photos?: string[] | null;
    yearInfo?: string | null;
    whatsappLink?: string | null;
  }) => {
    return apiRequest<any>("/year-groups", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (year: number, data: {
    groupPhoto?: string | null;
    photos?: string[] | null;
    yearInfo?: string | null;
    whatsappLink?: string | null;
  }) => {
    return apiRequest<any>(`/year-groups/${year}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete: async (year: number) => {
    return apiRequest<{ message: string }>(`/year-groups/${year}`, {
      method: "DELETE",
    });
  },
};

// Admin API - uses admin token, completely separate from regular users
export const adminApi = {
  // Verify admin session is still valid (token not expired, user still admin)
  verifySession: async () => {
    if (MOCK_MODE) {
      return { valid: true, user: { ...mockUser, role: "admin" } };
    }
    return apiRequest<{ valid: boolean; user: any }>("/admin/verify", {}, true);
  },

  // Get dashboard stats from dedicated endpoint
  getStats: async () => {
    if (MOCK_MODE) {
      return {
        totalUsers: mockAlumni.length,
        totalMembers: mockAlumni.length,
        pendingMembers: 2,
        totalStories: mockStories.length,
        totalMemorials: mockMemorials.length,
        totalReunions: mockReunions.length,
        totalProjects: mockProjects.length,
        totalYearGroups: mockYearGroups.length,
      };
    }
    return apiRequest<{
      totalUsers: number;
      totalMembers: number;
      pendingMembers: number;
      totalStories: number;
      totalMemorials: number;
      totalReunions: number;
      totalProjects: number;
      totalYearGroups: number;
    }>("/admin/stats", {}, true);
  },

  getUsers: async () => {
    if (MOCK_MODE) {
      return mockAlumni.map(a => ({ ...a, isMember: true, role: "user" }));
    }
    const response = await apiRequest<{ data: any[]; total: number; limit: number; offset: number }>("/admin/users", {}, true);
    return response.data || [];
  },

  updateUserMembership: async (userId: string, data: { isMember: boolean; monthlyAmount?: number }) => {
    if (MOCK_MODE) {
      return { message: "Updated (mock)", userId, ...data };
    }
    return apiRequest<any>(`/admin/users/${userId}/member`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }, true);
  },

  resetUserPassword: async (userId: string, newPassword: string) => {
    if (MOCK_MODE) {
      return { message: "Password reset (mock)", userId };
    }
    return apiRequest<any>(`/admin/users/${userId}/reset-password`, {
      method: "PATCH",
      body: JSON.stringify({ newPassword }),
    }, true);
  },

  deleteUser: async (userId: string) => {
    if (MOCK_MODE) {
      const user = mockAlumni.find(a => a.id === userId);
      return { message: "Deleted (mock)", user: user || { id: userId, email: "", name: "" } };
    }
    return apiRequest<{ message: string; user: { id: string; email: string; name: string } }>(`/admin/users/${userId}`, {
      method: "DELETE",
    }, true);
  },
};

// Admin versions of APIs - use admin token (for admin dashboard only)
export const adminStoriesApi = {
  getAll: async () => {
    if (MOCK_MODE) {
      return mockStories;
    }
    const response = await apiRequest<{ data: any[]; total: number; limit: number; offset: number }>("/stories", {}, true);
    return response.data || [];
  },
  getById: async (id: string) => {
    if (MOCK_MODE) {
      return mockStories.find(s => s.id === id) || null;
    }
    return apiRequest<any>(`/stories/${id}`, {}, true);
  },
  create: async (data: { title: string; content: string; images?: string[]; date?: string }) => {
    return apiRequest<any>("/stories", {
      method: "POST",
      body: JSON.stringify(data),
    }, true);
  },
  update: async (id: string, data: { title?: string; content?: string; images?: string[]; date?: string }) => {
    return apiRequest<any>(`/stories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }, true);
  },
  delete: async (id: string) => {
    return apiRequest<{ message: string }>(`/stories/${id}`, {
      method: "DELETE",
    }, true);
  },
};

export const adminMemorialsApi = {
  getAll: async () => {
    if (MOCK_MODE) {
      return mockMemorials;
    }
    return apiRequest<any[]>("/memorials", {}, true);
  },
  getById: async (id: string) => {
    if (MOCK_MODE) {
      return mockMemorials.find(m => m.id === id) || null;
    }
    return apiRequest<any>(`/memorials/${id}`, {}, true);
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
    return apiRequest<any>("/memorials", {
      method: "POST",
      body: JSON.stringify(data),
    }, true);
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
    return apiRequest<any>(`/memorials/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }, true);
  },
  delete: async (id: string) => {
    return apiRequest<{ message: string }>(`/memorials/${id}`, {
      method: "DELETE",
    }, true);
  },
};

export const adminReunionsApi = {
  getAll: async () => {
    if (MOCK_MODE) {
      return mockReunions;
    }
    return apiRequest<any[]>("/reunions", {}, true);
  },
  getById: async (id: string) => {
    if (MOCK_MODE) {
      return mockReunions.find(r => r.id === id) || null;
    }
    return apiRequest<any>(`/reunions/${id}`, {}, true);
  },
  create: async (data: { title: string; date: string; location: string; description?: string | null; targetYearGroups?: number[] | null }) => {
    return apiRequest<any>("/reunions", {
      method: "POST",
      body: JSON.stringify(data),
    }, true);
  },
  update: async (id: string, data: { title?: string; date?: string; location?: string; description?: string | null; targetYearGroups?: number[] | null }) => {
    return apiRequest<any>(`/reunions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }, true);
  },
  delete: async (id: string) => {
    return apiRequest<{ message: string }>(`/reunions/${id}`, {
      method: "DELETE",
    }, true);
  },
};

export const adminYearGroupsApi = {
  getAll: async () => {
    if (MOCK_MODE) {
      return mockYearGroups;
    }
    return apiRequest<any[]>("/year-groups", {}, true);
  },
  getByYear: async (year: number) => {
    if (MOCK_MODE) {
      return mockYearGroups.find(y => y.year === year) || null;
    }
    return apiRequest<any>(`/year-groups/${year}`, {}, true);
  },
  create: async (data: { year: number; groupPhoto?: string | null; photos?: string[] | null; yearInfo?: string | null; whatsappLink?: string | null }) => {
    return apiRequest<any>("/year-groups", {
      method: "POST",
      body: JSON.stringify(data),
    }, true);
  },
  update: async (year: number, data: { groupPhoto?: string | null; photos?: string[] | null; yearInfo?: string | null; whatsappLink?: string | null }) => {
    return apiRequest<any>(`/year-groups/${year}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }, true);
  },
  delete: async (year: number) => {
    return apiRequest<{ message: string }>(`/year-groups/${year}`, {
      method: "DELETE",
    }, true);
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

// Admin Year Group Posts API
export const adminYearGroupPostsApi = {
  getByYearGroup: async (yearGroupId: string) => {
    return apiRequest<any[]>(`/year-group-posts/${yearGroupId}`, {}, true);
  },
  getById: async (id: string) => {
    return apiRequest<any>(`/year-group-posts/post/${id}`, {}, true);
  },
  create: async (data: {
    yearGroupId: string;
    title: string;
    content: string;
    images?: string[];
  }) => {
    return apiRequest<any>("/year-group-posts", {
      method: "POST",
      body: JSON.stringify(data),
    }, true);
  },
  update: async (id: string, data: {
    title?: string;
    content?: string;
    images?: string[];
    yearGroupId?: string;
  }) => {
    return apiRequest<any>(`/year-group-posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }, true);
  },
  delete: async (id: string) => {
    return apiRequest<{ message: string }>(`/year-group-posts/${id}`, {
      method: "DELETE",
    }, true);
  },
};

// Stories API
export const storiesApi = {
  getAll: async () => {
    if (MOCK_MODE) {
      return mockStories;
    }
    const response = await apiRequest<{ data: any[]; total: number; limit: number; offset: number }>("/stories");
    return response.data || [];
  },

  getById: async (id: string) => {
    if (MOCK_MODE) {
      return mockStories.find(s => s.id === id) || null;
    }
    return apiRequest<any>(`/stories/${id}`);
  },

  create: async (data: { title: string; content: string; images?: string[]; date?: string }) => {
    return apiRequest<any>("/stories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: { title?: string; content?: string; images?: string[]; date?: string }) => {
    return apiRequest<any>(`/stories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest<{ message: string }>(`/stories/${id}`, {
      method: "DELETE",
    });
  },
};

// Memorials API
export const memorialsApi = {
  getAll: async () => {
    if (MOCK_MODE) {
      return mockMemorials;
    }
    return apiRequest<any[]>("/memorials");
  },

  getById: async (id: string) => {
    if (MOCK_MODE) {
      return mockMemorials.find(m => m.id === id) || null;
    }
    return apiRequest<any>(`/memorials/${id}`);
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
    return apiRequest<any>("/memorials", {
      method: "POST",
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
    return apiRequest<any>(`/memorials/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest<{ message: string }>(`/memorials/${id}`, {
      method: "DELETE",
    });
  },
};

// Reunions API
export const reunionsApi = {
  getAll: async () => {
    if (MOCK_MODE) {
      return mockReunions;
    }
    return apiRequest<any[]>("/reunions");
  },

  getById: async (id: string) => {
    if (MOCK_MODE) {
      return mockReunions.find(r => r.id === id) || null;
    }
    return apiRequest<any>(`/reunions/${id}`);
  },

  create: async (data: { title: string; date: string; location: string; description?: string | null; targetYearGroups?: number[] | null }) => {
    return apiRequest<any>("/reunions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: { title?: string; date?: string; location?: string; description?: string | null; targetYearGroups?: number[] | null }) => {
    return apiRequest<any>(`/reunions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest<{ message: string }>(`/reunions/${id}`, {
      method: "DELETE",
    });
  },

  getRegistrations: async (id: string) => {
    // Use admin token for admin panel access
    return apiRequest<{ reunion: any; registrations: any[]; totalRegistrations: number }>(`/reunions/${id}/registrations`, {}, true);
  },

  register: async (id: string, status: 'coming' | 'maybe' | 'not_coming' = 'coming') => {
    return apiRequest<{ message: string; registration: any }>(`/reunions/${id}/register`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
  },

  unregister: async (id: string) => {
    return apiRequest<{ message: string }>(`/reunions/${id}/register`, {
      method: "DELETE",
    });
  },

  checkRegistration: async (id: string) => {
    return apiRequest<{ isRegistered: boolean; registration: any }>(`/reunions/${id}/check-registration`);
  },
};

// Notifications API
export const notificationsApi = {
  getAll: async () => {
    if (MOCK_MODE) {
      return [];
    }
    const response = await apiRequest<{ data: any[]; total: number; limit: number; offset: number }>("/notifications");
    return response.data || [];
  },

  markAsRead: async (id: string) => {
    if (MOCK_MODE) {
      return { id, read: true };
    }
    return apiRequest<any>(`/notifications/${id}/read`, {
      method: "PATCH",
    });
  },

  markAllAsRead: async () => {
    if (MOCK_MODE) {
      return { message: "All marked as read (mock mode)" };
    }
    return apiRequest<{ message: string }>("/notifications/read-all", {
      method: "PATCH",
    });
  },

  getUnreadCount: async () => {
    if (MOCK_MODE) {
      return { count: 0 };
    }
    return apiRequest<{ count: number }>("/notifications/unread");
  },

  delete: async (id: string) => {
    if (MOCK_MODE) {
      return { message: "Deleted (mock mode)" };
    }
    return apiRequest<{ message: string }>(`/notifications/${id}`, {
      method: "DELETE",
    });
  },
};

// Admin notifications API - uses admin token
export const adminNotificationsApi = {
  getAll: async () => {
    const response = await apiRequest<{ data: any[]; total: number; limit: number; offset: number }>("/notifications", {}, true);
    return response.data || [];
  },

  markAsRead: async (id: string) => {
    return apiRequest<any>(`/notifications/${id}/read`, {
      method: "PATCH",
    }, true);
  },

  markAllAsRead: async () => {
    return apiRequest<{ message: string }>("/notifications/read-all", {
      method: "PATCH",
    }, true);
  },

  getUnreadCount: async () => {
    return apiRequest<{ count: number }>("/notifications/unread", {}, true);
  },

  delete: async (id: string) => {
    return apiRequest<{ message: string }>(`/notifications/${id}`, {
      method: "DELETE",
    }, true);
  },
};

// Membership API - for regular users to request membership
export const membershipApi = {
  submitRequest: async (data: {
    fullName: string;
    email: string;
    phone: string;
    whatsapp: string;
    monthlyAmount: number;
  }) => {
    return apiRequest<{ message: string; request: any }>("/membership/request", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getMyRequest: async () => {
    return apiRequest<any>("/membership/my-request");
  },
};

// Admin Membership API - for admins to manage membership requests
export const adminMembershipApi = {
  getAll: async (status?: 'pending' | 'approved' | 'rejected') => {
    const query = status ? `?status=${status}` : '';
    return apiRequest<any[]>(`/membership/requests${query}`, {}, true);
  },

  approve: async (data: { id: string; monthlyAmount?: number }) => {
    return apiRequest<{ message: string; request: any }>(`/membership/requests/${data.id}`, {
      method: "PATCH",
      body: JSON.stringify({ 
        status: 'approved',
        monthlyAmount: data.monthlyAmount,
      }),
    }, true);
  },

  reject: async (id: string, rejectionReason?: string) => {
    return apiRequest<{ message: string; request: any }>(`/membership/requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: 'rejected', rejectionReason }),
    }, true);
  },

  delete: async (id: string) => {
    return apiRequest<{ message: string }>(`/membership/requests/${id}`, {
      method: "DELETE",
    }, true);
  },
};

// Push Notifications API
export const pushApi = {
  // Get VAPID public key for subscription
  getVapidPublicKey: async () => {
    return apiRequest<{ publicKey: string }>("/push/vapid-public-key");
  },

  // Check push notification status
  getStatus: async () => {
    return apiRequest<{ enabled: boolean; hasVapidKey: boolean }>("/push/status");
  },

  // Subscribe to push notifications
  subscribe: async (subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) => {
    return apiRequest<{ message: string; subscription: any }>("/push/subscribe", {
      method: "POST",
      body: JSON.stringify(subscription),
    });
  },

  // Unsubscribe from push notifications
  unsubscribe: async (endpoint: string) => {
    return apiRequest<{ message: string }>("/push/unsubscribe", {
      method: "DELETE",
      body: JSON.stringify({ endpoint }),
    });
  },

  // Unsubscribe all devices
  unsubscribeAll: async () => {
    return apiRequest<{ message: string; count: number }>("/push/unsubscribe-all", {
      method: "DELETE",
    });
  },
};

// Services API (Marketplace)
export const servicesApi = {
  getAll: async (filters?: { category?: string; search?: string }) => {
    if (MOCK_MODE) {
      let results = [...mockServices];
      if (filters?.category) {
        results = results.filter(s => s.category === filters.category);
      }
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        results = results.filter(s =>
          s.title.toLowerCase().includes(search) ||
          s.description.toLowerCase().includes(search) ||
          s.ownerName.toLowerCase().includes(search)
        );
      }
      return results;
    }
    const params = new URLSearchParams();
    if (filters?.category) params.append("category", filters.category);
    if (filters?.search) params.append("search", filters.search);
    const query = params.toString();
    return apiRequest<any[]>(`/services${query ? `?${query}` : ""}`);
  },

  getById: async (id: string) => {
    if (MOCK_MODE) {
      return mockServices.find(s => s.id === id) || null;
    }
    return apiRequest<any>(`/services/${id}`);
  },

  getMyServices: async () => {
    if (MOCK_MODE) {
      return mockServices.filter(s => s.ownerId === mockUser.id);
    }
    return apiRequest<any[]>("/services/mine");
  },

  create: async (data: { title: string; description: string; category: string; price: string; contact: { phone?: string; email?: string; whatsapp?: string } }) => {
    if (MOCK_MODE) {
      const newService = {
        id: String(mockServices.length + 1),
        ...data,
        ownerId: mockUser.id,
        ownerName: mockUser.name,
        contact: { phone: data.contact.phone || "", email: data.contact.email || "", whatsapp: data.contact.whatsapp || "" }
      };
      return newService;
    }
    return apiRequest<any>("/services", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    if (MOCK_MODE) {
      const index = mockServices.findIndex(s => s.id === id);
      if (index >= 0) {
        mockServices[index] = { ...mockServices[index], ...data };
        return mockServices[index];
      }
      return null;
    }
    return apiRequest<any>(`/services/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    if (MOCK_MODE) {
      return { message: "Service deleted (mock)" };
    }
    return apiRequest<{ message: string }>(`/services/${id}`, {
      method: "DELETE",
    });
  },
};

// Sponsors API
export const sponsorsApi = {
  getAll: async () => {
    if (MOCK_MODE) {
      return mockSponsors;
    }
    return apiRequest<any[]>("/sponsors");
  },

  getById: async (id: string) => {
    if (MOCK_MODE) {
      return mockSponsors.find(s => s.id === id) || null;
    }
    return apiRequest<any>(`/sponsors/${id}`);
  },

  getByTier: async (tier: string) => {
    if (MOCK_MODE) {
      return mockSponsors.filter(s => s.tier === tier);
    }
    return apiRequest<any[]>(`/sponsors?tier=${tier}`);
  },
};

// Mock sponsor enquiries
const mockSponsorEnquiries: any[] = [
  { id: "1", companyName: "Botha Attorneys", contactName: "Pieter Botha", email: "pieter@botha.co.za", phone: "0821234567", tier: "Gold", message: "Interested in becoming a Gold sponsor for the next year.", status: "pending", createdAt: new Date().toISOString() },
];

// Sponsor Enquiries API
export const sponsorEnquiriesApi = {
  submit: async (data: { companyName: string; contactName: string; email: string; phone?: string; tier: string; message: string }) => {
    if (MOCK_MODE) {
      const newEnquiry = {
        id: String(mockSponsorEnquiries.length + 1),
        ...data,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      mockSponsorEnquiries.push(newEnquiry);
      return newEnquiry;
    }
    return apiRequest<any>("/sponsor-enquiries", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getAll: async () => {
    if (MOCK_MODE) {
      return mockSponsorEnquiries;
    }
    return apiRequest<any[]>("/sponsor-enquiries");
  },

  updateStatus: async (id: string, status: string) => {
    if (MOCK_MODE) {
      const enquiry = mockSponsorEnquiries.find(e => e.id === id);
      if (enquiry) {
        enquiry.status = status;
        return enquiry;
      }
      return null;
    }
    return apiRequest<any>(`/sponsor-enquiries/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  delete: async (id: string) => {
    if (MOCK_MODE) {
      const index = mockSponsorEnquiries.findIndex(e => e.id === id);
      if (index >= 0) {
        mockSponsorEnquiries.splice(index, 1);
      }
      return { message: "Enquiry deleted" };
    }
    return apiRequest<{ message: string }>(`/sponsor-enquiries/${id}`, {
      method: "DELETE",
    });
  },
};

