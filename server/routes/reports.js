const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/v1/reports/export:
 *   get:
 *     summary: Export reports in CSV or PDF format
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [csv, pdf]
 *         default: csv
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: siteId
 *         schema:
 *           type: string
 *       - in: query
 *         name: reportType
 *         schema:
 *           type: string
 *           enum: [inspections, incidents, toolbox-talks, combined]
 *         default: combined
 *     responses:
 *       200:
 *         description: Report exported successfully
 */
router.get('/export', authenticate, async (req, res) => {
  try {
    const { type = 'csv', from, to, siteId, reportType = 'combined' } = req.query;
    const prisma = req.app.get('prisma');

    // Build date filter
    const dateFilter = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    // Build site filter
    const siteFilter = siteId ? { siteId } : {};

    // Get data based on report type
    let data = [];
    let filename = `safety-report-${reportType}-${new Date().toISOString().split('T')[0]}`;

    switch (reportType) {
      case 'inspections':
        const inspections = await prisma.inspection.findMany({
          where: {
            ...siteFilter,
            ...(from || to ? { createdAt: dateFilter } : {})
          },
          include: {
            site: true,
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        if (type === 'csv') {
          data = generateInspectionsCSV(inspections);
          filename += '.csv';
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.send(data);
        } else {
          // For PDF, we'd need a PDF generation library like pdfkit
          res.status(501).json({
            error: 'PDF export not implemented yet',
            message: 'Use CSV export for now'
          });
        }
        break;

      case 'incidents':
        const incidents = await prisma.incident.findMany({
          where: {
            ...siteFilter,
            ...(from || to ? { createdAt: dateFilter } : {})
          },
          include: {
            site: true,
            reportedBy: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        if (type === 'csv') {
          data = generateIncidentsCSV(incidents);
          filename += '.csv';
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.send(data);
        } else {
          res.status(501).json({
            error: 'PDF export not implemented yet',
            message: 'Use CSV export for now'
          });
        }
        break;

      case 'toolbox-talks':
        const toolboxTalks = await prisma.toolboxTalk.findMany({
          where: {
            ...siteFilter,
            ...(from || to ? { createdAt: dateFilter } : {})
          },
          include: {
            site: true,
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        if (type === 'csv') {
          data = generateToolboxTalksCSV(toolboxTalks);
          filename += '.csv';
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.send(data);
        } else {
          res.status(501).json({
            error: 'PDF export not implemented yet',
            message: 'Use CSV export for now'
          });
        }
        break;

      case 'combined':
        const [combinedInspections, combinedIncidents, combinedTalks] = await Promise.all([
          prisma.inspection.findMany({
            where: {
              ...siteFilter,
              ...(from || to ? { createdAt: dateFilter } : {})
            },
            include: { site: true, createdBy: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100
          }),
          prisma.incident.findMany({
            where: {
              ...siteFilter,
              ...(from || to ? { createdAt: dateFilter } : {})
            },
            include: { site: true, reportedBy: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100
          }),
          prisma.toolboxTalk.findMany({
            where: {
              ...siteFilter,
              ...(from || to ? { createdAt: dateFilter } : {})
            },
            include: { site: true, createdBy: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100
          })
        ]);

        if (type === 'csv') {
          data = generateCombinedCSV(combinedInspections, combinedIncidents, combinedTalks);
          filename += '.csv';
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.send(data);
        } else {
          res.status(501).json({
            error: 'PDF export not implemented yet',
            message: 'Use CSV export for now'
          });
        }
        break;

      default:
        return res.status(400).json({
          error: 'Invalid report type',
          message: 'Valid types: inspections, incidents, toolbox-talks, combined'
        });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'EXPORT',
        entity: 'Report',
        entityId: filename,
        payload: JSON.stringify({ type, reportType, from, to, siteId })
      }
    });

  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({
      error: 'Failed to export report'
    });
  }
});

/**
 * @swagger
 * /api/v1/reports/dashboard:
 *   get:
 *     summary: Get dashboard statistics and metrics
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const prisma = req.app.get('prisma');
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    const isSafetyManager = req.user.role === 'SAFETY_MANAGER';

    // Date filter for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Build filters based on user role
    const userFilter = {};
    if (!isAdmin && !isSafetyManager) {
      userFilter.createdById = userId;
    }

    // Get statistics
    const [
      totalInspections,
      totalIncidents,
      totalToolboxTalks,
      recentInspections,
      recentIncidents,
      highSeverityIncidents,
      pendingActions
    ] = await Promise.all([
      prisma.inspection.count({
        where: {
          ...userFilter,
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.incident.count({
        where: {
          ...userFilter,
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.toolboxTalk.count({
        where: {
          ...userFilter,
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.inspection.count({
        where: {
          ...userFilter,
          status: 'draft'
        }
      }),
      prisma.incident.count({
        where: {
          ...userFilter,
          severity: { gte: 3 }
        }
      }),
      prisma.incident.count({
        where: {
          severity: { gte: 4 },
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.reminder.count({
        where: {
          assignedTo: userId,
          status: 'pending'
        }
      })
    ]);

    // Site statistics
    const sites = await prisma.site.findMany({
      include: {
        _count: {
          select: {
            inspections: true,
            incidents: true,
            toolboxTalks: true
          }
        }
      }
    });

    const siteStats = sites.map(site => ({
      id: site.id,
      name: site.name,
      inspections: site._count.inspections,
      incidents: site._count.incidents,
      toolboxTalks: site._count.toolboxTalks,
      lastActivity: new Date(Math.max(
        site.updatedAt.getTime(),
        // Would need to get latest from related entities
      ))
    }));

    const stats = {
      summary: {
        totalInspections,
        totalIncidents,
        totalToolboxTalks,
        highSeverityIncidents,
        pendingActions
      },
      recentActivity: {
        draftInspections: recentInspections,
        highSeverityIncidents: recentIncidents
      },
      sites: siteStats,
      period: 'last-30-days'
    };

    res.json(stats);

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      error: 'Failed to get dashboard statistics'
    });
  }
});

// Helper functions for CSV generation

function generateInspectionsCSV(inspections) {
  const headers = ['Date', 'Site', 'Inspector', 'Status', 'Checklist Items', 'Version'];
  const rows = inspections.map(inspection => {
    const checklist = inspection.checklist ? JSON.parse(inspection.checklist) : {};
    const checklistSummary = Object.keys(checklist).length > 0 ?
      `${Object.keys(checklist).length} items` : 'No checklist';

    return [
      inspection.createdAt.toISOString().split('T')[0],
      inspection.site.name,
      inspection.createdBy.name,
      inspection.status,
      checklistSummary,
      inspection.version
    ];
  });

  return [headers, ...rows].map(row =>
    row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

function generateIncidentsCSV(incidents) {
  const headers = ['Date', 'Site', 'Reported By', 'Type', 'Severity', 'Description'];
  const rows = incidents.map(incident => [
    incident.createdAt.toISOString().split('T')[0],
    incident.site.name,
    incident.reportedBy.name,
    incident.type,
    incident.severity,
    incident.description || ''
  ]);

  return [headers, ...rows].map(row =>
    row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

function generateToolboxTalksCSV(toolboxTalks) {
  const headers = ['Date', 'Site', 'Created By', 'Title', 'Status', 'Attendees'];
  const rows = toolboxTalks.map(talk => {
    const attendees = talk.attendees ? JSON.parse(talk.attendees) : [];
    return [
      talk.createdAt.toISOString().split('T')[0],
      talk.site.name,
      talk.createdBy.name,
      talk.title,
      talk.status,
      attendees.length
    ];
  });

  return [headers, ...rows].map(row =>
    row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

function generateCombinedCSV(inspections, incidents, toolboxTalks) {
  const headers = ['Type', 'Date', 'Site', 'Title/Details', 'Status/Severity', 'Person'];
  const rows = [
    ...inspections.map(i => ['Inspection', i.createdAt.toISOString().split('T')[0], i.site.name, 'Safety Check', i.status, i.createdBy.name]),
    ...incidents.map(i => ['Incident', i.createdAt.toISOString().split('T')[0], i.site.name, i.type, `Severity ${i.severity}`, i.reportedBy.name]),
    ...toolboxTalks.map(t => ['Toolbox Talk', t.createdAt.toISOString().split('T')[0], t.site.name, t.title, t.status, t.createdBy.name])
  ];

  return [headers, ...rows].map(row =>
    row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

module.exports = router;