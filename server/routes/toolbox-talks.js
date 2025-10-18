const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/v1/toolbox-talks:
 *   get:
 *     summary: Get all toolbox talks
 *     tags: [Toolbox Talks]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: siteId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of toolbox talks
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { siteId, status, limit = 50 } = req.query;
    const prisma = req.app.get('prisma');

    const where = {};
    if (siteId) where.siteId = siteId;
    if (status) where.status = status;

    // Users can only see toolbox talks they created or have access to
    if (req.user.role !== 'ADMIN') {
      where.createdById = req.user.id;
    }

    const toolboxTalks = await prisma.toolboxTalk.findMany({
      where,
      include: {
        site: true,
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        attachments: true,
        auditLogs: true
      },
      orderBy: { updatedAt: 'desc' },
      take: parseInt(limit)
    });

    // Parse JSON strings back to objects
    const formattedTalks = toolboxTalks.map(talk => ({
      ...talk,
      attendees: talk.attendees ? JSON.parse(talk.attendees) : []
    }));

    res.json({ toolboxTalks: formattedTalks });

  } catch (error) {
    console.error('Get toolbox talks error:', error);
    res.status(500).json({
      error: 'Failed to retrieve toolbox talks'
    });
  }
});

/**
 * @swagger
 * /api/v1/toolbox-talks:
 *   post:
 *     summary: Create a new toolbox talk
 *     tags: [Toolbox Talks]
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
 *               - siteId
 *               - title
 *               - agenda
 *             properties:
 *               siteId:
 *                 type: string
 *               title:
 *                 type: string
 *               agenda:
 *                 type: string
 *               attendees:
 *                 type: array
 *                 items:
 *                   type: string
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Toolbox talk created successfully
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { siteId, title, agenda, attendees, scheduledAt } = req.body;
    const prisma = req.app.get('prisma');

    if (!siteId || !title || !agenda) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Site ID, title, and agenda are required'
      });
    }

    // Verify site exists
    const site = await prisma.site.findUnique({
      where: { id: siteId }
    });

    if (!site) {
      return res.status(404).json({
        error: 'Site not found'
      });
    }

    const toolboxTalk = await prisma.toolboxTalk.create({
      data: {
        siteId,
        createdById: req.user.id,
        title,
        agenda,
        attendees: attendees ? JSON.stringify(attendees) : JSON.stringify([]),
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null
      },
      include: {
        site: true,
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        entity: 'ToolboxTalk',
        entityId: toolboxTalk.id,
        payload: JSON.stringify({ siteId, title })
      }
    });

    // Notify user of successful creation
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        type: 'toolbox_talk_created',
        title: `Toolbox Talk Created Successfully`,
        message: `Your toolbox talk "${title}" has been scheduled`,
        priority: 'normal',
        data: JSON.stringify({ toolboxTalkId: toolboxTalk.id, siteId }),
        relatedEntity: 'ToolboxTalk',
        relatedId: toolboxTalk.id
      }
    });

    // Create reminder if scheduled
    if (scheduledAt) {
      await prisma.reminder.create({
        data: {
          type: 'toolbox_talk',
          entityId: toolboxTalk.id,
          entityType: 'ToolboxTalk',
          scheduledAt: new Date(scheduledAt),
          assignedTo: req.user.id
        }
      });
    }

    const formattedTalk = {
      ...toolboxTalk,
      attendees: attendees || []
    };

    res.status(201).json({
      toolboxTalk: formattedTalk,
      message: 'Toolbox talk created successfully'
    });

  } catch (error) {
    console.error('Create toolbox talk error:', error);
    res.status(500).json({
      error: 'Failed to create toolbox talk'
    });
  }
});

/**
 * @swagger
 * /api/v1/toolbox-talks/{id}:
 *   get:
 *     summary: Get a specific toolbox talk by ID
 *     tags: [Toolbox Talks]
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
 *         description: Toolbox talk details
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = req.app.get('prisma');

    const toolboxTalk = await prisma.toolboxTalk.findUnique({
      where: { id },
      include: {
        site: true,
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        attachments: true,
        auditLogs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!toolboxTalk) {
      return res.status(404).json({
        error: 'Toolbox talk not found'
      });
    }

    // Check if user has access to this toolbox talk
    if (req.user.role !== 'ADMIN' && toolboxTalk.createdById !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    const formattedTalk = {
      ...toolboxTalk,
      attendees: toolboxTalk.attendees ? JSON.parse(toolboxTalk.attendees) : []
    };

    res.json({ toolboxTalk: formattedTalk });

  } catch (error) {
    console.error('Get toolbox talk error:', error);
    res.status(500).json({
      error: 'Failed to retrieve toolbox talk'
    });
  }
});

/**
 * @swagger
 * /api/v1/toolbox-talks/{id}:
 *   put:
 *     summary: Update a toolbox talk
 *     tags: [Toolbox Talks]
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
 *               title:
 *                 type: string
 *               agenda:
 *                 type: string
 *               attendees:
 *                 type: array
 *                 items:
 *                   type: string
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [scheduled, completed, cancelled]
 *               completedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Toolbox talk updated successfully
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, agenda, attendees, scheduledAt, status, completedAt } = req.body;
    const prisma = req.app.get('prisma');

    const existingTalk = await prisma.toolboxTalk.findUnique({
      where: { id }
    });

    if (!existingTalk) {
      return res.status(404).json({
        error: 'Toolbox talk not found'
      });
    }

    // Check if user has access to update this toolbox talk
    if (req.user.role !== 'ADMIN' && existingTalk.createdById !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (agenda !== undefined) updateData.agenda = agenda;
    if (attendees !== undefined) updateData.attendees = JSON.stringify(attendees);
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (status !== undefined) updateData.status = status;
    if (completedAt !== undefined) updateData.completedAt = completedAt ? new Date(completedAt) : null;
    updateData.version = { increment: 1 };

    const updatedTalk = await prisma.toolboxTalk.update({
      where: { id },
      data: updateData,
      include: {
        site: true,
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        attachments: true
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        entity: 'ToolboxTalk',
        entityId: id,
        payload: JSON.stringify({ title, status })
      }
    });

    // Notify user of successful update
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        type: 'toolbox_talk_updated',
        title: `Toolbox Talk Updated`,
        message: `Your toolbox talk has been updated`,
        priority: 'normal',
        data: JSON.stringify({ toolboxTalkId: id }),
        relatedEntity: 'ToolboxTalk',
        relatedId: id
      }
    });

    // Update reminder if scheduled time changed
    if (scheduledAt !== undefined) {
      await prisma.reminder.upsert({
        where: {
          type_entityId: {
            type: 'toolbox_talk',
            entityId: id
          }
        },
        update: {
          scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
          status: scheduledAt ? 'pending' : 'cancelled'
        },
        create: {
          type: 'toolbox_talk',
          entityId: id,
          entityType: 'ToolboxTalk',
          scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
          assignedTo: req.user.id
        }
      });
    }

    const formattedTalk = {
      ...updatedTalk,
      attendees: updatedTalk.attendees ? JSON.parse(updatedTalk.attendees) : []
    };

    res.json({
      toolboxTalk: formattedTalk,
      message: 'Toolbox talk updated successfully'
    });

  } catch (error) {
    console.error('Update toolbox talk error:', error);
    res.status(500).json({
      error: 'Failed to update toolbox talk'
    });
  }
});

/**
 * @swagger
 * /api/v1/toolbox-talks/{id}:
 *   delete:
 *     summary: Delete a toolbox talk
 *     tags: [Toolbox Talks]
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
 *         description: Toolbox talk deleted successfully
 */
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = req.app.get('prisma');

    const existingTalk = await prisma.toolboxTalk.findUnique({
      where: { id }
    });

    if (!existingTalk) {
      return res.status(404).json({
        error: 'Toolbox talk not found'
      });
    }

    await prisma.toolboxTalk.delete({
      where: { id }
    });

    // Delete associated reminder
    await prisma.reminder.deleteMany({
      where: {
        type: 'toolbox_talk',
        entityId: id
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE',
        entity: 'ToolboxTalk',
        entityId: id,
        payload: JSON.stringify({ siteId: existingTalk.siteId, title: existingTalk.title })
      }
    });

    // Notify user of successful deletion
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        type: 'toolbox_talk_deleted',
        title: `Toolbox Talk Deleted`,
        message: `Your toolbox talk has been deleted`,
        priority: 'normal',
        data: JSON.stringify({ toolboxTalkId: id, siteId: existingTalk.siteId }),
        relatedEntity: 'ToolboxTalk',
        relatedId: id
      }
    });

    res.json({
      message: 'Toolbox talk deleted successfully'
    });

  } catch (error) {
    console.error('Delete toolbox talk error:', error);
    res.status(500).json({
      error: 'Failed to delete toolbox talk'
    });
  }
});

module.exports = router;