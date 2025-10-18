import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSync } from "../../context/SyncContext";
import { db, dbHelpers } from "../../db.js";
import {
  MessageSquare,
  Plus,
  Filter,
  Search,
  Eye,
  Users,
  Calendar,
  Database,
} from "lucide-react";

const ToolboxTalks = () => {
  const { user } = useAuth();
  const { isOnline, addToSyncQueue } = useSync();
  const [toolboxTalks, setToolboxTalks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [siteFilter, setSiteFilter] = useState("");
  const [sites, setSites] = useState([]);

  useEffect(() => {
    fetchToolboxTalks();
    loadLocalTalks();
    fetchSites();
  }, [statusFilter, siteFilter]);

  const fetchToolboxTalks = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (siteFilter) params.append("siteId", siteFilter);
      params.append("limit", "50");

      const response = await fetch(`/api/v1/toolbox-talks?${params}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setToolboxTalks(data.toolboxTalks);

        // Sync to local database
        for (const talk of data.toolboxTalks) {
          await db.toolboxTalks.put(talk);
        }
      } else if (!isOnline) {
        // Load from local database if offline
        await loadLocalTalks();
      }
    } catch (error) {
      console.error("Failed to fetch toolbox talks:", error);
      // Fallback to local data
      await loadLocalTalks();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalTalks = async () => {
    try {
      const localData = await db.toolboxTalks.toArray();
      if (!isOnline || toolboxTalks.length === 0) {
        setToolboxTalks(localData);
      }
    } catch (error) {
      console.error("Failed to load local toolbox talks:", error);
    }
  };

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

  const filteredTalks = toolboxTalks.filter((talk) => {
    const matchesSearch =
      talk.site?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      talk.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      talk.agenda?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      talk.createdBy?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: { color: "badge-info", text: "Scheduled" },
      completed: { color: "badge-success", text: "Completed" },
      cancelled: { color: "badge-neutral", text: "Cancelled" },
    };
    const config = statusConfig[status] || {
      color: "badge-neutral",
      text: status,
    };
    return <span className={`badge ${config.color}`}>{config.text}</span>;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return "border-l-info bg-info/5";
      case "completed":
        return "border-l-success bg-success/5";
      case "cancelled":
        return "border-l-neutral bg-neutral/5";
      default:
        return "border-l-base-content/20";
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">
            Toolbox Talks
            {!isOnline && (
              <span className="ml-2 badge badge-warning badge-sm">
                <Database className="w-3 h-3 mr-1" />
                Offline
              </span>
            )}
          </h1>
          <p className="text-base-content/70 mt-2">
            Safety discussions and training sessions.
            {!isOnline && " Working offline - changes will sync when online."}
          </p>
        </div>

        <Link
          to="/dashboard/toolbox-talks/new"
          className="btn btn-secondary gap-2"
        >
          <Plus className="w-4 h-4" />
          New Toolbox Talk
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
              placeholder="Search toolbox talks..."
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
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
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

      {/* Upcoming Talks Alert */}
      {filteredTalks.some(
        (talk) =>
          talk.status === "scheduled" &&
          talk.scheduledAt &&
          new Date(talk.scheduledAt) > new Date() &&
          new Date(talk.scheduledAt) <
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      ) && (
        <div className="alert alert-info">
          <Calendar className="w-6 h-6" />
          <div>
            <h3 className="font-bold">Upcoming Toolbox Talks</h3>
            <div className="text-xs">
              {
                filteredTalks.filter(
                  (talk) =>
                    talk.status === "scheduled" &&
                    talk.scheduledAt &&
                    new Date(talk.scheduledAt) > new Date() &&
                    new Date(talk.scheduledAt) <
                      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                ).length
              }{" "}
              toolbox talks scheduled for the next week.
            </div>
          </div>
        </div>
      )}

      {/* Toolbox Talks List */}
      {filteredTalks.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
          <h3 className="text-lg font-semibold text-base-content mb-2">
            No toolbox talks found
          </h3>
          <p className="text-base-content/70 mb-6">
            Start creating toolbox talks to improve safety communication.
          </p>
          <Link to="/dashboard/toolbox-talks/new" className="btn btn-secondary">
            <Plus className="w-4 h-4 mr-2" />
            Create First Talk
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTalks.map((talk) => (
            <div
              key={talk.id}
              className={`card bg-base-100 shadow-lg border-l-4 ${getStatusColor(
                talk.status
              )}`}
            >
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-secondary/10 rounded-lg">
                      <MessageSquare className="w-6 h-6 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{talk.title}</h3>
                        {getStatusBadge(talk.status)}
                      </div>

                      <p className="text-base-content/80 mb-3 line-clamp-2">
                        {talk.agenda}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-base-content/70">
                        <span>Created by {talk.createdBy?.name}</span>
                        <span>Site: {talk.site?.name}</span>
                        {talk.scheduledAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(talk.scheduledAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {talk.completedAt && (
                          <span>
                            Completed:{" "}
                            {new Date(talk.completedAt).toLocaleDateString()}
                          </span>
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
                          to={`/dashboard/toolbox-talks/${talk.id}`}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </Link>
                      </li>
                      {(user?.role === "ADMIN" ||
                        talk.createdById === user?.id) && (
                        <li>
                          <Link
                            to={`/dashboard/toolbox-talks/${talk.id}/edit`}
                            className="gap-2"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Edit
                          </Link>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Attendees */}
                {talk.attendees && (
                  <div className="mt-4 pt-4 border-t border-base-300">
                    <div className="flex items-center gap-2 text-sm text-base-content/70">
                      <Users className="w-4 h-4" />
                      <span>
                        {Array.isArray(talk.attendees)
                          ? talk.attendees.length
                          : JSON.parse(talk.attendees || "[]").length}{" "}
                        attendee
                        {Array.isArray(talk.attendees)
                          ? talk.attendees.length
                          : JSON.parse(talk.attendees || "[]").length > 1
                          ? "s"
                          : ""}
                      </span>
                    </div>
                  </div>
                )}

                {/* Attachments indicator */}
                {talk.attachments && talk.attachments.length > 0 && (
                  <div className="mt-2">
                    <div className="badge badge-neutral badge-sm">
                      {talk.attachments.length} attachment
                      {talk.attachments.length > 1 ? "s" : ""}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-base-300">
                  <div className="text-sm text-base-content/70">
                    Last updated: {new Date(talk.updatedAt).toLocaleString()}
                  </div>
                  <Link
                    to={`/dashboard/toolbox-talks/${talk.id}`}
                    className="btn btn-secondary btn-sm"
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

export default ToolboxTalks;
