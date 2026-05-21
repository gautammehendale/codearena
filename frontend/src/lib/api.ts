import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
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
