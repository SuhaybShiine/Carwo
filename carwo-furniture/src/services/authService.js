import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

const authService = {
  // ===== REGISTER =====
  register: async (data) => {
    const res = await axios.post(`${API_URL}/register`, data);
    return res.data;
  },

  // ===== LOGIN =====
  login: async (data) => {
    const res = await axios.post(`${API_URL}/login`, data);
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  // ===== LOGOUT =====
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // ===== USER-KA HADDA =====
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken: () => localStorage.getItem('token'),

  // ⭐ LABADA magac mid kasta wuu shaqeeyaa
  isAuthenticated: () => !!localStorage.getItem('token'),
  isLoggedIn: () => !!localStorage.getItem('token'),

  isAdmin: () => {
    const user = authService.getUser();
    return user?.Role === 'admin';
  },

  // ============================================================
  // FORGOT PASSWORD — dir 6-digit code email-ka
  // ============================================================
  forgotPassword: async (Email) => {
    const res = await axios.post(`${API_URL}/forgot-password`, { Email });
    return res.data;
  },

  // ============================================================
  // VERIFY CODE — hubi 6-digit code, soo celi resetToken
  // ============================================================
  verifyCode: async (Email, Code) => {
    const res = await axios.post(`${API_URL}/verify-code`, { Email, Code });
    return res.data; // { message, resetToken }
  },

  // ============================================================
  // RESET PASSWORD — beddel password-ka resetToken-ka
  // ============================================================
  resetPassword: async (resetToken, newPassword) => {
    const res = await axios.post(`${API_URL}/reset-password`, {
      resetToken,
      newPassword,
    });
    return res.data;
  },

  // ===== CHANGE MY PASSWORD =====
  changeMyPassword: async (data) => {
    const token = authService.getToken();
    const res = await axios.put(`${API_URL}/change-password`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  // ===== ADMIN — USERS =====
  getUsers: async () => {
    const token = authService.getToken();
    const res = await axios.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  adminSetPassword: async (id, newPassword) => {
    const token = authService.getToken();
    const res = await axios.put(
      `${API_URL}/users/${id}/password`,
      { newPassword },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  remove: async (id) => {
    const token = authService.getToken();
    const res = await axios.delete(`${API_URL}/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
};

export default authService;