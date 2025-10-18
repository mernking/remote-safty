const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/v1/inspections:
 *   get:
 *     summary: Get all inspections
 *     tags: [Inspections]
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
 *         description: List of inspections
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { siteId, status, limit = 50 } = req.query;
    const prisma = req.app.get('prisma');

    const where = {};
    if (siteId) where.siteId = siteId;
    if (status) where.status = status;

    // Users can only see inspections they created or have access to
    if (req.user.role !== 'ADMIN') {
      where.createdById = req.user.id;
    }

    const inspections = await prisma.inspection.findMany({
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
    const formattedInspections = inspections.map(inspection => ({
      ...inspection,
      checklist: inspection.checklist ? JSON.parse(inspection.checklist) : {}
    }));

    res.json({ inspections: formattedInspections });

  } catch (error) {
    console.error('Get inspections error:', error);
    res.status(500).json({
      error: 'Failed to retrieve inspections'
    });
  }
});

/**
 * @swagger
 * /api/v1/inspections:
 *   post:
 *     summary: Create a new inspection
 *     tags: [Inspections]
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
 *             properties:
 *               siteId:
 *                 type: string
 *               checklist:
 *                 type: object
 *               status:
 *                 type: string
 *                 default: draft
 *     responses:
 *       201:
 *         description: Inspection created successfully
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { siteId, checklist, status = 'draft' } = req.body;
    const prisma = req.app.get('prisma');

    if (!siteId) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Site ID is required'
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

    const inspection = await prisma.inspection.create({
      data: {
        siteId,
        createdById: req.user.id,
        checklist: checklist ? JSON.stringify(checklist) : JSON.stringify({}),
        status
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
        entity: 'Inspection',
        entityId: inspection.id,
        payload: JSON.stringify({ siteId, status })
      }
    });

    // Notify user of successful creation
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        type: 'inspection_created',
        title: `Inspection Created Successfully`,
        message: `Your inspection at ${site.name} has been created`,
        priority: 'normal',
        data: JSON.stringify({ inspectionId: inspection.id, siteId }),
        relatedEntity: 'Inspection',
        relatedId: inspection.id
      }
    });

    const formattedInspection = {
      ...inspection,
      checklist: checklist || {}
    };

    res.status(201).json({
      inspection: formattedInspection,
      message: 'Inspection created successfully'
    });

  } catch (error) {
    console.error('Create inspection error:', error);
    res.status(500).json({
      error: 'Failed to create inspection'
    });
  }
});

/**
 * @swagger
 * /api/v1/inspections/{id}:
 *   get:
 *     summary: Get a specific inspection by ID
 *     tags: [Inspections]
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
 *         description: Inspection details
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = req.app.get('prisma');

    const inspection = await prisma.inspection.findUnique({
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

    if (!inspection) {
      return res.status(404).json({
        error: 'Inspection not found'
      });
    }

    // Check if user has access to this inspection
    if (req.user.role !== 'ADMIN' && inspection.createdById !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    const formattedInspection = {
      ...inspection,
      checklist: inspection.checklist ? JSON.parse(inspection.checklist) : {}
    };

    res.json({ inspection: formattedInspection });

  } catch (error) {
    console.error('Get inspection error:', error);
    res.status(500).json({
      error: 'Failed to retrieve inspection'
    });
  }
});

/**
 * @swagger
 * /api/v1/inspections/{id}:
 *   put:
 *     summary: Update an inspection
 *     tags: [Inspections]
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
 *               checklist:
 *                 type: object
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Inspection updated successfully
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { checklist, status } = req.body;
    const prisma = req.app.get('prisma');

    const existingInspection = await prisma.inspection.findUnique({
      where: { id }
    });

    if (!existingInspection) {
      return res.status(404).json({
        error: 'Inspection not found'
      });
    }

    // Check if user has access to update this inspection
    if (req.user.role !== 'ADMIN' && existingInspection.createdById !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    const updateData = {};
    if (checklist !== undefined) {
      updateData.checklist = JSON.stringify(checklist);
    }
    if (status !== undefined) {
      // Validate status
      const validStatuses = ['draft', 'in_progress', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          message: 'Status must be one of: draft, in_progress, completed'
        });
      }
      updateData.status = status;
    }
    updateData.version = { increment: 1 };

    const updatedInspection = await prisma.inspection.update({
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
        entity: 'Inspection',
        entityId: id,
        payload: JSON.stringify({ checklist: !!checklist, status })
      }
    });

    // Notify user of successful update
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        type: 'inspection_updated',
        title: `Inspection Updated`,
        message: `Your inspection has been updated`,
        priority: 'normal',
        data: JSON.stringify({ inspectionId: id }),
        relatedEntity: 'Inspection',
        relatedId: id
      }
    });

    const formattedInspection = {
      ...updatedInspection,
      checklist: updatedInspection.checklist ? JSON.parse(updatedInspection.checklist) : {}
    };

    res.json({
      inspection: formattedInspection,
      message: 'Inspection updated successfully'
    });

  } catch (error) {
    console.error('Update inspection error:', error);
    res.status(500).json({
      error: 'Failed to update inspection'
    });
  }
});

/**
 * @swagger
 * /api/v1/inspections/{id}:
 *   delete:
 *     summary: Delete an inspection
 *     tags: [Inspections]
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
 *         description: Inspection deleted successfully
 */
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = req.app.get('prisma');

    const existingInspection = await prisma.inspection.findUnique({
      where: { id }
    });

    if (!existingInspection) {
      return res.status(404).json({
        error: 'Inspection not found'
      });
    }

    await prisma.inspection.delete({
      where: { id }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE',
        entity: 'Inspection',
        entityId: id,
        payload: JSON.stringify({ siteId: existingInspection.siteId })
      }
    });

    // Notify user of successful deletion
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        type: 'inspection_deleted',
        title: `Inspection Deleted`,
        message: `Your inspection has been deleted`,
        priority: 'normal',
        data: JSON.stringify({ inspectionId: id, siteId: existingInspection.siteId }),
        relatedEntity: 'Inspection',
        relatedId: id
      }
    });

    res.json({
      message: 'Inspection deleted successfully'
    });

  } catch (error) {
    console.error('Delete inspection error:', error);
    res.status(500).json({
      error: 'Failed to delete inspection'
    });
  }
});

module.exports = router;