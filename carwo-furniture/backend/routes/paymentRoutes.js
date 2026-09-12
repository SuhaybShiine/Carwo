const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.get('/', paymentController.getAllPayments);
router.get('/orders-list', paymentController.getOrdersForPayment);
router.get('/report', paymentController.getSalesReport);
router.get('/:id', paymentController.getPaymentById);
router.post('/', paymentController.createPayment);
router.put('/:id', paymentController.updatePayment);
router.put('/:id/pay-balance', paymentController.payBalance);
router.delete('/:id', paymentController.deletePayment);

module.exports = router;