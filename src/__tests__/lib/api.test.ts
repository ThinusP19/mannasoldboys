import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import {
  apiRequest,
  setAuthToken,
  removeAuthToken,
  authApi,
  alumniApi,
  projectsApi,
  storiesApi,
  notificationsApi,
} from '@/lib/api';

describe('API Client', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    vi.mocked(localStorage.setItem).mockClear();
    vi.mocked(localStorage.removeItem).mockClear();
  });

  describe('Token Management', () => {
    it('setAuthToken should store token in localStorage', () => {
      setAuthToken('test-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', 'test-token');
    });

    it('removeAuthToken should remove token from localStorage', () => {
      removeAuthToken();
      expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
    });
  });

  describe('apiRequest', () => {
    it('should make GET request successfully', async () => {
      const data = await apiRequest('/projects');
      expect(data).toEqual([
        { id: '1', title: 'Project 1', goal: 10000, raised: 5000 },
        { id: '2', title: 'Project 2', goal: 20000, raised: 15000 },
      ]);
    });

    it('should include auth token in headers when present', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('mock-token');

      // Override handler to check for auth header
      server.use(
        http.get('http://localhost:3001/api/alumni/me', ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          if (authHeader === 'Bearer mock-token') {
            return HttpResponse.json({ id: '1', name: 'Test User' });
          }
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
        })
      );

      const data = await apiRequest('/alumni/me');
      expect(data).toEqual({ id: '1', name: 'Test User' });
    });

    it('should throw error for non-JSON response with error status', async () => {
      server.use(
        http.get('http://localhost:3001/api/bad-endpoint', () => {
          return new HttpResponse('Not Found', {
            status: 404,
            headers: { 'Content-Type': 'text/plain' },
          });
        })
      );

      await expect(apiRequest('/bad-endpoint')).rejects.toEqual({
        error: 'Server error (404). Make sure the backend is running.',
        details: 'HTTP 404',
      });
    });

    it('should throw error for invalid JSON response', async () => {
      server.use(
        http.get('http://localhost:3001/api/invalid-json', () => {
          return new HttpResponse('{ invalid json', {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      await expect(apiRequest('/invalid-json')).rejects.toEqual({
        error: 'Invalid response from server',
        details: 'Server did not return valid JSON',
      });
    });

    it('should throw API error for error responses', async () => {
      server.use(
        http.get('http://localhost:3001/api/error-endpoint', () => {
          return HttpResponse.json(
            { error: 'Bad Request', details: 'Missing required field' },
            { status: 400 }
          );
        })
      );

      await expect(apiRequest('/error-endpoint')).rejects.toEqual({
        error: 'Bad Request',
        details: 'Missing required field',
      });
    });
  });

  describe('authApi', () => {
    describe('login', () => {
      it('should login successfully with valid credentials', async () => {
        const result = await authApi.login('test@example.com', 'password123');

        expect(result.user).toEqual({
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'alumni',
        });
        expect(result.token).toBe('mock-jwt-token-12345');
        expect(localStorage.setItem).toHaveBeenCalledWith('authToken', 'mock-jwt-token-12345');
      });

      it('should throw error for invalid credentials', async () => {
        await expect(authApi.login('wrong@example.com', 'wrongpass')).rejects.toEqual({
          error: 'Invalid credentials',
          details: 'Email or password is incorrect',
        });
      });
    });

    describe('register', () => {
      it('should register successfully', async () => {
        const result = await authApi.register('new@example.com', 'password123', 'New User');

        expect(result.user.email).toBe('new@example.com');
        expect(result.user.name).toBe('New User');
        expect(result.token).toBe('mock-jwt-token-12345');
        expect(localStorage.setItem).toHaveBeenCalledWith('authToken', 'mock-jwt-token-12345');
      });

      it('should throw error for existing email', async () => {
        await expect(
          authApi.register('existing@example.com', 'password123', 'Test')
        ).rejects.toEqual({
          error: 'Email already exists',
          details: 'A user with this email already exists',
        });
      });
    });

    describe('logout', () => {
      it('should remove auth token', () => {
        authApi.logout();
        expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
      });
    });

    describe('getCurrentUser', () => {
      it('should get current user when authenticated', async () => {
        vi.mocked(localStorage.getItem).mockReturnValue('mock-token');

        const user = await authApi.getCurrentUser();
        expect(user).toEqual({
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'alumni',
        });
      });
    });
  });

  describe('alumniApi', () => {
    describe('getAll', () => {
      it('should get all alumni', async () => {
        const alumni = await alumniApi.getAll();
        expect(alumni).toHaveLength(2);
        expect(alumni[0]).toEqual({ id: '1', name: 'Alumni 1', year: 2020 });
      });

      it('should apply filters to query string', async () => {
        server.use(
          http.get('http://localhost:3001/api/alumni', ({ request }) => {
            const url = new URL(request.url);
            const year = url.searchParams.get('year');
            const search = url.searchParams.get('search');

            if (year === '2020' && search === 'test') {
              return HttpResponse.json([{ id: '1', name: 'Alumni 1', year: 2020 }]);
            }
            return HttpResponse.json([]);
          })
        );

        const alumni = await alumniApi.getAll({ year: 2020, search: 'test' });
        expect(alumni).toHaveLength(1);
      });
    });

    describe('getMe', () => {
      it('should get current user profile', async () => {
        vi.mocked(localStorage.getItem).mockReturnValue('mock-token');

        const user = await alumniApi.getMe();
        expect(user.email).toBe('test@example.com');
      });
    });
  });

  describe('projectsApi', () => {
    describe('getAll', () => {
      it('should get all projects', async () => {
        const projects = await projectsApi.getAll();
        expect(projects).toHaveLength(2);
        expect(projects[0].title).toBe('Project 1');
      });
    });
  });

  describe('storiesApi', () => {
    describe('getAll', () => {
      it('should get all stories', async () => {
        const stories = await storiesApi.getAll();
        expect(stories).toHaveLength(2);
        expect(stories[0].title).toBe('Story 1');
      });
    });
  });

  describe('notificationsApi', () => {
    beforeEach(() => {
      vi.mocked(localStorage.getItem).mockReturnValue('mock-token');
    });

    describe('getAll', () => {
      it('should get all notifications', async () => {
        const notifications = await notificationsApi.getAll();
        expect(notifications).toHaveLength(2);
      });
    });

    describe('getUnreadCount', () => {
      it('should get unread count', async () => {
        const result = await notificationsApi.getUnreadCount();
        expect(result.count).toBe(5);
      });
    });
  });
});
