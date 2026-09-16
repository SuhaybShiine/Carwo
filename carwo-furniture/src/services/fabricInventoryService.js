import axios from 'axios';

const API_URL = 'http://localhost:5000/api/fabric-inventory';

const getAll = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

const getById = async (id) => {
  const res = await axios.get(`${API_URL}/${id}`);
  return res.data;
};

const create = async (data) => {
  const res = await axios.post(API_URL, data);
  return res.data;
};

const update = async (id, data) => {
  const res = await axios.put(`${API_URL}/${id}`, data);
  return res.data;
};

const remove = async (id) => {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
};

const calculate = async (payload) => {
  const res = await axios.post(`${API_URL}/calculate`, payload);
  return res.data;
};

const fabricInventoryService = { getAll, getById, create, update, remove, calculate };
export default fabricInventoryService;