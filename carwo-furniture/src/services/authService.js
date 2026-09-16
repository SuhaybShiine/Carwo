import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

const TOKEN_KEY = 'carwo_token';
const USER_KEY = 'carwo_user';

const authService = {
  // ---------- LOGIN ----------
  login: async (username, password) => {
    const res = await axios.post(`${API_URL}/login`, {
      Username: username,
      Password: password,
    });

    const data = res.data;

    // Support different backend shapes
    const token = data.token || data.Token || data.accessToken;
    const user = data.user || data.User || {
      User_id: data.User_id,
      Username: data.Username,
      Full_Name: data.Full_Name,
      Email: data.Email,
      Role: data.Role,
    };

    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    return data;
  },

  // ---------- REGISTER ----------
  register: async (formData) => {
    const res = await axios.post(`${API_URL}/register`, formData);
    return res.data;
  },

  // ---------- LOGOUT ----------
  logout: () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },

  // ---------- TOKEN / USER ----------
  getToken: () => sessionStorage.getItem(TOKEN_KEY),

  getUser: () => {
    try {
      const raw = sessionStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  isLoggedIn: () => {
    return !!sessionStorage.getItem(TOKEN_KEY);
  },

  isAdmin: () => {
    const user = authService.getUser();
    if (!user) return false;
    return String(user.Role || '').toLowerCase() === 'admin';
  },

  // Headers for protected API calls
  authHeader: () => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  // ---------- USERS (Admin) ----------
  getUsers: async () => {
    const res = await axios.get(`${API_URL}/users`, {
      headers: authService.authHeader(),
    });
    return res.data;
  },

  remove: async (id) => {
    const res = await axios.delete(`${API_URL}/users/${id}`, {
      headers: authService.authHeader(),
    });
    return res.data;
  },

  // ---------- CHANGE PASSWORD ----------
  changeMyPassword: async (data) => {
    const res = await axios.post(`${API_URL}/change-password`, data, {
      headers: authService.authHeader(),
    });
    return res.data;
  },

  // Optional: admin resets another user's password
  resetUserPassword: async (id, data) => {
    const res = await axios.post(
      `${API_URL}/users/${id}/reset-password`,
      data,
      { headers: authService.authHeader() }
    );
    return res.data;
  },
};

export default authService;