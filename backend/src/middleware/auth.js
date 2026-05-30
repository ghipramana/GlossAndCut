const prisma = require('../config/db');

const authMiddleware = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Unauthorized. No token provided.' });
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized. Invalid token.' });
      }

      // Mock token format is "userId:ROLE"
      const [userIdStr, role] = token.split(':');
      if (!userIdStr || !role) {
        return res.status(401).json({ success: false, message: 'Unauthorized. Invalid token format.' });
      }

      const id_user = parseInt(userIdStr, 10);
      if (isNaN(id_user)) {
        return res.status(401).json({ success: false, message: 'Unauthorized. Invalid user ID.' });
      }

      // Optional: Verify user exists in database
      const user = await prisma.user.findUnique({
        where: { id_user }
      });

      if (!user) {
        return res.status(401).json({ success: false, message: 'Unauthorized. User not found.' });
      }

      // Check role if allowedRoles is provided
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return res.status(403).json({ success: false, message: 'Forbidden. Insufficient permissions.' });
      }

      // Attach user to request object
      req.user = user;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error during authentication.' });
    }
  };
};

module.exports = authMiddleware;
