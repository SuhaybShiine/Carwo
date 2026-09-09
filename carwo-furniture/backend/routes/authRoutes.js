const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');

// Public
router.post('/register', authController.register);
router.post('/login', authController.login);

// Logged in
router.get('/me', protect, authController.me);
router.put('/change-password', protect, authController.changeMyPassword);

// Admin only
router.get('/users', protect, adminOnly, authController.getAllUsers);
router.put('/users/:id/password', protect, adminOnly, authController.adminSetPassword);
router.delete('/users/:id', protect, adminOnly, authController.deleteUser);

module.exports = router;