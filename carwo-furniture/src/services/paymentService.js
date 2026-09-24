import axios from 'axios';

const API_URL = 'http://localhost:5000/api/payments';

const paymentService = {
  // Soo hel dhammaan payments-ka
  getAll: async () => {
    const res = await axios.get(API_URL);
    return res.data;
  },

  // Soo hel orders-ka la bixin karo (dropdown)
  getOrdersList: async () => {
    const res = await axios.get(`${API_URL}/orders-list`);
    return res.data;
  },

  // Soo hel payment gaar ah
  getById: async (id) => {
    const res = await axios.get(`${API_URL}/${id}`);
    return res.data;
  },

  // Samee payment cusub
  create: async (data) => {
    const res = await axios.post(API_URL, data);
    return res.data;
  },

  // Update payment
  update: async (id, data) => {
    const res = await axios.put(`${API_URL}/${id}`, data);
    return res.data;
  },

  // ⭐ PAY BALANCE — PUT method (waa kan aad u baahan tahay)
  payBalance: async (id, data) => {
    const res = await axios.put(`${API_URL}/pay-balance/${id}`, data);
    return res.data;
  },

  // Tirtir payment
  remove: async (id) => {
    const res = await axios.delete(`${API_URL}/${id}`);
    return res.data;
  },

  // Soo hel report-ka
  getReport: async (filterType) => {
    const res = await axios.get(`${API_URL}/report`, {
      params: { filterType },
    });
    return res.data;
  },
};

export default paymentService;