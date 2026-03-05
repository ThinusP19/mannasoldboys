import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:3001/api';

// Mock user data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'alumni',
};

const mockToken = 'mock-jwt-token-12345';

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };

    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        user: mockUser,
        token: mockToken,
      });
    }

    return HttpResponse.json(
      { error: 'Invalid credentials', details: 'Email or password is incorrect' },
      { status: 401 }
    );
  }),

  http.post(`${API_BASE}/auth/register`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string; name: string };

    if (body.email === 'existing@example.com') {
      return HttpResponse.json(
        { error: 'Email already exists', details: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      user: { ...mockUser, email: body.email, name: body.name },
      token: mockToken,
    });
  }),

  http.get(`${API_BASE}/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: 'Unauthorized', details: 'No token provided' },
        { status: 401 }
      );
    }

    return HttpResponse.json(mockUser);
  }),

  // Alumni endpoints
  http.get(`${API_BASE}/alumni`, () => {
    return HttpResponse.json([
      { id: '1', name: 'Alumni 1', year: 2020 },
      { id: '2', name: 'Alumni 2', year: 2021 },
    ]);
  }),

  http.get(`${API_BASE}/alumni/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(
        { error: 'Unauthorized', details: 'No token provided' },
        { status: 401 }
      );
    }

    return HttpResponse.json(mockUser);
  }),

  // Projects endpoints
  http.get(`${API_BASE}/projects`, () => {
    return HttpResponse.json([
      { id: '1', title: 'Project 1', goal: 10000, raised: 5000 },
      { id: '2', title: 'Project 2', goal: 20000, raised: 15000 },
    ]);
  }),

  // Stories endpoints
  http.get(`${API_BASE}/stories`, () => {
    return HttpResponse.json([
      { id: '1', title: 'Story 1', content: 'Content 1' },
      { id: '2', title: 'Story 2', content: 'Content 2' },
    ]);
  }),

  // Notifications endpoints
  http.get(`${API_BASE}/notifications`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(
        { error: 'Unauthorized', details: 'No token provided' },
        { status: 401 }
      );
    }

    return HttpResponse.json([
      { id: '1', title: 'Notification 1', read: false },
      { id: '2', title: 'Notification 2', read: true },
    ]);
  }),

  http.get(`${API_BASE}/notifications/unread`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(
        { error: 'Unauthorized', details: 'No token provided' },
        { status: 401 }
      );
    }

    return HttpResponse.json({ count: 5 });
  }),
];
