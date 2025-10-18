const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/v1/incidents:
 *   get:
 *     summary: Get all incidents
 *     tags: [Incidents]
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
 *         name: severity
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of incidents
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { siteId, severity, limit = 50 } = req.query;
    const prisma = req.app.get('prisma');

    const where = {};
    if (siteId) where.siteId = siteId;
    if (severity) where.severity = parseInt(severity);

    // Users can only see incidents they reported or have access to
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SAFETY_MANAGER') {
      where.reportedById = req.user.id;
    }

    const incidents = await prisma.incident.findMany({
      where,
      include: {
        site: true,
        reportedBy: {
          select: { id: true, name: true, email: true }
        },
        attachments: true,
        auditLogs: true
      },
      orderBy: { updatedAt: 'desc' },
      take: parseInt(limit)
    });

    // Parse JSON strings back to objects
    const formattedIncidents = incidents.map(incident => ({
      ...incident,
      location: incident.location ? JSON.parse(incident.location) : null
    }));

    res.json({ incidents: formattedIncidents });

  } catch (error) {
    console.error('Get incidents error:', error);
    res.status(500).json({
      error: 'Failed to retrieve incidents'
    });
  }
});

/**
 * @swagger
 * /api/v1/incidents:
 *   post:
 *     summary: Report a new incident
 *     tags: [Incidents]
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
 *               - type
 *               - severity
 *             properties:
 *               siteId:
 *                 type: string
 *               type:
 *                 type: string
 *               severity:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               description:
 *                 type: string
 *               location:
 *                 type: object
 *     responses:
 *       201:
 *         description: Incident reported successfully
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { siteId, type, severity, description, location } = req.body;
    const prisma = req.app.get('prisma');

    if (!siteId || !type || severity === undefined) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Site ID, incident type, and severity are required'
      });
    }

    if (severity < 1 || severity > 5) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Severity must be between 1 and 5'
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

    const incident = await prisma.incident.create({
      data: {
        siteId,
        reportedById: req.user.id,
        type,
        severity,
        description,
        location: location ? JSON.stringify(location) : null
      },
      include: {
        site: true,
        reportedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        entity: 'Incident',
        entityId: incident.id,
        payload: JSON.stringify({ siteId, type, severity })
      }
    });

    // Send notification for high-severity incidents
    if (severity >= 4) {
      // Notify safety managers and admins
      const safetyManagers = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'SAFETY_MANAGER'] }
        }
      });

      for (const manager of safetyManagers) {
        await prisma.notification.create({
          data: {
            userId: manager.id,
            type: 'safety_alert',
            title: `High Severity Incident Reported`,
            message: `Incident of severity ${severity} reported at ${site.name}`,
            priority: 'high',
            data: JSON.stringify({ incidentId: incident.id, siteId, severity }),
            relatedEntity: 'Incident',
            relatedId: incident.id
          }
        });
      }
    }

    // Notify user of successful creation
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        type: 'incident_created',
        title: `Incident Reported Successfully`,
        message: `Your incident report at ${site.name} has been submitted`,
        priority: 'normal',
        data: JSON.stringify({ incidentId: incident.id, siteId }),
        relatedEntity: 'Incident',
        relatedId: incident.id
      }
    });

    const formattedIncident = {
      ...incident,
      location: location || null
    };

    res.status(201).json({
      incident: formattedIncident,
      message: 'Incident reported successfully'
    });

  } catch (error) {
    console.error('Create incident error:', error);
    res.status(500).json({
      error: 'Failed to report incident'
    });
  }
});

/**
 * @swagger
 * /api/v1/incidents/{id}:
 *   get:
 *     summary: Get a specific incident by ID
 *     tags: [Incidents]
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
 *         description: Incident details
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = req.app.get('prisma');

    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        site: true,
        reportedBy: {
          select: { id: true, name: true, email: true }
        },
        attachments: true,
        auditLogs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!incident) {
      return res.status(404).json({
        error: 'Incident not found'
      });
    }

    // Check if user has access to this incident
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SAFETY_MANAGER' && incident.reportedById !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    const formattedIncident = {
      ...incident,
      location: incident.location ? JSON.parse(incident.location) : null
    };

    res.json({ incident: formattedIncident });

  } catch (error) {
    console.error('Get incident error:', error);
    res.status(500).json({
      error: 'Failed to retrieve incident'
    });
  }
});

/**
 * @swagger
 * /api/v1/incidents/{id}:
 *   put:
 *     summary: Update an incident
 *     tags: [Incidents]
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
 *               type:
 *                 type: string
 *               severity:
 *                 type: integer
 *               description:
 *                 type: string
 *               location:
 *                 type: object
 *     responses:
 *       200:
 *         description: Incident updated successfully
 */
router.put('/:id', authenticate, requireRole('ADMIN', 'SAFETY_MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { type, severity, description, location } = req.body;
    const prisma = req.app.get('prisma');

    const existingIncident = await prisma.incident.findUnique({
      where: { id }
    });

    if (!existingIncident) {
      return res.status(404).json({
        error: 'Incident not found'
      });
    }

    if (severity !== undefined && (severity < 1 || severity > 5)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Severity must be between 1 and 5'
      });
    }

    const updateData = {};
    if (type !== undefined) updateData.type = type;
    if (severity !== undefined) updateData.severity = severity;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = JSON.stringify(location);
    updateData.version = { increment: 1 };

    const updatedIncident = await prisma.incident.update({
      where: { id },
      data: updateData,
      include: {
        site: true,
        reportedBy: {
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
        entity: 'Incident',
        entityId: id,
        payload: JSON.stringify({ type, severity, description })
      }
    });

    // Send notification for severity changes
    if (severity !== undefined && severity !== existingIncident.severity && severity >= 4) {
      const site = await prisma.site.findUnique({ where: { id: existingIncident.siteId } });
      // Notify safety managers and admins
      const safetyManagers = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'SAFETY_MANAGER'] }
        }
      });

      for (const manager of safetyManagers) {
        await prisma.notification.create({
          data: {
            userId: manager.id,
            type: 'safety_alert',
            title: `Incident Severity Updated`,
            message: `Incident severity updated to ${severity} at ${site?.name || 'Unknown Site'}`,
            priority: 'high',
            data: JSON.stringify({ incidentId: id, oldSeverity: existingIncident.severity, newSeverity: severity }),
            relatedEntity: 'Incident',
            relatedId: id
          }
        });
      }
    }

    // Notify user of successful update
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        type: 'incident_updated',
        title: `Incident Updated`,
        message: `Your incident report has been updated`,
        priority: 'normal',
        data: JSON.stringify({ incidentId: id }),
        relatedEntity: 'Incident',
        relatedId: id
      }
    });

    const formattedIncident = {
      ...updatedIncident,
      location: updatedIncident.location ? JSON.parse(updatedIncident.location) : null
    };

    res.json({
      incident: formattedIncident,
      message: 'Incident updated successfully'
    });

  } catch (error) {
    console.error('Update incident error:', error);
    res.status(500).json({
      error: 'Failed to update incident'
    });
  }
});

/**
 * @swagger
 * /api/v1/incidents/{id}:
 *   delete:
 *     summary: Delete an incident
 *     tags: [Incidents]
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
 *         description: Incident deleted successfully
 */
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = req.app.get('prisma');

    const existingIncident = await prisma.incident.findUnique({
      where: { id }
    });

    if (!existingIncident) {
      return res.status(404).json({
        error: 'Incident not found'
      });
    }

    await prisma.incident.delete({
      where: { id }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE',
        entity: 'Incident',
        entityId: id,
        payload: JSON.stringify({ siteId: existingIncident.siteId, type: existingIncident.type })
      }
    });

    // Notify user of successful deletion
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        type: 'incident_deleted',
        title: `Incident Deleted`,
        message: `Your incident report has been deleted`,
        priority: 'normal',
        data: JSON.stringify({ incidentId: id, siteId: existingIncident.siteId }),
        relatedEntity: 'Incident',
        relatedId: id
      }
    });

    res.json({
      message: 'Incident deleted successfully'
    });

  } catch (error) {
    console.error('Delete incident error:', error);
    res.status(500).json({
      error: 'Failed to delete incident'
    });
  }
});

module.exports = router;