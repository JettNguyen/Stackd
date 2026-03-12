const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const TOKEN_KEY = 'stackd_auth_token';

const buildUrl = (path) => `${API_BASE}${path}`;

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY) || '';

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

export const clearAuthToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const apiRequest = async (path, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload?.message || 'Request failed');
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

export const restoreSessionFromToken = async () => {
  const token = getAuthToken();

  if (!token) {
    return null;
  }

  const payload = await apiRequest('/auth/login', {
    method: 'GET',
  });

  const nextToken = payload?.token || '';
  const account = payload?.data || null;

  if (nextToken) {
    setAuthToken(nextToken);
  }

  return account;
};
