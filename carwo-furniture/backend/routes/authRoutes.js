const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');

// ===== PUBLIC =====
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-code', authController.verifyCode);
router.post('/reset-password', authController.resetPassword);

// ===== LOGGED IN =====
router.get('/me', protect, authController.me);
router.put('/change-password', protect, authController.changeMyPassword);

// ===== ADMIN =====
router.get('/users', protect, adminOnly, authController.getAllUsers);
router.put('/users/:id/password', protect, adminOnly, authController.adminSetPassword);
router.delete('/users/:id', protect, adminOnly, authController.deleteUser);

module.exports = router;