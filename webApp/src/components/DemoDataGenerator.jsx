import { db, dbHelpers } from '../db.js';
import { useSync } from '../context/SyncContext.jsx';
import { useState } from 'react';

export const DemoDataGenerator = () => {
  const { addToSyncQueue } = useSync();
  const [loading, setLoading] = useState(false);

  const generateDemoData = async () => {
    setLoading(true);

    try {
      // Generate demo sites
      const sites = [
        {
          name: 'Construction Site A',
          lat: 40.7128,
          lng: -74.0060,
          address: '123 Main St, New York, NY',
          meta: JSON.stringify({ area: '5000 sq ft', type: 'residential' })
        },
        {
          name: 'Warehouse Complex B',
          lat: 34.0522,
          lng: -118.2437,
          address: '456 Industrial Ave, Los Angeles, CA',
          meta: JSON.stringify({ area: '10000 sq ft', type: 'industrial' })
        }
      ];

      for (const siteData of sites) {
        const siteId = await dbHelpers.createEntity('sites', siteData);

        // Generate demo users
        const users = [
          {
            email: `supervisor${siteId}@example.com`,
            name: 'John Supervisor',
            role: 'SUPERVISOR',
            password: 'hashed_password_here',
            apiKey: `api_key_${siteId}`,
            keyEnabled: true
          },
          {
            email: `worker${siteId}@example.com`,
            name: 'Jane Worker',
            role: 'WORKER',
            password: 'hashed_password_here',
            apiKey: `api_key_worker_${siteId}`,
            keyEnabled: true
          }
        ];

        for (const userData of users) {
          await dbHelpers.createEntity('users', userData);
        }

        // Generate demo inspections
        const inspections = [
          {
            siteId,
            createdById: `local_supervisor${siteId}`,
            checklist: JSON.stringify({
              safetyGear: true,
              equipmentCheck: true,
              hazardAssessment: true,
              emergencyRoutes: true
            }),
            status: 'completed',
            localClientId: `inspection_${Date.now()}_${Math.random()}`
          },
          {
            siteId,
            createdById: `local_supervisor${siteId}`,
            checklist: JSON.stringify({
              safetyGear: true,
              equipmentCheck: false,
              hazardAssessment: true,
              emergencyRoutes: true
            }),
            status: 'draft',
            localClientId: `inspection_${Date.now()}_${Math.random()}`
          }
        ];

        for (const inspectionData of inspections) {
          await dbHelpers.createEntity('inspections', inspectionData);
        }

        // Generate demo incidents
        const incidents = [
          {
            siteId,
            reportedById: `local_worker${siteId}`,
            type: 'Near Miss',
            severity: 2,
            description: 'Worker almost slipped on wet surface',
            location: JSON.stringify({ lat: 40.7128, lng: -74.0060 }),
            localClientId: `incident_${Date.now()}_${Math.random()}`
          },
          {
            siteId,
            reportedById: `local_supervisor${siteId}`,
            type: 'Equipment Failure',
            severity: 3,
            description: 'Forklift malfunction during operation',
            location: JSON.stringify({ lat: 34.0522, lng: -118.2437 }),
            localClientId: `incident_${Date.now()}_${Math.random()}`
          }
        ];

        for (const incidentData of incidents) {
          await dbHelpers.createEntity('incidents', incidentData);
        }

        // Generate demo toolbox talks
        const toolboxTalks = [
          {
            siteId,
            createdById: `local_supervisor${siteId}`,
            title: 'Fall Prevention Safety Talk',
            agenda: 'Discussion on fall hazards and prevention measures',
            attendees: JSON.stringify(['John Supervisor', 'Jane Worker', 'Mike Contractor']),
            scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            status: 'scheduled',
            localClientId: `toolbox_${Date.now()}_${Math.random()}`
          }
        ];

        for (const talkData of toolboxTalks) {
          await dbHelpers.createEntity('toolboxTalks', talkData);
        }
      }

      console.log('Demo data generated successfully');

      // Add demo data to sync queue for testing
      await addToSyncQueue({
        type: 'create',
        entity: 'demo_sync_test',
        payload: { generatedAt: new Date().toISOString() },
        localId: `demo_${Date.now()}`
      });

    } catch (error) {
      console.error('Failed to generate demo data:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearDemoData = async () => {
    setLoading(true);

    try {
      await dbHelpers.clearAllData();
      console.log('Demo data cleared');
    } catch (error) {
      console.error('Failed to clear demo data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-base-100 rounded-lg shadow">
      <h3 className="font-semibold mb-4">Demo Data Generator</h3>
      <div className="flex gap-2">
        <button
          onClick={generateDemoData}
          disabled={loading}
          className="btn btn-primary btn-sm"
        >
          {loading ? 'Generating...' : 'Generate Demo Data'}
        </button>
        <button
          onClick={clearDemoData}
          disabled={loading}
          className="btn btn-outline btn-error btn-sm"
        >
          {loading ? 'Clearing...' : 'Clear All Data'}
        </button>
      </div>
      <p className="text-xs text-base-content/70 mt-2">
        This will create sample sites, users, inspections, incidents, and toolbox talks for testing.
      </p>
    </div>
  );
};