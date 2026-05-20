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
          specialty: 'General Stylist',
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
      user: {
        id: newUser.id_user.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role.toLowerCase() // matching frontend lowercase expectation
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

    // Generate mock token "userId:role"
    const token = `${user.id_user}:${user.role}`;

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id_user.toString(),
        name: user.name,
        email: user.email,
        role: user.role.toLowerCase() // matching frontend lowercase expectation
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
        role: updatedUser.role.toLowerCase()
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

module.exports = {
  register,
  login,
  updateProfile,
  updatePassword
};
