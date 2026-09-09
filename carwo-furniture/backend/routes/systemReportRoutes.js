const express = require('express');
const router = express.Router();
const systemReportController = require('../controllers/systemReportController');

router.get('/', systemReportController.getSystemReport);

module.exports = router;