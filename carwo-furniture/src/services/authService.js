import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

const authService = {
  register: (data) => axios.post(`${API_URL}/register`, data).then((r) => r.data),

  login: (data) => axios.post(`${API_URL}/login`, data).then((r) => r.data),

  me: () => axios.get(`${API_URL}/me`, authHeader()).then((r) => r.data),

  getUsers: () => axios.get(`${API_URL}/users`, authHeader()).then((r) => r.data),

  adminSetPassword: (id, newPassword) =>
    axios
      .put(`${API_URL}/users/${id}/password`, { newPassword }, authHeader())
      .then((r) => r.data),

  changeMyPassword: (data) =>
    axios.put(`${API_URL}/change-password`, data, authHeader()).then((r) => r.data),

  remove: (id) =>
    axios.delete(`${API_URL}/users/${id}`, authHeader()).then((r) => r.data),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  },

  isAdmin: () => authService.getUser()?.Role === 'admin',
  isLoggedIn: () => !!localStorage.getItem('token'),
};

export default authService;