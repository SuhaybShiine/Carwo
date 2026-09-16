import axios from 'axios';

const API_URL = 'http://localhost:5000/api/fabric';

const fabricService = {
  getStock: () => axios.get(`${API_URL}/stock`).then((res) => res.data),

  updateStock: (id, data) =>
    axios.put(`${API_URL}/stock/${id}`, data).then((res) => res.data),

  getFormulas: () =>
    axios.get(`${API_URL}/formulas`).then((res) => res.data),

  getItemTypes: () =>
    axios.get(`${API_URL}/item-types`).then((res) => res.data),

  createFormula: (data) =>
    axios.post(`${API_URL}/formulas`, data).then((res) => res.data),

  updateFormula: (id, data) =>
    axios.put(`${API_URL}/formulas/${id}`, data).then((res) => res.data),

  removeFormula: (id) =>
    axios.delete(`${API_URL}/formulas/${id}`).then((res) => res.data),

  calculate: (data) =>
    axios.post(`${API_URL}/calculate`, data).then((res) => res.data),
};

export default fabricService;