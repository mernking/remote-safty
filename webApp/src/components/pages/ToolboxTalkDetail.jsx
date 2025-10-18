import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Edit,
  Download,
  Eye,
  MessageSquare,
  User,
  Calendar,
  Users,
  FileText,
  Clock,
} from "lucide-react";

const ToolboxTalkDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [toolboxTalk, setToolboxTalk] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchToolboxTalk();
  }, [id]);

  const fetchToolboxTalk = async () => {
    try {
      const response = await fetch(`/api/v1/toolbox-talks/${id}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setToolboxTalk(data.toolboxTalk);
      } else if (response.status === 404) {
        toast.error("Toolbox talk not found");
        navigate("/dashboard/toolbox-talks");
      } else {
        toast.error("Failed to load toolbox talk");
      }
    } catch (error) {
      console.error("Failed to fetch toolbox talk:", error);
      toast.error("Failed to load toolbox talk");
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

  const getAttendeesList = () => {
    if (!toolboxTalk?.attendees) return [];
    try {
      return Array.isArray(toolboxTalk.attendees)
        ? toolboxTalk.attendees
        : JSON.parse(toolboxTalk.attendees);
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!toolboxTalk) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
        <h3 className="text-lg font-semibold text-base-content mb-2">
          Toolbox Talk Not Found
        </h3>
        <p className="text-base-content/70 mb-6">
          The requested toolbox talk could not be found.
        </p>
        <Link to="/dashboard/toolbox-talks" className="btn btn-primary">
          Back to Toolbox Talks
        </Link>
      </div>
    );
  }

  const attendees = getAttendeesList();
  const canEdit =
    user?.role === "ADMIN" || toolboxTalk.createdById === user?.id;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/dashboard/toolbox-talks")}
          className="btn btn-ghost btn-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Toolbox Talk Details</h1>
          <p className="text-base-content/70">
            Safety discussion session details
          </p>
        </div>

        <div className="flex gap-2">
          {canEdit && (
            <Link
              to={`/dashboard/toolbox-talks/${id}/edit`}
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

      {/* Status and Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-secondary">
              {attendees.length}
            </div>
            <div className="text-sm text-base-content/70">Attendees</div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-lg">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-primary">
              {toolboxTalk.attachments?.length || 0}
            </div>
            <div className="text-sm text-base-content/70">Attachments</div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-lg">
          <div className="card-body text-center">
            <div
              className={`text-2xl font-bold ${
                toolboxTalk.status === "completed"
                  ? "text-success"
                  : toolboxTalk.status === "scheduled"
                  ? "text-info"
                  : "text-base-content"
              }`}
            >
              {toolboxTalk.status === "completed"
                ? "✓"
                : toolboxTalk.status === "scheduled"
                ? "⏰"
                : toolboxTalk.status}
            </div>
            <div className="text-sm text-base-content/70">Status</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Talk Information */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="w-8 h-8 text-secondary" />
                <div>
                  <h2 className="card-title">{toolboxTalk.title}</h2>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(toolboxTalk.status)}
                    <span className="text-sm text-base-content/70">
                      Created{" "}
                      {new Date(toolboxTalk.createdAt).toLocaleDateString()}
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
                      <FileText className="w-4 h-4 text-base-content/60" />
                      <span>{toolboxTalk.site?.name}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-base-content/70 uppercase tracking-wide">
                      Created By
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-base-content/60" />
                      <span>{toolboxTalk.createdBy?.name}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-semibold text-base-content/70 uppercase tracking-wide">
                      Schedule
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-base-content/60" />
                      <span>
                        {toolboxTalk.scheduledAt
                          ? new Date(toolboxTalk.scheduledAt).toLocaleString()
                          : "Not scheduled"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-base-content/70 uppercase tracking-wide">
                      Version
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-4 h-4 text-base-content/60" />
                      <span>v{toolboxTalk.version}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Agenda */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title">Discussion Agenda</h2>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{toolboxTalk.agenda}</p>
              </div>
            </div>
          </div>

          {/* Attendees */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2">
                <Users className="w-5 h-5" />
                Attendees ({attendees.length})
              </h2>

              {attendees.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {attendees.map((attendee, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-base-200 rounded-lg"
                    >
                      <User className="w-4 h-4 text-base-content/60" />
                      <span className="text-sm">{attendee}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-base-content/70">No attendees specified</p>
              )}
            </div>
          </div>

          {/* Attachments */}
          {toolboxTalk.attachments && toolboxTalk.attachments.length > 0 && (
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title">Supporting Materials</h2>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {toolboxTalk.attachments.map((attachment) => (
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
                                <MessageSquare className="w-8 h-8" />
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
                  to={`/dashboard/toolbox-talks/new?site=${toolboxTalk.siteId}`}
                  className="btn btn-outline btn-secondary btn-sm w-full justify-start gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  New Toolbox Talk
                </Link>

                <Link
                  to={`/dashboard/inspections/new?site=${toolboxTalk.siteId}`}
                  className="btn btn-outline btn-sm w-full justify-start gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Conduct Inspection
                </Link>

                <button className="btn btn-outline btn-sm w-full justify-start gap-2">
                  <FileText className="w-4 h-4" />
                  Generate Report
                </button>
              </div>
            </div>
          </div>

          {/* Completion Status */}
          {toolboxTalk.status === "completed" && toolboxTalk.completedAt && (
            <div className="card bg-success/10 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-lg text-success">Completed</h2>
                <p className="text-sm">
                  This toolbox talk was completed on{" "}
                  {new Date(toolboxTalk.completedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* Scheduled Reminder */}
          {toolboxTalk.status === "scheduled" && toolboxTalk.scheduledAt && (
            <div className="card bg-info/10 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-lg text-info">Scheduled</h2>
                <p className="text-sm">
                  This toolbox talk is scheduled for{" "}
                  {new Date(toolboxTalk.scheduledAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Audit Trail */}
          {toolboxTalk.auditLogs && toolboxTalk.auditLogs.length > 0 && (
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-lg">Audit Trail</h2>

                <div className="space-y-3">
                  {toolboxTalk.auditLogs.map((log) => (
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
        </div>
      </div>
    </div>
  );
};

export default ToolboxTalkDetail;
