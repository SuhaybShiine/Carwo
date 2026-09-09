import axios from 'axios';

const API_URL = 'http://localhost:5000/api/expenses';

const expenseService = {
  getAll: () => axios.get(API_URL).then((res) => res.data),
  getById: (id) => axios.get(`${API_URL}/${id}`).then((res) => res.data),
  create: (data) => axios.post(API_URL, data).then((res) => res.data),
  update: (id, data) =>
    axios.put(`${API_URL}/${id}`, data).then((res) => res.data),
  remove: (id) => axios.delete(`${API_URL}/${id}`).then((res) => res.data),
  getReport: (params) =>
    axios.get(`${API_URL}/report`, { params }).then((res) => res.data),
};

export default expenseService;