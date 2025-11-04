import { useState, useEffect } from 'react';
import { useSync } from '../../context/SyncContext';
import { RefreshCw, Wifi, WifiOff, Clock, CheckCircle, XCircle, AlertTriangle, Database, Smartphone } from 'lucide-react';
import { db } from '../../db.js';

const SyncStatus = () => {
  const {
    isOnline,
    syncStatus,
    pendingOperations,
    syncQueue,
    lastSyncTime,
    forceSync,
    clearSyncQueue
  } = useSync();

  const [syncStats, setSyncStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [localDataStats, setLocalDataStats] = useState({});
  const [pwaInstalled, setPwaInstalled] = useState(false);

  useEffect(() => {
    fetchSyncStats();
    checkPWAInstallation();
    loadDataStats();
  }, []);

  const fetchSyncStats = async () => {
    try {
      const response = await fetch('/api/v1/sync/status', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSyncStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch sync stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if PWA is installed
  const checkPWAInstallation = () => {
    if ('standalone' in window.navigator && window.navigator.standalone) {
      setPwaInstalled(true);
    } else if (window.matchMedia('(display-mode: standalone)').matches) {
      setPwaInstalled(true);
    }
  };

  // Get local data statistics
  const loadDataStats = async () => {
    try {
      const [users, sites, inspections, incidents, toolboxTalks, attachments] = await Promise.all([
        db.users.count(),
        db.sites.count(),
        db.inspections.count(),
        db.incidents.count(),
        db.toolboxTalks.count(),
        db.attachments.count(),
      ]);

      setLocalDataStats({
        users,
        sites,
        inspections,
        incidents,
        toolboxTalks,
        attachments
      });
    } catch (error) {
      console.error('Failed to load data stats:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'syncing':
        return <RefreshCw className="w-5 h-5 animate-spin text-info" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-error" />;
      case 'idle':
        return <CheckCircle className="w-5 h-5 text-success" />;
      default:
        return <Clock className="w-5 h-5 text-warning" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'syncing':
        return 'text-info';
      case 'error':
        return 'text-error';
      case 'idle':
        return 'text-success';
      default:
        return 'text-warning';
    }
  };

  const getQueueStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-warning';
      case 'processing':
        return 'text-info';
      case 'completed':
        return 'text-success';
      case 'failed':
        return 'text-error';
      default:
        return 'text-base-content';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-base-content">Sync Status</h1>
        <p className="text-base-content/70 mt-2">
          Monitor offline synchronization and data status.
        </p>
      </div>

      {/* PWA Status */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <div className="flex items-center gap-3">
            <Smartphone className={`w-8 h-8 ${pwaInstalled ? 'text-success' : 'text-info'}`} />
            <div>
              <h3 className="font-semibold">
                {pwaInstalled ? 'PWA Installed' : 'Web App'}
              </h3>
              <p className={`text-sm ${pwaInstalled ? 'text-success' : 'text-info'}`}>
                {pwaInstalled ? 'Running as installed PWA' : 'Running in browser - install for offline access'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Connection Status */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="flex items-center gap-3">
              {isOnline ? (
                <Wifi className="w-8 h-8 text-success" />
              ) : (
                <WifiOff className="w-8 h-8 text-error" />
              )}
              <div>
                <h3 className="font-semibold">Connection</h3>
                <p className={`text-sm ${isOnline ? 'text-success' : 'text-error'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Status */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="flex items-center gap-3">
              {getStatusIcon(syncStatus)}
              <div>
                <h3 className="font-semibold">Sync Status</h3>
                <p className={`text-sm capitalize ${getStatusColor(syncStatus)}`}>
                  {syncStatus}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Operations */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-warning/10 rounded-lg">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold">Pending</h3>
                <p className="text-sm text-warning">{pendingOperations} operations</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Local Data Statistics */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title flex items-center gap-2">
            <Database className="w-5 h-5" />
            Local Data
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(localDataStats).map(([key, count]) => (
              <div key={key} className="bg-base-200 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-base-content">{count}</div>
                <div className="text-sm text-base-content/70 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sync Actions */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title">Sync Actions</h2>
          <div className="flex gap-4">
            <button
              onClick={forceSync}
              disabled={!isOnline || syncStatus === 'syncing'}
              className="btn btn-primary gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              Force Sync Now
            </button>

            <button
              onClick={clearSyncQueue}
              disabled={pendingOperations === 0}
              className="btn btn-outline btn-warning gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Clear Queue
            </button>

            <button
              onClick={fetchSyncStats}
              className="btn btn-outline gap-2"
            >
              <Clock className="w-4 h-4" />
              Refresh Stats
            </button>
          </div>

          {lastSyncTime && (
            <p className="text-sm text-base-content/70 mt-4">
              Last successful sync: {new Date(lastSyncTime).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Sync Queue */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title">Sync Queue</h2>

          {syncQueue.length === 0 ? (
            <div className="text-center py-8 text-base-content/50">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Sync queue is empty</p>
            </div>
          ) : (
            <div className="space-y-3">
              {syncQueue.slice(0, 10).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      item.status === 'pending' ? 'bg-warning/10' :
                      item.status === 'processing' ? 'bg-info/10' :
                      item.status === 'completed' ? 'bg-success/10' : 'bg-error/10'
                    }`}>
                      {item.status === 'processing' ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-info" />
                      ) : item.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-success" />
                      ) : item.status === 'failed' ? (
                        <XCircle className="w-4 h-4 text-error" />
                      ) : (
                        <Clock className="w-4 h-4 text-warning" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold capitalize">{item.type} {item.entity}</h4>
                      <p className="text-sm text-base-content/70">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                      {item.error && (
                        <p className="text-sm text-error">{item.error}</p>
                      )}
                    </div>
                  </div>
                  <div className={`badge ${getQueueStatusColor(item.status)}`}>
                    {item.status}
                  </div>
                </div>
              ))}

              {syncQueue.length > 10 && (
                <p className="text-sm text-base-content/70 text-center">
                  +{syncQueue.length - 10} more items in queue
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Server Stats */}
      {syncStats && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title">Server Statistics</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="stat">
                <div className="stat-title">Server Time</div>
                <div className="stat-value text-lg">
                  {new Date(syncStats.serverTime).toLocaleTimeString()}
                </div>
                <div className="stat-desc">
                  {new Date(syncStats.serverTime).toLocaleDateString()}
                </div>
              </div>

              <div className="stat">
                <div className="stat-title">Health Status</div>
                <div className={`stat-value text-lg ${syncStats.health === 'healthy' ? 'text-success' : 'text-error'}`}>
                  {syncStats.health}
                </div>
                <div className="stat-desc">Server operational status</div>
              </div>

              <div className="stat">
                <div className="stat-title">Queue Status</div>
                <div className="stat-value text-lg">
                  {syncStats.queueStats.reduce((total, stat) => total + stat._count, 0)}
                </div>
                <div className="stat-desc">Total operations in queue</div>
              </div>
            </div>

            {syncStats.queueStats.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Queue Breakdown</h3>
                <div className="flex flex-wrap gap-2">
                  {syncStats.queueStats.map((stat) => (
                    <div key={stat.status} className={`badge badge-sm ${getQueueStatusColor(stat.status)}`}>
                      {stat.status}: {stat._count}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sync Tips */}
      <div className="card bg-info/10 border-info shadow-lg">
        <div className="card-body">
          <h2 className="card-title text-info">Sync Tips</h2>
          <ul className="space-y-2 text-sm">
            <li>• Data syncs automatically when you're online</li>
            <li>• Large files may take longer to sync</li>
            <li>• Check your connection if sync fails repeatedly</li>
            <li>• You can work offline - changes will sync when connection returns</li>
            <li>• Use "Force Sync" to manually trigger synchronization</li>
            <li>• Generate demo data to test offline functionality</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SyncStatus;