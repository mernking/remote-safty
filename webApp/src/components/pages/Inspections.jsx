import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSync } from "../../context/SyncContext";
import { db, dbHelpers } from "../../db.js";
import {
  ClipboardCheck,
  Plus,
  Filter,
  Search,
  Eye,
  Edit,
  Database,
  Download,
} from "lucide-react";

const Inspections = () => {
  const { user } = useAuth();
  const { isOnline, addToSyncQueue } = useSync();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [siteFilter, setSiteFilter] = useState("");
  const [localInspections, setLocalInspections] = useState([]);
  const [useOffline, setUseOffline] = useState(false);
  const [sites, setSites] = useState([]);

  useEffect(() => {
    fetchInspections();
    loadLocalInspections();
    fetchSites();
  }, [statusFilter, siteFilter]);

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

  const fetchInspections = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (siteFilter) params.append("siteId", siteFilter);
      params.append("limit", "50");

      const response = await fetch(`/api/v1/inspections?${params}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setInspections(data.inspections);

        // Sync to local database
        for (const inspection of data.inspections) {
          await db.inspections.put(inspection);
        }
      } else if (!isOnline) {
        // Load from local database if offline
        await loadLocalInspections();
      }
    } catch (error) {
      console.error("Failed to fetch inspections:", error);
      // Fallback to local data
      await loadLocalInspections();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalInspections = async () => {
    try {
      const localData = await db.inspections.toArray();
      setLocalInspections(localData);
      if (!isOnline || inspections.length === 0) {
        setInspections(localData);
      }
    } catch (error) {
      console.error("Failed to load local inspections:", error);
    }
  };

  const filteredInspections = inspections.filter((inspection) => {
    const matchesSearch =
      inspection.site?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.createdBy?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: "badge-warning", text: "Draft" },
      completed: { color: "badge-success", text: "Completed" },
      in_progress: { color: "badge-info", text: "In Progress" },
    };
    const config = statusConfig[status] || {
      color: "badge-neutral",
      text: status,
    };
    return <span className={`badge ${config.color}`}>{config.text}</span>;
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
            Inspections
            {!isOnline && (
              <span className="ml-2 badge badge-warning badge-sm">
                <Database className="w-3 h-3 mr-1" />
                Offline
              </span>
            )}
          </h1>
          <p className="text-base-content/70 mt-2">
            Safety inspection records and compliance tracking.
            {!isOnline && " Working offline - changes will sync when online."}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/dashboard/inspections/new"
            className="btn btn-primary gap-2"
          >
            <Plus className="w-4 h-4" />
            New Inspection
          </Link>
          <button
            onClick={() =>
              window.open(
                "/api/v1/reports/export?type=csv&reportType=inspections",
                "_blank"
              )
            }
            className="btn btn-outline gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
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
              placeholder="Search inspections..."
              className="input input-bordered"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <select
          className="select select-bordered"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="completed">Completed</option>
          <option value="in_progress">In Progress</option>
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

      {/* Inspections List */}
      {filteredInspections.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardCheck className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
          <h3 className="text-lg font-semibold text-base-content mb-2">
            No inspections found
          </h3>
          <p className="text-base-content/70 mb-6">
            Get started by creating your first safety inspection.
          </p>
          <Link to="/dashboard/inspections/new" className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Create First Inspection
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredInspections.map((inspection) => (
            <div key={inspection.id} className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <ClipboardCheck className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        Safety Inspection - {inspection.site?.name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-base-content/70">
                        <span>By {inspection.createdBy?.name}</span>
                        <span>
                          {new Date(inspection.createdAt).toLocaleDateString()}
                        </span>
                        <span>Version {inspection.version}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(inspection.status)}
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
                            to={`/dashboard/inspections/${inspection.id}`}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </Link>
                        </li>
                        {(user?.role === "ADMIN" ||
                          inspection.createdById === user?.id) && (
                          <li>
                            <Link
                              to={`/dashboard/inspections/${inspection.id}/edit`}
                              className="gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </Link>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Checklist Summary */}
                {inspection.checklist && (
                  <div className="mt-4 p-4 bg-base-200 rounded-lg">
                    <h4 className="font-semibold mb-2">Checklist Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {/* We'll parse and display checklist stats here */}
                      <div className="text-center">
                        <div className="text-lg font-bold text-success">
                          {
                            Object.values(inspection.checklist || {}).filter(
                              (item) => item.checked
                            ).length
                          }
                        </div>
                        <div className="text-base-content/70">Passed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-error">
                          {
                            Object.values(inspection.checklist || {}).filter(
                              (item) => !item.checked && item.required
                            ).length
                          }
                        </div>
                        <div className="text-base-content/70">Failed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-warning">
                          {
                            Object.values(inspection.checklist || {}).filter(
                              (item) => !item.checked && !item.required
                            ).length
                          }
                        </div>
                        <div className="text-base-content/70">N/A</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">
                          {inspection.attachments?.length || 0}
                        </div>
                        <div className="text-base-content/70">Photos</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-base-300">
                  <div className="text-sm text-base-content/70">
                    Last updated:{" "}
                    {new Date(inspection.updatedAt).toLocaleString()}
                  </div>
                  <Link
                    to={`/dashboard/inspections/${inspection.id}`}
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

export default Inspections;
