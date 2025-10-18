import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Edit,
  Download,
  Eye,
  FileText,
  MapPin,
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Camera,
} from "lucide-react";

const InspectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInspection();
  }, [id]);

  const fetchInspection = async () => {
    try {
      const response = await fetch(`/api/v1/inspections/${id}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setInspection(data.inspection);
      } else if (response.status === 404) {
        toast.error("Inspection not found");
        navigate("/dashboard/inspections");
      } else {
        toast.error("Failed to load inspection");
      }
    } catch (error) {
      console.error("Failed to fetch inspection:", error);
      toast.error("Failed to load inspection");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
        <h3 className="text-lg font-semibold text-base-content mb-2">
          Inspection Not Found
        </h3>
        <p className="text-base-content/70 mb-6">
          The requested inspection could not be found.
        </p>
        <Link to="/dashboard/inspections" className="btn btn-primary">
          Back to Inspections
        </Link>
      </div>
    );
  }

  const canEdit = user?.role === "ADMIN" || inspection.createdById === user?.id;
  const checklist = inspection.checklist || {};
  const passedCount = Object.values(checklist).filter(
    (item) => item.checked
  ).length;
  const totalCount = Object.keys(checklist).length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/dashboard/inspections")}
          className="btn btn-ghost btn-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Inspection Details</h1>
          <p className="text-base-content/70">Safety inspection record</p>
        </div>

        <div className="flex gap-2">
          {canEdit && (
            <Link
              to={`/dashboard/inspections/${id}/edit`}
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
            <div className="text-2xl font-bold text-primary">{totalCount}</div>
            <div className="text-sm text-base-content/70">Total Items</div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-lg">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-success">{passedCount}</div>
            <div className="text-sm text-base-content/70">Passed</div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-lg">
          <div className="card-body text-center">
            <div
              className={`text-2xl font-bold ${
                inspection.status === "completed"
                  ? "text-success"
                  : inspection.status === "draft"
                  ? "text-warning"
                  : "text-info"
              }`}
            >
              {inspection.status === "completed"
                ? "✓"
                : inspection.status === "draft"
                ? "Draft"
                : inspection.status}
            </div>
            <div className="text-sm text-base-content/70">Status</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title">Inspection Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-semibold text-base-content/70 uppercase tracking-wide">
                      Site
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-base-content/60" />
                      <span>{inspection.site?.name}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-base-content/70 uppercase tracking-wide">
                      Inspector
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-base-content/60" />
                      <span>{inspection.createdBy?.name}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-semibold text-base-content/70 uppercase tracking-wide">
                      Date
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-base-content/60" />
                      <span>
                        {new Date(inspection.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-base-content/70 uppercase tracking-wide">
                      Version
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-4 h-4 text-base-content/60" />
                      <span>v{inspection.version}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title">Safety Checklist</h2>

              <div className="space-y-3">
                {Object.entries(checklist).map(([key, item]) => (
                  <div
                    key={key}
                    className="flex items-start gap-3 p-3 bg-base-200 rounded-lg"
                  >
                    <div
                      className={`mt-0.5 ${
                        item.checked ? "text-success" : "text-error"
                      }`}
                    >
                      {item.checked ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="font-semibold capitalize">
                        {item.name || key.replace(/_/g, " ")}
                        {item.required && (
                          <span className="text-error ml-1">*</span>
                        )}
                      </div>

                      {item.notes && (
                        <div className="text-sm text-base-content/70 mt-1">
                          {item.notes}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <span
                          className={`badge badge-sm ${
                            item.checked ? "badge-success" : "badge-error"
                          }`}
                        >
                          {item.checked ? "Passed" : "Failed"}
                        </span>
                        {item.required && (
                          <span className="badge badge-neutral badge-sm">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Attachments */}
          {inspection.attachments && inspection.attachments.length > 0 && (
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title">Attachments</h2>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {inspection.attachments.map((attachment) => (
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

        {/* Right Column - Audit Trail */}
        <div className="space-y-6">
          {/* Audit Log */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-lg">Audit Trail</h2>

              {inspection.auditLogs && inspection.auditLogs.length > 0 ? (
                <div className="space-y-3">
                  {inspection.auditLogs.map((log) => (
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
              ) : (
                <p className="text-sm text-base-content/70">
                  No audit logs available
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-lg">Quick Actions</h2>

              <div className="space-y-2">
                <Link
                  to={`/dashboard/inspections/new?site=${inspection.siteId}`}
                  className="btn btn-outline btn-sm w-full justify-start gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  New Inspection
                </Link>

                <Link
                  to={`/dashboard/incidents/new?site=${inspection.siteId}`}
                  className="btn btn-outline btn-error btn-sm w-full justify-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Report Incident
                </Link>

                <Link
                  to={`/dashboard/toolbox-talks/new?site=${inspection.siteId}`}
                  className="btn btn-outline btn-secondary btn-sm w-full justify-start gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Toolbox Talk
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspectionDetail;
