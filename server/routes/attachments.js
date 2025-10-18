const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { authenticate } = require('../middleware/auth');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600 // 100MB default
  },
  fileFilter: (req, file, cb) => {
    // Allow images, videos, and documents
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/mov',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, and documents are allowed.'), false);
    }
  }
});

/**
 * @swagger
 * /api/v1/attachments/upload-direct:
 *   post:
 *     summary: Upload file directly to Cloudinary without multer
 *     tags: [Attachments]
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
 *               - filename
 *               - mimeType
 *               - size
 *               - base64Data
 *               - linkedEntity
 *               - linkedId
 *             properties:
 *               filename:
 *                 type: string
 *               mimeType:
 *                 type: string
 *               size:
 *                 type: integer
 *               base64Data:
 *                 type: string
 *               linkedEntity:
 *                 type: string
 *                 enum: [Inspection, Incident, ToolboxTalk]
 *               linkedId:
 *                 type: string
 *     responses:
 *       201:
 *         description: File uploaded to Cloudinary successfully
 */
router.post('/upload-direct', authenticate, async (req, res) => {
  try {
    const { filename, mimeType, size, base64Data, linkedEntity, linkedId } = req.body;
    const prisma = req.app.get('prisma');

    if (!filename || !mimeType || !size || !base64Data || !linkedEntity || !linkedId) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'All fields (filename, mimeType, size, base64Data, linkedEntity, linkedId) are required'
      });
    }

    // Verify the linked entity exists
    let linkedEntityExists = false;
    switch (linkedEntity) {
      case 'Inspection':
        const inspection = await prisma.inspection.findUnique({ where: { id: linkedId } });
        linkedEntityExists = !!inspection;
        break;
      case 'Incident':
        const incident = await prisma.incident.findUnique({ where: { id: linkedId } });
        linkedEntityExists = !!incident;
        break;
      case 'ToolboxTalk':
        const toolboxTalk = await prisma.toolboxTalk.findUnique({ where: { id: linkedId } });
        linkedEntityExists = !!toolboxTalk;
        break;
      default:
        return res.status(400).json({
          error: 'Validation error',
          message: 'Invalid linkedEntity. Must be Inspection, Incident, or ToolboxTalk'
        });
    }

    if (!linkedEntityExists) {
      return res.status(404).json({
        error: 'Linked entity not found'
      });
    }

    // Upload directly to Cloudinary
    const result = await cloudinary.uploader.upload(`data:${mimeType};base64,${base64Data}`, {
      folder: 'safety-app',
      resource_type: 'auto',
      public_id: `attachment_${Date.now()}_${filename.split('.')[0]}`
    });

    // Create attachment record with Cloudinary URL
    const attachment = await prisma.attachment.create({
      data: {
        filename,
        mimeType,
        size,
        storagePath: result.secure_url,
        uploaded: true,
        checksum: result.etag || size.toString(),
        createdById: req.user.id,
        linkedEntity,
        linkedId
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        entity: 'Attachment',
        entityId: attachment.id,
        payload: JSON.stringify({ filename, linkedEntity, linkedId, cloudinaryUrl: result.secure_url })
      }
    });

    res.status(201).json({
      attachment,
      message: 'File uploaded to Cloudinary successfully'
    });

  } catch (error) {
    console.error('Direct upload error:', error);
    res.status(500).json({
      error: 'Failed to upload file'
    });
  }
});

/**
 * @swagger
 * /api/v1/attachments/upload/{id}:
 *   post:
 *     summary: Upload file for an initialized attachment
 *     tags: [Attachments]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 */
router.post('/upload/:id', authenticate, upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = req.app.get('prisma');

    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded'
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'safety-app',
      resource_type: 'auto',
      public_id: `attachment_${id}_${Date.now()}`
    });

    // Update attachment with Cloudinary URL
    const attachment = await prisma.attachment.update({
      where: { id },
      data: {
        storagePath: result.secure_url,
        uploaded: true,
        checksum: result.etag || req.file.size.toString()
      }
    });

    // Clean up local file
    fs.unlinkSync(req.file.path);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        entity: 'Attachment',
        entityId: id,
        payload: JSON.stringify({ uploaded: true, cloudinaryUrl: result.secure_url })
      }
    });

    res.json({
      attachment,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('Upload attachment error:', error);
    // Clean up local file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      error: 'Failed to upload file'
    });
  }
});

/**
 * @swagger
 * /api/v1/attachments/complete/{id}:
 *   post:
 *     summary: Mark attachment upload as complete and finalize
 *     tags: [Attachments]
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               checksum:
 *                 type: string
 *     responses:
 *       200:
 *         description: Attachment finalized successfully
 */
router.post('/complete/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { checksum } = req.body;
    const prisma = req.app.get('prisma');

    const attachment = await prisma.attachment.findUnique({
      where: { id }
    });

    if (!attachment) {
      return res.status(404).json({
        error: 'Attachment not found'
      });
    }

    if (!attachment.uploaded) {
      return res.status(400).json({
        error: 'Attachment not yet uploaded'
      });
    }

    // Verify checksum if provided
    if (checksum && attachment.checksum !== checksum) {
      return res.status(400).json({
        error: 'Checksum verification failed'
      });
    }

    // Mark as uploaded (already done in upload step, but this is the final confirmation)
    res.json({
      attachment,
      message: 'Attachment finalized successfully'
    });

  } catch (error) {
    console.error('Complete attachment error:', error);
    res.status(500).json({
      error: 'Failed to finalize attachment'
    });
  }
});

/**
 * @swagger
 * /api/v1/attachments/{id}:
 *   get:
 *     summary: Download/Serve attachment file
 *     tags: [Attachments]
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
 *         description: File served successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = req.app.get('prisma');

    const attachment = await prisma.attachment.findUnique({
      where: { id }
    });

    if (!attachment) {
      return res.status(404).json({
        error: 'Attachment not found'
      });
    }

    if (!attachment.uploaded) {
      return res.status(404).json({
        error: 'Attachment not yet uploaded'
      });
    }

    // Check if user has access to the linked entity
    let hasAccess = false;
    switch (attachment.linkedEntity) {
      case 'Inspection':
        const inspection = await prisma.inspection.findUnique({
          where: { id: attachment.linkedId }
        });
        hasAccess = req.user.role === 'ADMIN' ||
                   (inspection && inspection.createdById === req.user.id) ||
                   req.user.role === 'SAFETY_MANAGER';
        break;
      case 'Incident':
        const incident = await prisma.incident.findUnique({
          where: { id: attachment.linkedId }
        });
        hasAccess = req.user.role === 'ADMIN' ||
                   (incident && incident.reportedById === req.user.id) ||
                   req.user.role === 'SAFETY_MANAGER';
        break;
      case 'ToolboxTalk':
        const toolboxTalk = await prisma.toolboxTalk.findUnique({
          where: { id: attachment.linkedId }
        });
        hasAccess = req.user.role === 'ADMIN' ||
                   (toolboxTalk && toolboxTalk.createdById === req.user.id);
        break;
    }

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    // For Cloudinary URLs, redirect to the Cloudinary URL
    if (attachment.storagePath.startsWith('http')) {
      return res.redirect(attachment.storagePath);
    }

    // Fallback for old local files (if any)
    const filePath = path.resolve(attachment.storagePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'File not found on disk'
      });
    }

    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`);
    res.sendFile(filePath);

  } catch (error) {
    console.error('Download attachment error:', error);
    res.status(500).json({
      error: 'Failed to download attachment'
    });
  }
});

/**
 * @swagger
 * /api/v1/attachments/{id}:
 *   delete:
 *     summary: Delete an attachment
 *     tags: [Attachments]
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
 *         description: Attachment deleted successfully
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = req.app.get('prisma');

    const attachment = await prisma.attachment.findUnique({
      where: { id }
    });

    if (!attachment) {
      return res.status(404).json({
        error: 'Attachment not found'
      });
    }

    // Check if user can delete this attachment (owner or admin)
    if (req.user.role !== 'ADMIN' && attachment.createdById !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    // Delete file from Cloudinary if it's a Cloudinary URL
    if (attachment.uploaded && attachment.storagePath && attachment.storagePath.startsWith('http')) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = attachment.storagePath.split('/');
        const publicIdWithExt = urlParts[urlParts.length - 1];
        const publicId = `safety-app/${publicIdWithExt.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudError) {
        console.warn('Failed to delete file from Cloudinary:', cloudError);
        // Continue with database deletion even if cloud deletion fails
      }
    } else if (attachment.uploaded && attachment.storagePath) {
      // Fallback for old local files
      try {
        const filePath = path.resolve(attachment.storagePath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileError) {
        console.warn('Failed to delete file from disk:', fileError);
        // Continue with database deletion even if file deletion fails
      }
    }

    await prisma.attachment.delete({
      where: { id }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE',
        entity: 'Attachment',
        entityId: id,
        payload: JSON.stringify({ filename: attachment.filename })
      }
    });

    res.json({
      message: 'Attachment deleted successfully'
    });

  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({
      error: 'Failed to delete attachment'
    });
  }
});

module.exports = router;