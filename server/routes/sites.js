const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/v1/sites:
 *   get:
 *     summary: Get all sites
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of sites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sites:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       lat:
 *                         type: number
 *                       lng:
 *                         type: number
 *                       address:
 *                         type: string
 *                       meta:
 *                         type: object
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const prisma = req.app.get('prisma');

    const sites = await prisma.site.findMany({
      orderBy: { updatedAt: 'desc' }
    });

    // Parse JSON strings back to objects
    const formattedSites = sites.map(site => ({
      ...site,
      meta: site.meta ? JSON.parse(site.meta) : null
    }));

    res.json({ sites: formattedSites });

  } catch (error) {
    console.error('Get sites error:', error);
    res.status(500).json({
      error: 'Failed to retrieve sites'
    });
  }
});

/**
 * @swagger
 * /api/v1/sites:
 *   post:
 *     summary: Create a new site
 *     tags: [Sites]
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               lat:
 *                 type: number
 *               lng:
 *                 type: number
 *               address:
 *                 type: string
 *               meta:
 *                 type: object
 *     responses:
 *       201:
 *         description: Site created successfully
 */
router.post('/', authenticate, requireRole('ADMIN', 'SAFETY_MANAGER'), async (req, res) => {
  try {
    const { name, lat, lng, address, meta } = req.body;
    const prisma = req.app.get('prisma');

    if (!name) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Site name is required'
      });
    }

    const site = await prisma.site.create({
      data: {
        name,
        lat,
        lng,
        address,
        meta: meta ? JSON.stringify(meta) : null
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        entity: 'Site',
        entityId: site.id,
        payload: JSON.stringify({ name, lat, lng, address })
      }
    });

    const formattedSite = {
      ...site,
      meta: meta || null
    };

    res.status(201).json({
      site: formattedSite,
      message: 'Site created successfully'
    });

  } catch (error) {
    console.error('Create site error:', error);
    res.status(500).json({
      error: 'Failed to create site'
    });
  }
});

/**
 * @swagger
 * /api/v1/sites/{id}:
 *   get:
 *     summary: Get a specific site by ID
 *     tags: [Sites]
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
 *         description: Site details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 site:
 *                   type: object
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = req.app.get('prisma');

    const site = await prisma.site.findUnique({
      where: { id },
      include: {
        inspections: {
          orderBy: { updatedAt: 'desc' },
          take: 5
        },
        incidents: {
          orderBy: { updatedAt: 'desc' },
          take: 5
        },
        toolboxTalks: {
          orderBy: { updatedAt: 'desc' },
          take: 3
        }
      }
    });

    if (!site) {
      return res.status(404).json({
        error: 'Site not found'
      });
    }

    const formattedSite = {
      ...site,
      meta: site.meta ? JSON.parse(site.meta) : null
    };

    res.json({ site: formattedSite });

  } catch (error) {
    console.error('Get site error:', error);
    res.status(500).json({
      error: 'Failed to retrieve site'
    });
  }
});

/**
 * @swagger
 * /api/v1/sites/{id}:
 *   put:
 *     summary: Update a site
 *     tags: [Sites]
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
 *               name:
 *                 type: string
 *               lat:
 *                 type: number
 *               lng:
 *                 type: number
 *               address:
 *                 type: string
 *               meta:
 *                 type: object
 *     responses:
 *       200:
 *         description: Site updated successfully
 */
router.put('/:id', authenticate, requireRole('ADMIN', 'SAFETY_MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, lat, lng, address, meta } = req.body;
    const prisma = req.app.get('prisma');

    const existingSite = await prisma.site.findUnique({
      where: { id }
    });

    if (!existingSite) {
      return res.status(404).json({
        error: 'Site not found'
      });
    }

    const updatedSite = await prisma.site.update({
      where: { id },
      data: {
        name: name || existingSite.name,
        lat: lat !== undefined ? lat : existingSite.lat,
        lng: lng !== undefined ? lng : existingSite.lng,
        address: address !== undefined ? address : existingSite.address,
        meta: meta ? JSON.stringify(meta) : existingSite.meta
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        entity: 'Site',
        entityId: id,
        payload: JSON.stringify({ name, lat, lng, address })
      }
    });

    const formattedSite = {
      ...updatedSite,
      meta: meta || (updatedSite.meta ? JSON.parse(updatedSite.meta) : null)
    };

    res.json({
      site: formattedSite,
      message: 'Site updated successfully'
    });

  } catch (error) {
    console.error('Update site error:', error);
    res.status(500).json({
      error: 'Failed to update site'
    });
  }
});

/**
 * @swagger
 * /api/v1/sites/{id}:
 *   delete:
 *     summary: Delete a site
 *     tags: [Sites]
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
 *         description: Site deleted successfully
 */
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = req.app.get('prisma');

    const existingSite = await prisma.site.findUnique({
      where: { id },
      include: {
        inspections: true,
        incidents: true,
        toolboxTalks: true
      }
    });

    if (!existingSite) {
      return res.status(404).json({
        error: 'Site not found'
      });
    }

    // Check if site has dependent records
    const hasDependencies = existingSite.inspections.length > 0 ||
                           existingSite.incidents.length > 0 ||
                           existingSite.toolboxTalks.length > 0;

    if (hasDependencies) {
      return res.status(400).json({
        error: 'Cannot delete site',
        message: 'Site has associated inspections, incidents, or toolbox talks. Please remove these first.'
      });
    }

    await prisma.site.delete({
      where: { id }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE',
        entity: 'Site',
        entityId: id,
        payload: JSON.stringify({ name: existingSite.name })
      }
    });

    res.json({
      message: 'Site deleted successfully'
    });

  } catch (error) {
    console.error('Delete site error:', error);
    res.status(500).json({
      error: 'Failed to delete site'
    });
  }
});

module.exports = router;