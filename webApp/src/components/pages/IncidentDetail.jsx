import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Edit,
  Download,
  Eye,
  MapPin,
  User,
  Calendar,
  AlertTriangle,
  FileText,
  Camera,
  Clock,
} from "lucide-react";

const IncidentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncident();
  }, [id]);

  const fetchIncident = async () => {
    try {
      const response = await fetch(`/api/v1/incidents/${id}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setIncident(data.incident);
      } else if (response.status === 404) {
        toast.error("Incident not found");
        navigate("/dashboard/incidents");
      } else {
        toast.error("Failed to load incident");
      }
    } catch (error) {
      console.error("Failed to fetch incident:", error);
      toast.error("Failed to load incident");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAttachment = async (attachmentId, filename) => {
    try {
      const response = await fetch(`/api/v1/attachments/${attachmentId}`, {
        credentials: "include",
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        toast.error("Failed to download attachment");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download attachment");
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
        <h3 className="text-lg font-semibold text-base-content mb-2">
          Incident Not Found
        </h3>
        <p className="text-base-content/70 mb-6">
          The requested incident could not be found.
        </p>
        <Link to="/dashboard/incidents" className="btn btn-primary">
          Back to Incidents
        </Link>
      </div>
    );
  }

  const canEdit = user?.role === "ADMIN" || user?.role === "SAFETY_MANAGER";
  const location = incident?.location ? JSON.parse(incident.location) : null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/dashboard/incidents")}
          className="btn btn-ghost btn-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Incident Details</h1>
          <p className="text-base-content/70">Safety incident report</p>
        </div>

        <div className="flex gap-2">
          {canEdit && (
            <Link
              to={`/dashboard/incidents/${id}/edit`}
              className="btn btn-outline gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
          )}
          <button className="btn btn-outline gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Severity Alert */}
      {incident.severity >= 4 && (
        <div className="alert alert-error mb-6">
          <AlertTriangle className="w-6 h-6" />
          <div>
            <h3 className="font-bold">
              Critical Incident - Immediate Attention Required
            </h3>
            <div className="text-sm">
              This incident has been flagged for immediate safety manager review
              and may require additional follow-up actions.
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incident Information */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle
                  className={`w-8 h-8 ${
                    incident.severity >= 4
                      ? "text-error"
                      : incident.severity >= 3
                      ? "text-warning"
                      : "text-info"
                  }`}
                />
                <div>
                  <h2 className="card-title">{incident.type}</h2>
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(incident.severity)}
                    <span className="text-sm text-base-content/70">
                      Reported{" "}
                      {new Date(incident.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-semibold text-base-content/70 uppercase tracking-wide">
                      Site
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-base-content/60" />
                      <span>{incident.site?.name}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-base-content/70 uppercase tracking-wide">
                      Reported By
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-base-content/60" />
                      <span>{incident.reportedBy?.name}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-semibold text-base-content/70 uppercase tracking-wide">
                      Date & Time
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-base-content/60" />
                      <span>
                        {new Date(incident.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-base-content/70 uppercase tracking-wide">
                      Version
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-4 h-4 text-base-content/60" />
                      <span>v{incident.version}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title">Description</h2>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{incident.description}</p>
              </div>
            </div>
          </div>

          {/* Location */}
          {location && (
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title">Location</h2>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-semibold">GPS Coordinates</div>
                    <div className="text-sm text-base-content/70">
                      {location.coordinates[1].toFixed(6)},{" "}
                      {location.coordinates[0].toFixed(6)}
                    </div>
                    <div className="text-sm text-base-content/70">
                      Accuracy: ~{Math.round(location.accuracy)} meters
                    </div>
                    <div className="text-xs text-base-content/50 mt-1">
                      Captured: {new Date(location.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Attachments */}
          {incident.attachments && incident.attachments.length > 0 && (
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title">Attachments</h2>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {incident.attachments.map((attachment) => (
                    <div key={attachment.id} className="card bg-base-200">
                      <div className="card-body p-3">
                        {attachment.mimeType?.startsWith("image/") ? (
                          <div className="space-y-3">
                            {/* Image Preview */}
                            <div className="aspect-video bg-base-300 rounded-lg overflow-hidden">
                              <img
                                src={`/api/v1/attachments/${attachment.id}`}
                                alt={attachment.filename}
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => window.open(`/api/v1/attachments/${attachment.id}`, '_blank')}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="w-full h-full flex items-center justify-center text-base-content/50 hidden">
                                <Camera className="w-8 h-8" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm truncate">
                                {attachment.filename}
                              </div>
                              <div className="text-xs text-base-content/70">
                                {(attachment.size / 1024).toFixed(1)} KB
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <FileText className="w-8 h-8 text-secondary" />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm truncate">
                                {attachment.filename}
                              </div>
                              <div className="text-xs text-base-content/70">
                                {(attachment.size / 1024).toFixed(1)} KB
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="card-actions justify-end mt-2">
                          <button
                            onClick={() =>
                              handleDownloadAttachment(
                                attachment.id,
                                attachment.filename
                              )
                            }
                            className="btn btn-primary btn-xs"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Actions & Audit */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-lg">Follow-up Actions</h2>

              <div className="space-y-2">
                <Link
                  to={`/dashboard/inspections/new?site=${incident.siteId}`}
                  className="btn btn-outline btn-sm w-full justify-start gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Conduct Inspection
                </Link>

                <Link
                  to={`/dashboard/toolbox-talks/new?site=${incident.siteId}`}
                  className="btn btn-outline btn-secondary btn-sm w-full justify-start gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Safety Discussion
                </Link>

                <button className="btn btn-outline btn-sm w-full justify-start gap-2">
                  <FileText className="w-4 h-4" />
                  Generate CAPA Report
                </button>
              </div>
            </div>
          </div>

          {/* Audit Trail */}
          {incident.auditLogs && incident.auditLogs.length > 0 && (
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-lg">Audit Trail</h2>

                <div className="space-y-3">
                  {incident.auditLogs.map((log) => (
                    <div key={log.id} className="text-sm">
                      <div className="font-semibold capitalize">
                        {log.action}
                      </div>
                      <div className="text-base-content/70">
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                      {log.user && (
                        <div className="text-base-content/70">
                          by {log.user.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Incident Statistics */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-lg">Incident Stats</h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Severity Level</span>
                  {getSeverityBadge(incident.severity)}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm">Response Time</span>
                  <span className="text-sm font-semibold">
                    {Math.floor(
                      (new Date() - new Date(incident.createdAt)) / (1000 * 60)
                    )}{" "}
                    min
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm">Attachments</span>
                  <span className="text-sm font-semibold">
                    {incident.attachments?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetail;
