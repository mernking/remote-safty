const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticate, requireRole, generateApiKey } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/', authenticate, requireRole('ADMIN'), async (req, res) => {
   try {
     const prisma = req.app.get('prisma');

     const users = await prisma.user.findMany({
       where: {
         status: { not: 'DELETED' } // Exclude deleted users
       },
       select: {
         id: true,
         email: true,
         name: true,
         role: true,
         status: true,
         apiKey: false, // Don't expose API keys
         keyEnabled: true,
         createdAt: true,
         updatedAt: true,
         _count: {
           select: {
             inspections: true,
             incidents: true,
             toolboxTalks: true
           }
         }
       },
       orderBy: { createdAt: 'desc' }
     });

     res.json({ users });

   } catch (error) {
     console.error('Get users error:', error);
     res.status(500).json({
       error: 'Failed to retrieve users'
     });
   }
 });

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create a new user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, SAFETY_MANAGER, SUPERVISOR, WORKER]
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.post('/', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    const prisma = req.app.get('prisma');

    if (!email || !password || !name || !role) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email, password, name, and role are required'
      });
    }

    // Validate role
    const validRoles = ['ADMIN', 'SAFETY_MANAGER', 'SUPERVISOR', 'WORKER'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid role. Must be one of: ' + validRoles.join(', ')
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        entity: 'User',
        entityId: user.id,
        payload: JSON.stringify({ email: user.email, role: user.role })
      }
    });

    res.status(201).json({
      user,
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      error: 'Failed to create user'
    });
  }
});

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get a specific user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = req.app.get('prisma');

    // Users can only view their own profile or admins can view any
    if (req.user.role !== 'ADMIN' && req.user.id !== id) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        keyEnabled: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            inspections: true,
            incidents: true,
            toolboxTalks: true,
            notifications: {
              where: { read: false }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to retrieve user'
    });
  }
});

/**
  * @swagger
  * /api/v1/users/{id}:
  *   put:
  *     summary: Update a user
  *     tags: [Users]
  *     security:
  *       - bearerAuth: []
  *       - apiKeyAuth: []
  *       - cookieAuth: []
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               email:
  *                 type: string
  *                 format: email
  *               name:
  *                 type: string
  *               role:
  *                 type: string
  *                 enum: [ADMIN, SAFETY_MANAGER, SUPERVISOR, WORKER]
  *               status:
  *                 type: string
  *                 enum: [ACTIVE, BANNED, DELETED]
  *               password:
  *                 type: string
  *     responses:
  *       200:
  *         description: User updated successfully
  */
router.put('/:id', authenticate, async (req, res) => {
   try {
     const { id } = req.params;
     const { email, name, role, status, password } = req.body;
     const prisma = req.app.get('prisma');

     // Users can only update their own profile or admins can update any
     if (req.user.role !== 'ADMIN' && req.user.id !== id) {
       return res.status(403).json({
         error: 'Access denied'
       });
     }

     // Only admins can change roles, emails, and status
     if (req.user.role !== 'ADMIN' && (role !== undefined || status !== undefined || (email !== undefined && email !== req.user.email))) {
       return res.status(403).json({
         error: 'Access denied',
         message: 'Only administrators can change roles, status, or email addresses'
       });
     }

     const existingUser = await prisma.user.findUnique({
       where: { id }
     });

     if (!existingUser) {
       return res.status(404).json({
         error: 'User not found'
       });
     }

     // Validate role if provided
     if (role !== undefined) {
       const validRoles = ['ADMIN', 'SAFETY_MANAGER', 'SUPERVISOR', 'WORKER'];
       if (!validRoles.includes(role)) {
         return res.status(400).json({
           error: 'Validation error',
           message: 'Invalid role. Must be one of: ' + validRoles.join(', ')
         });
       }
     }

     // Validate status if provided
     if (status !== undefined) {
       const validStatuses = ['ACTIVE', 'BANNED', 'DELETED'];
       if (!validStatuses.includes(status)) {
         return res.status(400).json({
           error: 'Validation error',
           message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
         });
       }
     }

     // Prevent self-banning
     if (status === 'BANNED' && id === req.user.id) {
       return res.status(400).json({
         error: 'Cannot ban yourself',
         message: 'Administrators cannot ban their own accounts'
       });
     }

     // Check email uniqueness if changing
     if (email && email.toLowerCase() !== existingUser.email) {
       const emailExists = await prisma.user.findUnique({
         where: { email: email.toLowerCase() }
       });
       if (emailExists) {
         return res.status(409).json({
           error: 'Email already in use',
           message: 'Another user with this email already exists'
         });
       }
     }

     const updateData = {};
     if (email !== undefined) updateData.email = email.toLowerCase();
     if (name !== undefined) updateData.name = name;
     if (role !== undefined) updateData.role = role;
     if (status !== undefined) updateData.status = status;
     if (password) {
       updateData.password = await bcrypt.hash(password, 12);
     }

     const updatedUser = await prisma.user.update({
       where: { id },
       data: updateData,
       select: {
         id: true,
         email: true,
         name: true,
         role: true,
         status: true,
         createdAt: true,
         updatedAt: true
       }
     });

     // Create audit log
     await prisma.auditLog.create({
       data: {
         userId: req.user.id,
         action: 'UPDATE',
         entity: 'User',
         entityId: id,
         payload: JSON.stringify({
           email: email !== undefined,
           name: name !== undefined,
           role: role !== undefined,
           status: status !== undefined,
           password: !!password
         })
       }
     });

     res.json({
       user: updatedUser,
       message: 'User updated successfully'
     });

   } catch (error) {
     console.error('Update user error:', error);
     res.status(500).json({
       error: 'Failed to update user'
     });
   }
 });

/**
  * @swagger
  * /api/v1/users/{id}:
  *   delete:
  *     summary: Soft delete a user (admin only)
  *     tags: [Users]
  *     security:
  *       - bearerAuth: []
  *       - apiKeyAuth: []
  *       - cookieAuth: []
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         schema:
  *           type: string
  *     responses:
  *       200:
  *         description: User deleted successfully
  */
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
   try {
     const { id } = req.params;
     const prisma = req.app.get('prisma');

     const existingUser = await prisma.user.findUnique({
            where: { id },
            include: {
              inspections: {
                where: { status: { not: 'completed' } }
              },
              incidents: true, // Incidents don't have status field in schema
              toolboxTalks: {
                where: { status: { not: 'completed' } }
              }
            }
          });

     if (!existingUser) {
       return res.status(404).json({
         error: 'User not found'
       });
     }

     // Prevent deleting self
     if (id === req.user.id) {
       return res.status(400).json({
         error: 'Cannot delete own account',
         message: 'Administrators cannot delete their own accounts'
       });
     }

     // Check if user has active dependent records
     const hasActiveDependencies = existingUser.inspections.length > 0 ||
                                  existingUser.toolboxTalks.length > 0;

     if (hasActiveDependencies) {
       return res.status(400).json({
         error: 'Cannot delete user',
         message: 'User has active inspections, incidents, or toolbox talks. Please complete or reassign these first.'
       });
     }

     // Soft delete by updating status
     await prisma.user.update({
       where: { id },
       data: { status: 'DELETED' }
     });

     // Create audit log
     await prisma.auditLog.create({
       data: {
         userId: req.user.id,
         action: 'DELETE',
         entity: 'User',
         entityId: id,
         payload: JSON.stringify({ email: existingUser.email, role: existingUser.role, softDelete: true })
       }
     });

     res.json({
       message: 'User deleted successfully'
     });

   } catch (error) {
     console.error('Delete user error:', error);
     res.status(500).json({
       error: 'Failed to delete user'
     });
   }
 });

/**
 * @swagger
 * /api/v1/users/{id}/generate-api-key:
 *   post:
 *     summary: Generate or regenerate API key for a user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API key generated successfully
 */
router.post('/:id/generate-api-key', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = req.app.get('prisma');

    const apiKey = generateApiKey();

    await prisma.user.update({
      where: { id },
      data: {
        apiKey: apiKey,
        keyEnabled: true
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        entity: 'User',
        entityId: id,
        payload: JSON.stringify({ apiKeyGenerated: true })
      }
    });

    res.json({
      apiKey,
      message: 'API key generated successfully. Keep this key secure!'
    });

  } catch (error) {
    console.error('Generate API key error:', error);
    res.status(500).json({
      error: 'Failed to generate API key'
    });
  }
});

/**
 * @swagger
 * /api/v1/users/{id}/disable-api-key:
 *   post:
 *     summary: Disable API key for a user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API key disabled successfully
 */
router.post('/:id/disable-api-key', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = req.app.get('prisma');

    await prisma.user.update({
      where: { id },
      data: {
        keyEnabled: false
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        entity: 'User',
        entityId: id,
        payload: JSON.stringify({ apiKeyDisabled: true })
      }
    });

    res.json({
      message: 'API key disabled successfully'
    });

  } catch (error) {
    console.error('Disable API key error:', error);
    res.status(500).json({
      error: 'Failed to disable API key'
    });
  }
});

module.exports = router;