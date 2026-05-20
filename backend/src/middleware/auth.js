/**
 * Mock Auth Middleware supporting Role-Based Access Control (RBAC)
 * Allows easy testing using headers `x-user-id` and `x-user-role`,
 * or basic authorization header simulation.
 */
const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    // 1. Get developer headers (x-user-id, x-user-role)
    const headerUserId = req.headers['x-user-id'];
    const headerUserRole = req.headers['x-user-role'];

    if (headerUserId && headerUserRole) {
      req.user = {
        id_user: parseInt(headerUserId, 10),
        role: headerUserRole.toUpperCase()
      };
      
      // Check roles
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ 
          success: false, 
          message: `Forbidden: Access denied. Required role(s): [${roles.join(', ')}]` 
        });
      }
      return next();
    }

    // 2. Fallback check for authorization token simulation (e.g. Bearer USER_ID_ROLE)
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      // Token format: "userId:role" (e.g., "1:CUSTOMER")
      const parts = token.split(':');
      if (parts.length === 2) {
        req.user = {
          id_user: parseInt(parts[0], 10),
          role: parts[1].toUpperCase()
        };

        if (roles.length && !roles.includes(req.user.role)) {
          return res.status(403).json({ 
            success: false, 
            message: `Forbidden: Access denied. Required role(s): [${roles.join(', ')}]` 
          });
        }
        return next();
      }
    }

    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized: Missing or invalid authentication credentials. Please provide headers x-user-id and x-user-role, or Authorization Bearer token in "userId:role" format.' 
    });
  };
};

module.exports = authMiddleware;
