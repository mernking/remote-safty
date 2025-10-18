import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSync } from "../../context/SyncContext";
import { db, dbHelpers } from "../../db.js";
import {
  AlertTriangle,
  Plus,
  Filter,
  Search,
  Eye,
  MapPin,
  Database,
} from "lucide-react";

const Incidents = () => {
  const { user } = useAuth();
  const { isOnline, addToSyncQueue } = useSync();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [siteFilter, setSiteFilter] = useState("");
  const [localIncidents, setLocalIncidents] = useState([]);
  const [useOffline, setUseOffline] = useState(false);
  const [sites, setSites] = useState([]);

  useEffect(() => {
    fetchIncidents();
    loadLocalIncidents();
    fetchSites();
  }, [severityFilter, siteFilter]);

  const fetchSites = async () => {
    try {
      const response = await fetch("/api/v1/sites", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setSites(data.sites || []);
      }
    } catch (error) {
      console.error("Failed to fetch sites:", error);
    }
  };

  useEffect(() => {
    setUseOffline(!isOnline);
  }, [isOnline]);

  const fetchIncidents = async () => {
    try {
      const params = new URLSearchParams();
      if (severityFilter) params.append("severity", severityFilter);
      if (siteFilter) params.append("siteId", siteFilter);
      params.append("limit", "50");

      const response = await fetch(`/api/v1/incidents?${params}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setIncidents(data.incidents);

        // Sync to local database
        for (const incident of data.incidents) {
          await db.incidents.put(incident);
        }
      } else if (!isOnline) {
        // Load from local database if offline
        await loadLocalIncidents();
      }
    } catch (error) {
      console.error("Failed to fetch incidents:", error);
      // Fallback to local data
      await loadLocalIncidents();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalIncidents = async () => {
    try {
      const localData = await db.incidents.toArray();
      setLocalIncidents(localData);
      if (!isOnline || incidents.length === 0) {
        setIncidents(localData);
      }
    } catch (error) {
      console.error("Failed to load local incidents:", error);
    }
  };

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.site?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.reportedBy?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      incident.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getSeverityBadge = (severity) => {
    const severityConfig = {
      1: { color: "badge-info", text: "Low" },
      2: { color: "badge-warning", text: "Medium" },
      3: { color: "badge-warning", text: "High" },
      4: { color: "badge-error", text: "Critical" },
      5: { color: "badge-error", text: "Severe" },
    };
    const config = severityConfig[severity] || {
      color: "badge-neutral",
      text: `Level ${severity}`,
    };
    return <span className={`badge ${config.color}`}>{config.text}</span>;
  };

  const getSeverityColor = (severity) => {
    if (severity >= 4) return "border-l-error bg-error/5";
    if (severity >= 3) return "border-l-warning bg-warning/5";
    return "border-l-info bg-info/5";
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">
            Incidents
            {!isOnline && (
              <span className="ml-2 badge badge-warning badge-sm">
                <Database className="w-3 h-3 mr-1" />
                Offline
              </span>
            )}
          </h1>
          <p className="text-base-content/70 mt-2">
            Track and manage safety incidents and near-misses.
            {!isOnline && " Working offline - changes will sync when online."}
          </p>
        </div>

        <Link to="/dashboard/incidents/new" className="btn btn-error gap-2">
          <Plus className="w-4 h-4" />
          Report Incident
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="form-control">
          <div className="input-group">
            <span>
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search incidents..."
              className="input input-bordered"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <select
          className="select select-bordered"
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
        >
          <option value="">All Severities</option>
          <option value="1">Low</option>
          <option value="2">Medium</option>
          <option value="3">High</option>
          <option value="4">Critical</option>
          <option value="5">Severe</option>
        </select>

        <select
          className="select select-bordered"
          value={siteFilter}
          onChange={(e) => setSiteFilter(e.target.value)}
        >
          <option value="">All Sites</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
      </div>

      {/* Critical Incidents Alert */}
      {filteredIncidents.some((incident) => incident.severity >= 4) && (
        <div className="alert alert-error">
          <AlertTriangle className="w-6 h-6" />
          <div>
            <h3 className="font-bold">Critical Incidents Detected</h3>
            <div className="text-xs">
              {
                filteredIncidents.filter((incident) => incident.severity >= 4)
                  .length
              }{" "}
              critical or severe incidents require immediate attention.
            </div>
          </div>
        </div>
      )}

      {/* Incidents List */}
      {filteredIncidents.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
          <h3 className="text-lg font-semibold text-base-content mb-2">
            No incidents found
          </h3>
          <p className="text-base-content/70 mb-6">
            All clear! No safety incidents have been reported yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredIncidents.map((incident) => (
            <div
              key={incident.id}
              className={`card bg-base-100 shadow-lg border-l-4 ${getSeverityColor(
                incident.severity
              )}`}
            >
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg ${
                        incident.severity >= 4
                          ? "bg-error/10"
                          : incident.severity >= 3
                          ? "bg-warning/10"
                          : "bg-info/10"
                      }`}
                    >
                      <AlertTriangle
                        className={`w-6 h-6 ${
                          incident.severity >= 4
                            ? "text-error"
                            : incident.severity >= 3
                            ? "text-warning"
                            : "text-info"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {incident.type}
                        </h3>
                        {getSeverityBadge(incident.severity)}
                      </div>

                      <p className="text-base-content/80 mb-3">
                        {incident.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-base-content/70">
                        <span>Reported by {incident.reportedBy?.name}</span>
                        <span>
                          {new Date(incident.createdAt).toLocaleDateString()}
                        </span>
                        <span>Site: {incident.site?.name}</span>
                        {incident.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>Location data available</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="dropdown dropdown-left">
                    <label
                      tabIndex={0}
                      className="btn btn-ghost btn-sm btn-square"
                    >
                      <Filter className="w-4 h-4" />
                    </label>
                    <ul
                      tabIndex={0}
                      className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-40"
                    >
                      <li>
                        <Link
                          to={`/dashboard/incidents/${incident.id}`}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </Link>
                      </li>
                      {(user?.role === "ADMIN" ||
                        user?.role === "SAFETY_MANAGER") && (
                        <li>
                          <Link
                            to={`/dashboard/incidents/${incident.id}/edit`}
                            className="gap-2"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            Edit
                          </Link>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Attachments indicator */}
                {incident.attachments && incident.attachments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-base-300">
                    <div className="flex items-center gap-2 text-sm text-base-content/70">
                      <div className="badge badge-neutral badge-sm">
                        {incident.attachments.length} attachment
                        {incident.attachments.length > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-base-300">
                  <div className="text-sm text-base-content/70">
                    Last updated:{" "}
                    {new Date(incident.updatedAt).toLocaleString()}
                  </div>
                  <Link
                    to={`/dashboard/incidents/${incident.id}`}
                    className="btn btn-primary btn-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Incidents;
