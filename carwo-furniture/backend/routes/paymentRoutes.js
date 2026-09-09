const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.get('/', paymentController.getAllPayments);
router.get('/orders-list', paymentController.getOrdersForPayment);
router.get('/report/sales', paymentController.getSalesReport); // Line 7
router.get('/:id', paymentController.getPaymentById);
router.post('/', paymentController.createPayment);
router.put('/:id', paymentController.updatePayment);
router.post('/:id/pay-balance', paymentController.payBalance);
router.delete('/:id', paymentController.deletePayment);

module.exports = router;