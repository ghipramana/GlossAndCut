const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const authMiddleware = require('../middleware/auth');

// Register endpoint
router.post('/register', authController.register);

// Login endpoint
router.post('/login', authController.login);

// Update Profile
router.patch('/profile', authMiddleware(['CUSTOMER', 'BARBER', 'OWNER']), authController.updateProfile);

// Update Password
router.patch('/password', authMiddleware(['CUSTOMER', 'BARBER', 'OWNER']), authController.updatePassword);

module.exports = router;
