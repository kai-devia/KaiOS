const API_BASE = '/api';

/**
 * Get stored auth token
 */
export function getToken() {
  return localStorage.getItem('kai-doc-token');
}

/**
 * Set auth token
 */
export function setToken(token) {
  localStorage.setItem('kai-doc-token', token);
}

/**
 * Clear auth token
 */
export function clearToken() {
  localStorage.removeItem('kai-doc-token');
}

/**
 * API client with auth headers
 */
async function request(path, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('No autorizado');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error de servidor');
  }

  return data;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!getToken();
}

/**
 * Logout — clears token and redirects to login
 */
export function logout() {
  clearToken();
  window.location.href = '/login';
}

// ─── OTP Auth ────────────────────────────────────────────────────────────────

/**
 * Request a 6-digit OTP sent to Guille's Telegram
 */
export async function requestOtp() {
  return request('/auth/request-otp', { method: 'POST' });
}

/**
 * Verify OTP code — returns { token } on success
 */
export async function verifyOtp(code) {
  return request('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

/**
 * Logout on the server side (optional — JWT is stateless)
 */
export async function logoutServer() {
  return request('/auth/logout', { method: 'POST' });
}

// ─── Files API ───────────────────────────────────────────────────────────────

export async function getFileTree(agentId) {
  const query = agentId ? `?agentId=${agentId}` : '';
  return request(`/files${query}`);
}

export async function getFileList(agentId) {
  const query = agentId ? `?agentId=${agentId}` : '';
  return request(`/files/flat${query}`);
}

export async function getFileContent(path, agentId) {
  const query = `path=${encodeURIComponent(path)}${agentId ? `&agentId=${agentId}` : ''}`;
  return request(`/files/content?${query}`);
}

export async function saveFileContent(path, content, agentId) {
  const query = `path=${encodeURIComponent(path)}${agentId ? `&agentId=${agentId}` : ''}`;
  return request(`/files/content?${query}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
}

// ─── Tasks API ───────────────────────────────────────────────────────────────

export async function getTasks(status) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return request(`/tasks${qs}`);
}

export async function getTask(id) {
  return request(`/tasks/${id}`);
}

export async function createTask(data) {
  return request('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTask(id, data) {
  return request(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteTask(id) {
  return request(`/tasks/${id}`, { method: 'DELETE' });
}

// ─── Events API ──────────────────────────────────────────────────────────────

export async function getEvents() {
  return request('/events');
}

export async function getEvent(id) {
  return request(`/events/${id}`);
}

export async function createEvent(data) {
  return request('/events', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateEvent(id, data) {
  return request(`/events/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteEvent(id) {
  return request(`/events/${id}`, { method: 'DELETE' });
}
