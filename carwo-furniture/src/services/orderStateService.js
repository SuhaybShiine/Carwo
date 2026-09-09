import axios from 'axios';

const API_URL = 'http://localhost:5000/api/order-states';

const orderStateService = {
  getByOrder: (orderId) => axios.get(`${API_URL}/order/${orderId}`),
  getById: (id) => axios.get(`${API_URL}/${id}`),
  add: (data) => axios.post(API_URL, data),
  update: (id, data) => axios.put(`${API_URL}/${id}`, data),
  remove: (id) => axios.delete(`${API_URL}/${id}`),
};

export default orderStateService;