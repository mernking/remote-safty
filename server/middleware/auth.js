const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *         name:
 *           type: string
 *         role:
 *           type: string
 *           enum: [ADMIN, SAFETY_MANAGER, SUPERVISOR, WORKER]
 *         apiKey:
 *           type: string
 *         keyEnabled:
 *           type: boolean
 */

/**
 * Middleware to authenticate requests
 * Supports JWT tokens (Bearer), API keys (header), and cookie-based auth
 */
const authenticate = async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    let user = null;

    // Check for API key in header
    const apiKey = req.headers['x-api-key'] || req.query.key;
    if (apiKey) {
      user = await prisma.user.findFirst({
        where: {
          apiKey: apiKey,
          keyEnabled: true
        }
      });
      if (user) {
        req.user = user;
        req.authMethod = 'apiKey';
        return next();
      }
    }

    // Check for JWT token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = await prisma.user.findUnique({
          where: { id: decoded.userId }
        });
        if (user) {
          req.user = user;
          req.authMethod = 'jwt';
          return next();
        }
      } catch (error) {
        // Token invalid, continue to check cookie
      }
    }

    // Check for JWT token in cookie
    const cookieToken = req.cookies.token;
    if (cookieToken) {
      try {
        const decoded = jwt.verify(cookieToken, process.env.JWT_SECRET);
        user = await prisma.user.findUnique({
          where: { id: decoded.userId }
        });
        if (user) {
          req.user = user;
          req.authMethod = 'cookie';
          return next();
        }
      } catch (error) {
        // Token invalid
      }
    }

    // No valid authentication found
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide a valid JWT token, API key, or login'
    });

  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'Failed to authenticate request'
    });
  }
};

/**
 * Middleware to check if user has required role
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Required roles: ${allowedRoles.join(', ')}, your role: ${req.user.role}`
      });
    }

    next();
  };
};

/**
 * Middleware for optional authentication (user may or may not be authenticated)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');

    // Same authentication logic as authenticate, but don't fail if no auth
    const apiKey = req.headers['x-api-key'] || req.query.key;
    if (apiKey) {
      const user = await prisma.user.findFirst({
        where: {
          apiKey: apiKey,
          keyEnabled: true
        }
      });
      if (user) {
        req.user = user;
        req.authMethod = 'apiKey';
        return next();
      }
    }

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId }
        });
        if (user) {
          req.user = user;
          req.authMethod = 'jwt';
          return next();
        }
      } catch (error) {
        // Continue
      }
    }

    const cookieToken = req.cookies.token;
    if (cookieToken) {
      try {
        const decoded = jwt.verify(cookieToken, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId }
        });
        if (user) {
          req.user = user;
          req.authMethod = 'cookie';
          return next();
        }
      } catch (error) {
        // Continue
      }
    }

    // No authentication found, but that's OK for optional auth
    next();

  } catch (error) {
    console.error('Optional authentication error:', error);
    // Don't fail, just continue without user
    next();
  }
};

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

/**
 * Generate refresh token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Generate API key
 */
const generateApiKey = () => {
  return uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');
};

module.exports = {
  authenticate,
  requireRole,
  optionalAuth,
  generateToken,
  generateRefreshToken,
  generateApiKey
};