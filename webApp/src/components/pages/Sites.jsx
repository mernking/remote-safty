import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSync } from "../../context/SyncContext";
import { db, dbHelpers } from "../../db.js";
import {
  MapPin,
  Plus,
  Users,
  ClipboardCheck,
  AlertTriangle,
  MoreVertical,
  Database,
} from "lucide-react";

const Sites = () => {
  const { user } = useAuth();
  const { isOnline, addToSyncQueue } = useSync();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchSites();
    loadLocalSites();
  }, []);

  const fetchSites = async () => {
    try {
      const response = await fetch("/api/v1/sites", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setSites(data.sites);

        // Sync to local database
        for (const site of data.sites) {
          await db.sites.put(site);
        }
      } else if (!isOnline) {
        // Load from local database if offline
        await loadLocalSites();
      }
    } catch (error) {
      console.error("Failed to fetch sites:", error);
      // Fallback to local data
      await loadLocalSites();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalSites = async () => {
    try {
      const localData = await db.sites.toArray();
      if (!isOnline || sites.length === 0) {
        setSites(localData);
      }
    } catch (error) {
      console.error("Failed to load local sites:", error);
    }
  };

  const filteredSites = sites.filter(
    (site) =>
      site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCreateSite =
    user?.role === "ADMIN" || user?.role === "SAFETY_MANAGER";

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">
            Sites
            {!isOnline && (
              <span className="ml-2 badge badge-warning badge-sm">
                <Database className="w-3 h-3 mr-1" />
                Offline
              </span>
            )}
          </h1>
          <p className="text-base-content/70 mt-2">
            Manage jobsite locations and safety oversight.
            {!isOnline && " Working offline - changes will sync when online."}
          </p>
        </div>

        {canCreateSite && (
          <Link to="/dashboard/sites/new" className="btn btn-primary gap-2">
            <Plus className="w-4 h-4" />
            Add Site
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="form-control">
        <input
          type="text"
          placeholder="Search sites by name or address..."
          className="input input-bordered"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Sites Grid */}
      {filteredSites.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
          <h3 className="text-lg font-semibold text-base-content mb-2">
            {searchTerm ? "No sites found" : "No sites configured"}
          </h3>
          <p className="text-base-content/70 mb-6">
            {searchTerm
              ? "Try adjusting your search terms"
              : "Get started by adding your first jobsite location"}
          </p>
          {canCreateSite && !searchTerm && (
            <Link to="/dashboard/sites/new" className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Site
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSites.map((site) => (
            <div
              key={site.id}
              className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="card-body">
                {/* Site Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{site.name}</h3>
                      {site.address && (
                        <p className="text-sm text-base-content/70">
                          {site.address}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="dropdown dropdown-left">
                    <label
                      tabIndex={0}
                      className="btn btn-ghost btn-sm btn-square"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </label>
                    <ul
                      tabIndex={0}
                      className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                    >
                      <li>
                        <Link to={`/dashboard/sites/${site.id}`}>
                          View Details
                        </Link>
                      </li>
                      <li>
                        <Link to={`/dashboard/sites/${site.id}/edit`}>
                          Edit Site
                        </Link>
                      </li>
                      <li>
                        <Link to={`/dashboard/sites/${site.id}/inspections`}>
                          View Inspections
                        </Link>
                      </li>
                      <li>
                        <Link to={`/dashboard/sites/${site.id}/incidents`}>
                          View Incidents
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Site Stats */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {site._count?.inspections || 0}
                    </div>
                    <div className="text-xs text-base-content/70">
                      Inspections
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-error">
                      {site._count?.incidents || 0}
                    </div>
                    <div className="text-xs text-base-content/70">
                      Incidents
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary">
                      {site._count?.toolboxTalks || 0}
                    </div>
                    <div className="text-xs text-base-content/70">Talks</div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mt-4">
                  <Link
                    to={`/dashboard/inspections/new?site=${site.id}`}
                    className="btn btn-primary btn-sm flex-1"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    New Inspection
                  </Link>
                  <Link
                    to={`/dashboard/sites/${site.id}/incidents/new`}
                    className="btn btn-outline btn-error btn-sm flex-1"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Report Incident
                  </Link>
                </div>

                {/* Location Info */}
                {(site.lat || site.lng) && (
                  <div className="mt-4 pt-4 border-t border-base-300">
                    <div className="text-sm text-base-content/70">
                      <strong>Coordinates:</strong> {site.lat?.toFixed(6)},{" "}
                      {site.lng?.toFixed(6)}
                    </div>
                  </div>
                )}

                {/* Last Activity */}
                <div className="mt-2 text-xs text-base-content/50">
                  Last updated: {new Date(site.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Sites;
