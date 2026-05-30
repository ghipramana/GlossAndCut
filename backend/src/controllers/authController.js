const prisma = require('../config/db');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    // Determine role (default to CUSTOMER, validate role enum)
    let userRole = 'CUSTOMER';
    if (role && ['CUSTOMER', 'BARBER', 'OWNER'].includes(role.toUpperCase())) {
      userRole = role.toUpperCase();
    }

    // Create User
    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password, // Plain text for local dev/testing
        role: userRole
      }
    });

    // If role is BARBER, we should also create a Stylist entry for them
    if (userRole === 'BARBER') {
      await prisma.stylist.create({
        data: {
          id_user: newUser.id_user,
          name: newUser.name,
          status: 'AVAILABLE'
        }
      });
    }

    // Generate mock token "userId:role"
    const token = `${newUser.id_user}:${newUser.role}`;

    return res.status(210).json({
      success: true,
      message: 'Registration successful.',
      token,
      token,
      user: {
        id: newUser.id_user.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role.toLowerCase(),
        photoUrl: newUser.photoUrl
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

/**
 * Login a user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Find User
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // [Auto-heal]: Auto-create Stylist record if a BARBER logs in but lacks a Stylist entry (e.g. from manual DB entry)
    if (user.role === 'BARBER') {
      const existingStylist = await prisma.stylist.findUnique({
        where: { id_user: user.id_user }
      });
      if (!existingStylist) {
        await prisma.stylist.create({
          data: {
            id_user: user.id_user,
            name: user.name,
            status: 'AVAILABLE'
          }
        });
        console.log(`[Auto-heal] Created missing Stylist record for Barber: ${user.name}`);
      }
    }

    // Generate mock token "userId:role"
    const token = `${user.id_user}:${user.role}`;

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      token,
      user: {
        id: user.id_user.toString(),
        name: user.name,
        email: user.email,
        role: user.role.toLowerCase(),
        photoUrl: user.photoUrl
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

/**
 * Update user profile (name, phone)
 * PATCH /api/auth/profile
 */
const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const id_user = req.user.id_user;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id_user: id_user },
      data: { name: name }
    });
    
    // If barber, update stylist name too
    if (updatedUser.role === 'BARBER') {
      await prisma.stylist.updateMany({
        where: { id_user: id_user },
        data: { name: name }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser.id_user.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role.toLowerCase(),
        photoUrl: updatedUser.photoUrl
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

/**
 * Update user password
 * PATCH /api/auth/password
 */
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const id_user = req.user.id_user;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new passwords are required.' });
    }

    const user = await prisma.user.findUnique({ where: { id_user } });
    if (!user || user.password !== currentPassword) {
      return res.status(401).json({ success: false, message: 'Incorrect current password.' });
    }

    await prisma.user.update({
      where: { id_user },
      data: { password: newPassword }
    });

    return res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Update password error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update password.' });
  }
};

const uploadProfilePhoto = async (req, res) => {
  try {
    const id_user = req.user.id_user;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }

    const photoUrl = req.file.path;
    const updated = await prisma.user.update({
      where: { id_user },
      data: { photoUrl }
    });
    
    if (updated.role === 'BARBER') {
      await prisma.stylist.updateMany({
        where: { id_user },
        data: { photoUrl }
      });
    }

    return res.status(200).json({ success: true, message: 'Photo uploaded successfully', data: { photoUrl } });
  } catch (error) {
    console.error('Upload profile photo error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload photo.' });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const id_user = req.user.id_user;
    await prisma.user.delete({
      where: { id_user }
    });
    return res.status(200).json({ success: true, message: 'Account deleted successfully.' });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete account.' });
  }
};

const crypto = require('crypto');
const { sendResetEmail } = require('../utils/mailer');

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Email not found.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 15 * 60000); // 15 mins

    await prisma.user.update({
      where: { id_user: user.id_user },
      data: { resetToken, resetTokenExpiry }
    });

    const emailSent = await sendResetEmail(user.email, resetToken);
    if (!emailSent) {
      return res.status(500).json({ success: false, message: 'Failed to send reset email.' });
    }

    return res.status(200).json({ success: true, message: 'Reset password link sent to email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ success: false, message: 'Token and new password required.' });

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    }

    await prisma.user.update({
      where: { id_user: user.id_user },
      data: {
        password: newPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return res.status(200).json({ success: true, message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = {
  register,
  login,
  updateProfile,
  updatePassword,
  uploadProfilePhoto,
  deleteAccount,
  forgotPassword,
  resetPassword
};
