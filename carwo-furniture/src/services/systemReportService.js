import axios from 'axios';

const API_URL = 'http://localhost:5000/api/system-report';

const systemReportService = {
  getReport: (params) =>
    axios.get(API_URL, { params }).then((res) => res.data),
};

export default systemReportService;