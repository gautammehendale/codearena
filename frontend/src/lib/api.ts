import axios from 'axios';

// Simple in-memory cache — survives tab switches, cleared on page refresh
const _cache: Record<string, { data: any; ts: number }> = {};
export function cached<T>(key: string, fetcher: () => Promise<T>, ttlMs = 30000): Promise<T> {
  const now = Date.now();
  if (_cache[key] && now - _cache[key].ts < ttlMs) return Promise.resolve(_cache[key].data as T);
  return fetcher().then(data => { _cache[key] = { data, ts: now }; return data; });
}
export function invalidateCache(key?: string) {
  if (key) delete _cache[key];
  else Object.keys(_cache).forEach(k => delete _cache[k]);
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  withCredentials: true,
  timeout: 60000, // 60s timeout — Render free tier can take 50s to wake up
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

export const authApi = {
  register: (data: { username: string; email: string; password: string }) => api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const problemsApi = {
  list: (params?: { difficulty?: string; search?: string; page?: number }) => api.get('/problems', { params }),
  get: (slug: string) => api.get(`/problems/${slug}`),
  create: (data: object) => api.post('/problems', data),
};

export const submissionsApi = {
  submit: (data: { problemId: string; language: string; code: string; contestId?: string }) => api.post('/submissions', data),
  run: (data: { problemId: string; language: string; code: string }) => api.post('/submissions/run', data),
  get: (id: string) => api.get(`/submissions/${id}`),
  history: (params?: { page?: number; problemId?: string }) => api.get('/submissions/user/history', { params }),
};

export const leaderboardApi = {
  global: (params?: { page?: number }) => api.get('/leaderboard', { params }),
  myRank: () => api.get('/leaderboard/me'),
};

export const contestsApi = {
  list: () => api.get('/contests'),
  get: (id: string) => api.get(`/contests/${id}`),
};

export const hintsApi = {
  getHint: (data: { problemId: string; code: string; language: string }) => api.post('/hints', data),
  getStatus: (problemId: string) => api.get(`/hints/status/${problemId}`),
};

export const statsApi = {
  public: () => api.get('/stats/public'),
  adminUsers: () => api.get('/stats/admin/users'),
};
