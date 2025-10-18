const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/v1/sync/push:
 *   post:
 *     summary: Push client operations to server for sync
 *     tags: [Sync]
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
 *               - clientId
 *               - ops
 *             properties:
 *               clientId:
 *                 type: string
 *               ops:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - opId
 *                     - opType
 *                     - entity
 *                     - payload
 *                     - localId
 *                     - timestamp
 *                   properties:
 *                     opId:
 *                       type: string
 *                     opType:
 *                       type: string
 *                       enum: [create, update, delete]
 *                     entity:
 *                       type: string
 *                       enum: [Inspection, Incident, ToolboxTalk, Site]
 *                     payload:
 *                       type: object
 *                     localId:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     attachmentsMeta:
 *                       type: array
 *                       items:
 *                         type: object
 *     responses:
 *       200:
 *         description: Sync operations processed successfully
 */
router.post('/push', authenticate, async (req, res) => {
  try {
    const { clientId, ops } = req.body;
    const prisma = req.app.get('prisma');
    const userId = req.user.id;

    if (!clientId || !Array.isArray(ops)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'clientId and ops array are required'
      });
    }

    const results = [];

    for (const op of ops) {
      const { opId, opType, entity, payload, localId, timestamp, attachmentsMeta } = op;

      try {
        let result = { opId, status: 'accepted' };

        // Process based on entity type
        switch (entity) {
          case 'Inspection':
            result = await processInspectionOperation(prisma, opType, payload, localId, userId);
            break;
          case 'Incident':
            result = await processIncidentOperation(prisma, opType, payload, localId, userId);
            break;
          case 'ToolboxTalk':
            result = await processToolboxTalkOperation(prisma, opType, payload, localId, userId);
            break;
          case 'Site':
            result = await processSiteOperation(prisma, opType, payload, localId, userId);
            break;
          default:
            result = { opId, status: 'error', error: `Unknown entity type: ${entity}` };
        }

        // Handle attachments if present
        if (attachmentsMeta && result.serverId) {
          result.attachments = await processAttachmentMetadata(
            prisma,
            attachmentsMeta,
            entity,
            result.serverId,
            userId
          );
        }

        results.push(result);

      } catch (error) {
        console.error(`Error processing op ${opId}:`, error);
        results.push({
          opId,
          status: 'error',
          error: error.message
        });
      }
    }

    // Create audit log for sync operation
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'SYNC',
        entity: 'SyncQueue',
        entityId: clientId,
        payload: JSON.stringify({ operationCount: ops.length, results: results.length })
      }
    });

    res.json({ results });

  } catch (error) {
    console.error('Sync push error:', error);
    res.status(500).json({
      error: 'Sync failed',
      message: 'An error occurred during sync operation'
    });
  }
});

/**
 * @swagger
 * /api/v1/sync/pull:
 *   get:
 *     summary: Pull changes since last sync
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: since
 *         schema:
 *           type: string
 *           format: date-time
 *         description: ISO date-time string for last sync timestamp
 *     responses:
 *       200:
 *         description: Changes pulled successfully
 */
router.get('/pull', authenticate, async (req, res) => {
  try {
    const { since } = req.query;
    const prisma = req.app.get('prisma');
    const userId = req.user.id;

    const sinceDate = since ? new Date(since) : new Date(0);

    // Get changes for entities the user has access to
    const [inspections, incidents, toolboxTalks, sites] = await Promise.all([
      prisma.inspection.findMany({
        where: {
          createdById: userId,
          updatedAt: { gt: sinceDate }
        },
        include: {
          site: true,
          attachments: true,
          auditLogs: true
        }
      }),
      prisma.incident.findMany({
        where: {
          reportedById: userId,
          updatedAt: { gt: sinceDate }
        },
        include: {
          site: true,
          attachments: true,
          auditLogs: true
        }
      }),
      prisma.toolboxTalk.findMany({
        where: {
          createdById: userId,
          updatedAt: { gt: sinceDate }
        },
        include: {
          site: true,
          attachments: true,
          auditLogs: true
        }
      }),
      prisma.site.findMany({
        where: {
          updatedAt: { gt: sinceDate }
        }
      })
    ]);

    const changes = {
      inspections,
      incidents,
      toolboxTalks,
      sites,
      timestamp: new Date().toISOString()
    };

    res.json(changes);

  } catch (error) {
    console.error('Sync pull error:', error);
    res.status(500).json({
      error: 'Sync pull failed',
      message: 'Failed to retrieve changes'
    });
  }
});

/**
 * @swagger
 * /api/v1/sync/ack:
 *   post:
 *     summary: Acknowledge server IDs for client operations
 *     tags: [Sync]
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
 *             properties:
 *               acknowledgments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     opId:
 *                       type: string
 *                     serverId:
 *                       type: string
 *     responses:
 *       200:
 *         description: Acknowledgments processed successfully
 */
router.post('/ack', authenticate, async (req, res) => {
  try {
    const { acknowledgments } = req.body;
    const prisma = req.app.get('prisma');

    if (!Array.isArray(acknowledgments)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'acknowledgments must be an array'
      });
    }

    // Here you could update sync queue items to mark them as acknowledged
    // For now, just acknowledge receipt
    res.json({
      message: 'Acknowledgments received',
      count: acknowledgments.length
    });

  } catch (error) {
    console.error('Sync ack error:', error);
    res.status(500).json({
      error: 'Acknowledgment failed',
      message: 'Failed to process acknowledgments'
    });
  }
});

/**
 * @swagger
 * /api/v1/sync/status:
 *   get:
 *     summary: Get sync status and health information
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Sync status information
 */
router.get('/status', authenticate, async (req, res) => {
  try {
    const prisma = req.app.get('prisma');

    // Get sync queue statistics
    const queueStats = await prisma.syncQueue.groupBy({
      by: ['status'],
      _count: true
    });

    const status = {
      serverTime: new Date().toISOString(),
      queueStats,
      health: 'healthy'
    };

    res.json(status);

  } catch (error) {
    console.error('Sync status error:', error);
    res.status(500).json({
      error: 'Status check failed',
      health: 'unhealthy'
    });
  }
});

// Helper functions for processing operations

async function processInspectionOperation(prisma, opType, payload, localId, userId) {
  const data = {
    ...payload,
    createdById: userId,
    checklist: JSON.stringify(payload.checklist || {}),
    attachments: payload.attachments && payload.attachments.length > 0 ? {
      create: payload.attachments.map(att => ({
        filename: att.filename,
        mimeType: att.mimeType,
        size: att.size,
        storagePath: `pending/${Date.now()}_${att.filename}`,
        createdById: userId
      }))
    } : undefined
  };

  // Remove attachments from data if present, as it's handled via nested create
  delete data.attachments;

  switch (opType) {
    case 'create':
      const inspection = await prisma.inspection.create({
        data,
        include: { attachments: true }
      });
      return {
        opId: payload.opId || localId,
        status: 'accepted',
        serverId: inspection.id,
        version: inspection.version,
        serverTimestamp: inspection.updatedAt.toISOString()
      };

    case 'update':
      const updatedInspection = await prisma.inspection.update({
        where: { id: payload.id },
        data: { ...data, version: { increment: 1 } }
      });
      return {
        opId: payload.opId || localId,
        status: 'accepted',
        serverId: updatedInspection.id,
        version: updatedInspection.version,
        serverTimestamp: updatedInspection.updatedAt.toISOString()
      };

    default:
      throw new Error(`Unsupported operation type: ${opType}`);
  }
}

async function processIncidentOperation(prisma, opType, payload, localId, userId) {
  const data = {
    ...payload,
    reportedById: userId,
    location: JSON.stringify(payload.location || {}),
    attachments: payload.attachments && payload.attachments.length > 0 ? {
      create: payload.attachments.map(att => ({
        filename: att.filename,
        mimeType: att.mimeType,
        size: att.size,
        storagePath: `pending/${Date.now()}_${att.filename}`,
        createdById: userId
      }))
    } : undefined
  };

  // Remove attachments from data if present, as it's handled via nested create
  delete data.attachments;

  switch (opType) {
    case 'create':
      const incident = await prisma.incident.create({
        data,
        include: { attachments: true }
      });
      return {
        opId: payload.opId || localId,
        status: 'accepted',
        serverId: incident.id,
        version: incident.version,
        serverTimestamp: incident.updatedAt.toISOString()
      };

    case 'update':
      const updatedIncident = await prisma.incident.update({
        where: { id: payload.id },
        data: { ...data, version: { increment: 1 } }
      });
      return {
        opId: payload.opId || localId,
        status: 'accepted',
        serverId: updatedIncident.id,
        version: updatedIncident.version,
        serverTimestamp: updatedIncident.updatedAt.toISOString()
      };

    default:
      throw new Error(`Unsupported operation type: ${opType}`);
  }
}

async function processToolboxTalkOperation(prisma, opType, payload, localId, userId) {
  // Parse scheduledAt properly - handle incomplete datetime strings
  let parsedScheduledAt;
  if (payload.scheduledAt) {
    try {
      // If it's already a full datetime, parse it
      const date = new Date(payload.scheduledAt);
      if (!isNaN(date.getTime())) {
        parsedScheduledAt = date;
      } else {
        // If it's incomplete (like "2025-10-27T11:59"), append seconds and timezone
        parsedScheduledAt = new Date(payload.scheduledAt + ':00.000Z');
      }
    } catch (error) {
      console.warn('Invalid scheduledAt format, ignoring:', payload.scheduledAt);
      parsedScheduledAt = undefined;
    }
  }

  const data = {
    ...payload,
    createdById: userId,
    attendees: JSON.stringify(payload.attendees || []),
    scheduledAt: parsedScheduledAt,
    attachments: payload.attachments ? {
      create: payload.attachments.map(att => ({
        filename: att.filename,
        mimeType: att.mimeType,
        size: att.size,
        storagePath: `pending/${Date.now()}_${att.filename}`,
        createdById: userId
      }))
    } : undefined
  };

  // Remove attachments from data if present, as it's handled via nested create
  delete data.attachments;

  switch (opType) {
    case 'create':
      const toolboxTalk = await prisma.toolboxTalk.create({
        data,
        include: { attachments: true }
      });
      return {
        opId: payload.opId || localId,
        status: 'accepted',
        serverId: toolboxTalk.id,
        version: toolboxTalk.version,
        serverTimestamp: toolboxTalk.updatedAt.toISOString()
      };

    case 'update':
      const updatedToolboxTalk = await prisma.toolboxTalk.update({
        where: { id: payload.id },
        data: { ...data, version: { increment: 1 } }
      });
      return {
        opId: payload.opId || localId,
        status: 'accepted',
        serverId: updatedToolboxTalk.id,
        version: updatedToolboxTalk.version,
        serverTimestamp: updatedToolboxTalk.updatedAt.toISOString()
      };

    default:
      throw new Error(`Unsupported operation type: ${opType}`);
  }
}

async function processSiteOperation(prisma, opType, payload, localId, userId) {
  const data = {
    ...payload,
    meta: JSON.stringify(payload.meta || {})
  };

  switch (opType) {
    case 'create':
      const site = await prisma.site.create({ data });
      return {
        opId: payload.opId,
        status: 'accepted',
        serverId: site.id,
        serverTimestamp: site.updatedAt.toISOString()
      };

    case 'update':
      const updatedSite = await prisma.site.update({
        where: { id: payload.id },
        data
      });
      return {
        opId: payload.opId,
        status: 'accepted',
        serverId: updatedSite.id,
        serverTimestamp: updatedSite.updatedAt.toISOString()
      };

    default:
      throw new Error(`Unsupported operation type: ${opType}`);
  }
}

async function processAttachmentMetadata(prisma, attachmentsMeta, entity, serverId, userId) {
  const results = [];

  for (const meta of attachmentsMeta) {
    try {
      const attachment = await prisma.attachment.create({
        data: {
          filename: meta.filename,
          mimeType: meta.mimeType || 'application/octet-stream',
          size: meta.size || 0,
          storagePath: `pending/${Date.now()}_${meta.filename}`,
          createdById: userId,
          linkedEntity: entity,
          linkedId: serverId
        }
      });

      results.push({
        localAttachmentId: meta.localAttachmentId,
        attachmentId: attachment.id,
        uploadUrl: `/api/v1/attachments/upload/${attachment.id}`
      });
    } catch (error) {
      console.error('Error creating attachment metadata:', error);
      results.push({
        localAttachmentId: meta.localAttachmentId,
        error: 'Failed to create attachment metadata'
      });
    }
  }

  return results;
}

module.exports = router;