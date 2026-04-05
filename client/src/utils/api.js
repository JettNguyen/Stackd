const resolveApiBase = () => {
  const configuredBase = process.env.REACT_APP_API_URL?.trim();

  if (configuredBase) {
    return configuredBase.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    const apiPort = process.env.REACT_APP_API_PORT || '8080';

    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//${hostname}:${apiPort}`;
    }
  }

  return 'http://localhost:8080';
};

const API_BASE = resolveApiBase();
const TOKEN_KEY = 'stackd_auth_token';

const buildUrl = (path) => `${API_BASE}${path}`;

const decodeJwtPayload = (token) => {
  try {
    const [, encodedPayload] = String(token || '').split('.');

    if (!encodedPayload) {
      return null;
    }

    const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const normalized = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

    return JSON.parse(window.atob(normalized));
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  const payload = decodeJwtPayload(token);
  const expiresAt = Number(payload?.exp || 0);

  if (!expiresAt) {
    return false;
  }

  return expiresAt * 1000 <= Date.now();
};

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
  const isFormDataBody = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(options.headers || {}),
  };

  if (!isFormDataBody && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : await response.text().catch(() => '');

  if (!response.ok) {
    const errorMessage = typeof payload === 'string'
      ? payload
      : payload?.message;
    const error = new Error(errorMessage || 'Request failed');
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

  if (isTokenExpired(token)) {
    clearAuthToken();
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
