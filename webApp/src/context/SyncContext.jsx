import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

const SyncContext = createContext();

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};

export const SyncProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, error, offline
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [pendingOperations, setPendingOperations] = useState(0);
  const [syncQueue, setSyncQueue] = useState([]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.info('Back online - syncing data...');
      performSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
      toast.warning('You are offline. Changes will be synced when connection returns.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Periodic sync when online
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(() => {
      if (syncQueue.length > 0 && syncStatus !== 'syncing') {
        performSync();
      }
    }, 30000); // Sync every 30 seconds if there are pending operations

    return () => clearInterval(interval);
  }, [isOnline, syncQueue.length, syncStatus]);

  const addToSyncQueue = useCallback((operation) => {
    const queueItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...operation,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    setSyncQueue(prev => [...prev, queueItem]);
    setPendingOperations(prev => prev + 1);

    // Store in localStorage for persistence
    const stored = JSON.parse(localStorage.getItem('syncQueue') || '[]');
    stored.push(queueItem);
    localStorage.setItem('syncQueue', JSON.stringify(stored));

    return queueItem.id;
  }, []);

  const removeFromSyncQueue = useCallback((operationId) => {
    setSyncQueue(prev => prev.filter(item => item.id !== operationId));
    setPendingOperations(prev => Math.max(0, prev - 1));

    // Update localStorage
    const stored = JSON.parse(localStorage.getItem('syncQueue') || '[]');
    const updated = stored.filter(item => item.id !== operationId);
    localStorage.setItem('syncQueue', JSON.stringify(updated));
  }, []);

  const performSync = useCallback(async () => {
    if (!isOnline || syncQueue.length === 0 || syncStatus === 'syncing') {
      return;
    }

    setSyncStatus('syncing');

    try {
      const operations = syncQueue.filter(item => item.status === 'pending');

      if (operations.length === 0) {
        setSyncStatus('idle');
        return;
      }

      // Group operations by entity type for batch processing
      const operationsByEntity = operations.reduce((acc, op) => {
        if (!acc[op.entity]) acc[op.entity] = [];
        acc[op.entity].push(op);
        return acc;
      }, {});

      // Process each entity type
      for (const [entity, entityOps] of Object.entries(operationsByEntity)) {
        const batchOps = entityOps.map(op => ({
          opId: op.id,
          opType: op.type,
          entity: op.entity,
          payload: op.payload,
          localId: op.localId,
          timestamp: op.timestamp,
          attachmentsMeta: op.attachmentsMeta || []
        }));

        try {
          const response = await fetch('/api/v1/sync/push', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              clientId: 'web-client-' + Date.now(),
              ops: batchOps
            }),
          });

          const result = await response.json();

          if (response.ok) {
            // Mark successful operations as completed
            entityOps.forEach(op => {
              removeFromSyncQueue(op.id);
            });

            // Handle any conflicts or partial failures
            result.results.forEach(resultItem => {
              if (resultItem.status === 'error') {
                console.error('Sync operation failed:', resultItem.error);
                // Could implement retry logic here
              }
            });
          } else {
            throw new Error(result.message || 'Sync failed');
          }

        } catch (error) {
          console.error(`Sync failed for ${entity}:`, error);
          // Mark operations as failed for retry
          entityOps.forEach(op => {
            setSyncQueue(prev => prev.map(item =>
              item.id === op.id ? { ...item, status: 'failed', error: error.message } : item
            ));
          });
        }
      }

      setLastSyncTime(new Date());
      setSyncStatus('idle');

      if (operations.length > 0) {
        toast.success(`Synced ${operations.length} operations`);
      }

    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
      toast.error('Sync failed - will retry automatically');
    }
  }, [isOnline, syncQueue, syncStatus, removeFromSyncQueue]);

  const forceSync = useCallback(() => {
    if (isOnline) {
      toast.info('Starting manual sync...');
      performSync();
    } else {
      toast.warning('Cannot sync while offline');
    }
  }, [isOnline, performSync]);

  const clearSyncQueue = useCallback(() => {
    setSyncQueue([]);
    setPendingOperations(0);
    localStorage.removeItem('syncQueue');
    toast.info('Sync queue cleared');
  }, []);

  // Load sync queue from localStorage on mount
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('syncQueue') || '[]');
    setSyncQueue(stored);
    setPendingOperations(stored.length);
  }, []);

  const value = {
    isOnline,
    syncStatus,
    lastSyncTime,
    pendingOperations,
    syncQueue,
    addToSyncQueue,
    removeFromSyncQueue,
    performSync,
    forceSync,
    clearSyncQueue
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
};