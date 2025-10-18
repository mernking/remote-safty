import Dexie from 'dexie';

export const db = new Dexie('RemoteJobsiteSafetyDB');

// Version 1: Initial schema
db.version(1).stores({
  users: '++id, email, name, role, apiKey, keyEnabled, createdAt, updatedAt',
  sites: '++id, name, lat, lng, address, meta, createdAt, updatedAt',
  inspections: '++id, siteId, createdById, checklist, status, localClientId, version, createdAt, updatedAt',
  incidents: '++id, siteId, reportedById, type, severity, description, location, localClientId, version, createdAt, updatedAt',
  toolboxTalks: '++id, siteId, createdById, title, agenda, attendees, scheduledAt, completedAt, status, localClientId, version, createdAt, updatedAt',
  attachments: '++id, filename, mimeType, size, storagePath, uploaded, checksum, createdById, linkedEntity, linkedId, inspectionId, incidentId, toolboxTalkId, createdAt',
  auditLogs: '++id, userId, action, entity, entityId, payload, inspectionId, incidentId, toolboxTalkId, createdAt',
  syncQueue: '++id, clientId, opId, opType, entity, payload, localId, status, attempts, lastError, createdAt, updatedAt',
  notifications: '++id, userId, type, title, message, data, read, priority, relatedEntity, relatedId, createdAt',
  reminders: '++id, type, entityId, entityType, scheduledAt, sentAt, status, assignedTo, siteId, createdAt'
});

// Add indexes for common queries
db.version(2).upgrade(async tx => {
  // Add indexes for better query performance
  await tx.table('inspections').where('[siteId+status]').equals(['', '']).toArray(); // Placeholder for compound index
  await tx.table('incidents').where('[siteId+severity]').equals(['', 0]).toArray();
  await tx.table('toolboxTalks').where('[siteId+status]').equals(['', '']).toArray();
});

// Helper functions for data operations
export const dbHelpers = {
  // Generate local IDs for offline operations
  generateLocalId: () => `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

  // Sync operations
  async addToSyncQueue(operation) {
    const syncItem = {
      clientId: 'web-client',
      opId: this.generateLocalId(),
      opType: operation.type, // create, update, delete
      entity: operation.entity,
      payload: JSON.stringify(operation.payload),
      localId: operation.localId,
      status: 'pending',
      attempts: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.syncQueue.add(syncItem);
    return syncItem.opId;
  },

  async markSyncComplete(opId) {
    await db.syncQueue.where('opId').equals(opId).modify({
      status: 'completed',
      updatedAt: new Date()
    });
  },

  async markSyncFailed(opId, error) {
    await db.syncQueue.where('opId').equals(opId).modify({
      status: 'failed',
      lastError: error,
      attempts: Dexie.currentTransaction.source ? 0 : undefined, // Increment attempts
      updatedAt: new Date()
    });
  },

  // Entity-specific operations
  async createEntity(entityName, data, localId = null) {
    const entityData = {
      ...data,
      id: localId || this.generateLocalId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db[entityName].add(entityData);

    // Add to sync queue if not a server-synced entity
    if (!localId) {
      await this.addToSyncQueue({
        type: 'create',
        entity: entityName,
        payload: entityData,
        localId: entityData.id
      });
    }

    return entityData.id;
  },

  async updateEntity(entityName, id, updates) {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    await db[entityName].update(id, updateData);

    await this.addToSyncQueue({
      type: 'update',
      entity: entityName,
      payload: { id, ...updateData },
      localId: id
    });
  },

  async deleteEntity(entityName, id) {
    await db[entityName].delete(id);

    await this.addToSyncQueue({
      type: 'delete',
      entity: entityName,
      payload: { id },
      localId: id
    });
  },

  // Bulk operations for sync
  async getPendingSyncOperations() {
    return await db.syncQueue.where('status').equals('pending').toArray();
  },

  async getAllEntities(entityName) {
    return await db[entityName].toArray();
  },

  // Clear all data (useful for logout or reset)
  async clearAllData() {
    await db.transaction('rw', db.tables, async () => {
      for (const table of db.tables) {
        await table.clear();
      }
    });
  }
};

// Initialize database
export const initDB = async () => {
  try {
    await db.open();
    console.log('Database opened successfully');
  } catch (error) {
    console.error('Failed to open database:', error);
  }
};