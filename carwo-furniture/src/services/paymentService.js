import axios from 'axios';

const API_URL = 'http://localhost:5000/api/payments';

const paymentService = {
  getAll: () => axios.get(API_URL).then((res) => res.data),
  getById: (id) => axios.get(`${API_URL}/${id}`).then((res) => res.data),
  getOrdersList: () =>
    axios.get(`${API_URL}/orders-list`).then((res) => res.data),
  create: (data) => axios.post(API_URL, data).then((res) => res.data),
  update: (id, data) =>
    axios.put(`${API_URL}/${id}`, data).then((res) => res.data),
  payBalance: (id, data) =>
    axios.post(`${API_URL}/${id}/pay-balance`, data).then((res) => res.data),
  remove: (id) => axios.delete(`${API_URL}/${id}`).then((res) => res.data),
  getSalesReport: (start_date, end_date) =>
    axios
      .get(`${API_URL}/report/sales`, { params: { start_date, end_date } })
      .then((res) => res.data),
};

export default paymentService;