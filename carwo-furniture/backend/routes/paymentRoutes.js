const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// ============================================================
// PAYMENT ROUTES
// ============================================================

// GET all payments
router.get('/', paymentController.getAllPayments);

// GET orders for dropdown
router.get('/orders-list', paymentController.getOrdersForPayment);

// GET sales report
router.get('/report', paymentController.getSalesReport);

// ⭐ PAY BALANCE — PUT (waa kan ugu muhiimsan)
router.put('/pay-balance/:id', paymentController.payBalance);

// GET one payment
router.get('/:id', paymentController.getPaymentById);

// CREATE payment
router.post('/', paymentController.createPayment);

// UPDATE payment
router.put('/:id', paymentController.updatePayment);

// DELETE payment
router.delete('/:id', paymentController.deletePayment);

module.exports = router;