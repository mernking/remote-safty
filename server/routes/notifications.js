const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         default: false
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { unreadOnly = false, limit = 50 } = req.query;
    const prisma = req.app.get('prisma');

    const where = { userId: req.user.id };
    if (unreadOnly === 'true') {
      where.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    // Parse JSON strings back to objects
    const formattedNotifications = notifications.map(notification => ({
      ...notification,
      data: notification.data ? JSON.parse(notification.data) : null
    }));

    res.json({ notifications: formattedNotifications });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: 'Failed to retrieve notifications'
    });
  }
});

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   post:
 *     summary: Mark notification as read
 *     tags: [Notifications]
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
 *         description: Notification marked as read
 */
router.post('/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = req.app.get('prisma');

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found'
      });
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true }
    });

    res.json({
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      error: 'Failed to mark notification as read'
    });
  }
});

/**
 * @swagger
 * /api/v1/notifications/read-all:
 *   post:
 *     summary: Mark all user notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.post('/read-all', authenticate, async (req, res) => {
  try {
    const prisma = req.app.get('prisma');

    const result = await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        read: false
      },
      data: { read: true }
    });

    res.json({
      message: `${result.count} notifications marked as read`
    });

  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      error: 'Failed to mark notifications as read'
    });
  }
});

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
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
 *         description: Notification deleted successfully
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = req.app.get('prisma');

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found'
      });
    }

    await prisma.notification.delete({
      where: { id }
    });

    res.json({
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      error: 'Failed to delete notification'
    });
  }
});

/**
 * @swagger
 * /api/v1/notifications/reminders:
 *   get:
 *     summary: Get pending reminders for the user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of pending reminders
 */
router.get('/reminders', authenticate, async (req, res) => {
  try {
    const prisma = req.app.get('prisma');

    const reminders = await prisma.reminder.findMany({
      where: {
        assignedTo: req.user.id,
        status: 'pending',
        scheduledAt: { lte: new Date() }
      },
      include: {
        // Could include related entities based on type
      },
      orderBy: { scheduledAt: 'asc' }
    });

    res.json({ reminders });

  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({
      error: 'Failed to retrieve reminders'
    });
  }
});

/**
 * @swagger
 * /api/v1/notifications/send-test:
 *   post:
 *     summary: Send a test notification (for testing purposes)
 *     tags: [Notifications]
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
 *               - type
 *               - title
 *               - message
 *             properties:
 *               type:
 *                 type: string
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, critical]
 *                 default: normal
 *     responses:
 *       201:
 *         description: Test notification sent
 */
router.post('/send-test', authenticate, async (req, res) => {
  try {
    const { type, title, message, priority = 'normal' } = req.body;
    const prisma = req.app.get('prisma');

    if (!type || !title || !message) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'type, title, and message are required'
      });
    }

    const notification = await prisma.notification.create({
      data: {
        userId: req.user.id,
        type,
        title,
        message,
        priority,
        data: JSON.stringify({ test: true })
      }
    });

    res.status(201).json({
      notification,
      message: 'Test notification sent'
    });

  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({
      error: 'Failed to send test notification'
    });
  }
});

/**
 * @swagger
 * /api/v1/notifications/stats:
 *   get:
 *     summary: Get notification statistics for the user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Notification statistics
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const prisma = req.app.get('prisma');

    const [total, unread, today] = await Promise.all([
      prisma.notification.count({
        where: { userId: req.user.id }
      }),
      prisma.notification.count({
        where: {
          userId: req.user.id,
          read: false
        }
      }),
      prisma.notification.count({
        where: {
          userId: req.user.id,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);

    const stats = {
      total,
      unread,
      today,
      read: total - unread
    };

    res.json({ stats });

  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      error: 'Failed to get notification statistics'
    });
  }
});

module.exports = router;