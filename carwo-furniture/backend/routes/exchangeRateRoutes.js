const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/exchangeRateController');

router.get('/', ctrl.getAllRates);
router.get('/today', ctrl.getTodayRate);
router.get('/date/:date', ctrl.getRateByDate);
router.post('/', ctrl.createOrUpdateRate);
router.delete('/:id', ctrl.deleteRate);

module.exports = router;