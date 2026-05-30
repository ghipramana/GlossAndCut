const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// Register endpoint
router.post('/register', authController.register);

// Login endpoint
router.post('/login', authController.login);

// Update Profile
router.patch('/profile', authMiddleware(['CUSTOMER', 'BARBER', 'OWNER']), authController.updateProfile);

// Update Password
router.patch('/password', authMiddleware(['CUSTOMER', 'BARBER', 'OWNER']), authController.updatePassword);

// Upload Profile Photo
router.patch('/profile/photo', authMiddleware(['CUSTOMER', 'BARBER', 'OWNER']), upload.single('photo'), authController.uploadProfilePhoto);

// Delete Account
router.delete('/profile', authMiddleware(['CUSTOMER', 'BARBER', 'OWNER']), authController.deleteAccount);

// Forgot Password
router.post('/forgot-password', authController.forgotPassword);

// Reset Password
router.post('/reset-password', authController.resetPassword);

module.exports = router;
