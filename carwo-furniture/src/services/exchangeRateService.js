import axios from 'axios';

const API_URL = 'http://localhost:5000/api/exchange-rates';

const exchangeRateService = {
  getAll: async () => {
    const res = await axios.get(API_URL);
    return res.data;
  },

  getToday: async () => {
    const res = await axios.get(`${API_URL}/today`);
    return res.data;
  },

  getByDate: async (date) => {
    const res = await axios.get(`${API_URL}/date/${date}`);
    return res.data;
  },

  save: async (data) => {
    const res = await axios.post(API_URL, data);
    return res.data;
  },

  remove: async (id) => {
    const res = await axios.delete(`${API_URL}/${id}`);
    return res.data;
  },
};

export default exchangeRateService;