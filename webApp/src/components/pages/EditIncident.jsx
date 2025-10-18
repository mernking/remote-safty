import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSync } from "../../context/SyncContext";
import { toast } from "react-toastify";
import { ArrowLeft, Save, MapPin, Camera, X } from "lucide-react";

const EditIncident = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToSyncQueue } = useSync();

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [incidentData, setIncidentData] = useState({
    type: "",
    severity: 1,
    description: "",
    location: null,
  });

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
        if (data.incident) {
          setIncident(data.incident);

          // Parse location data
          const location = data.incident.location
            ? JSON.parse(data.incident.location)
            : null;

          setIncidentData({
            type: data.incident.type,
            severity: data.incident.severity,
            description: data.incident.description,
            location: location,
          });
        } else {
          toast.error("Incident data not found");
          navigate("/dashboard/incidents");
        }
      } else {
        toast.error("Incident not found");
        navigate("/dashboard/incidents");
      }
    } catch (error) {
      console.error("Failed to fetch incident:", error);
      toast.error("Failed to load incident");
      navigate("/dashboard/incidents");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    setIncidentData((prev) => ({ ...prev, location: null })); // Clear current location

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          type: "Point",
          coordinates: [position.coords.longitude, position.coords.latitude],
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
        };
        setIncidentData((prev) => ({ ...prev, location }));
        toast.success("Location captured successfully");
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Failed to get location. Please check permissions.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!incidentData.description.trim()) {
      toast.error("Please provide a description");
      return;
    }

    setSaving(true);

    try {
      const updateData = {
        type: incidentData.type,
        severity: incidentData.severity,
        description: incidentData.description.trim(),
        location: incidentData.location,
      };

      // Add to sync queue for offline support
      addToSyncQueue({
        type: "update",
        entity: "Incident",
        payload: { id, ...updateData },
        localId: `incident_update_${Date.now()}`,
      });

      // Try to update immediately if online
      try {
        const response = await fetch(`/api/v1/incidents/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(updateData),
        });

        if (response.ok) {
          toast.success("Incident updated successfully!");
          navigate(`/dashboard/incidents/${id}`);
        } else {
          toast.info("Incident updated locally and will sync when online");
          navigate(`/dashboard/incidents/${id}`);
        }
      } catch {
        toast.info("Incident updated locally and will sync when online");
        navigate(`/dashboard/incidents/${id}`);
      }
    } catch (error) {
      console.error("Error updating incident:", error);
      toast.error("Failed to update incident");
    } finally {
      setSaving(false);
    }
  };

  const incidentTypes = [
    "Near Miss",
    "First Aid Injury",
    "Medical Treatment Injury",
    "Lost Time Injury",
    "Property Damage",
    "Equipment Malfunction",
    "Environmental Spill",
    "Security Incident",
    "Other",
  ];

  const severityLevels = [
    { value: 1, label: "Low - No injury, minor impact" },
    { value: 2, label: "Medium - Minor injury, contained impact" },
    { value: 3, label: "High - Medical attention required" },
    { value: 4, label: "Critical - Lost time injury" },
    { value: 5, label: "Severe - Major injury or fatality" },
  ];

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
        <X className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
        <h3 className="text-lg font-semibold text-base-content mb-2">
          Incident Not Found
        </h3>
        <p className="text-base-content/70 mb-6">
          The requested incident could not be found.
        </p>
        <button
          onClick={() => navigate("/dashboard/incidents")}
          className="btn btn-primary"
        >
          Back to Incidents
        </button>
      </div>
    );
  }

  // Check permissions
  const canEdit = user?.role === "ADMIN" || user?.role === "SAFETY_MANAGER";
  if (!canEdit) {
    return (
      <div className="text-center py-12">
        <X className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
        <h3 className="text-lg font-semibold text-base-content mb-2">
          Access Denied
        </h3>
        <p className="text-base-content/70 mb-6">
          You don't have permission to edit this incident.
        </p>
        <button
          onClick={() => navigate(`/dashboard/incidents/${id}`)}
          className="btn btn-primary"
        >
          Back to Incident
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/dashboard/incidents/${id}`)}
          className="btn btn-ghost btn-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Edit Incident</h1>
          <p className="text-base-content/70">Update incident details</p>
        </div>
      </div>

      {/* Incident Info */}
      <div className="card bg-base-100 shadow-lg mb-6">
        <div className="card-body">
          <h2 className="text-lg font-semibold mb-3">Incident Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Site:</span> {incident.site?.name}
            </div>
            <div>
              <span className="font-semibold">Reported By:</span>{" "}
              {incident.reportedBy?.name}
            </div>
            <div>
              <span className="font-semibold">Date:</span>{" "}
              {new Date(incident.createdAt).toLocaleDateString()}
            </div>
            <div>
              <span className="font-semibold">Version:</span> v
              {incident.version}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Incident Type */}
        <div className="card bg-base-100">
          <div className="card-body">
            <label className="label">
              <span className="label-text font-semibold">Incident Type</span>
            </label>
            <select
              value={incidentData.type}
              onChange={(e) =>
                setIncidentData((prev) => ({ ...prev, type: e.target.value }))
              }
              className="select select-bordered w-full"
            >
              <option value="">Select incident type...</option>
              {incidentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Severity */}
        <div className="card bg-base-100">
          <div className="card-body">
            <label className="label">
              <span className="label-text font-semibold">Severity Level</span>
            </label>
            <div className="space-y-3">
              {severityLevels.map((level) => (
                <label
                  key={level.value}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="severity"
                    value={level.value}
                    checked={incidentData.severity === level.value}
                    onChange={(e) =>
                      setIncidentData((prev) => ({
                        ...prev,
                        severity: parseInt(e.target.value),
                      }))
                    }
                    className="radio radio-primary"
                  />
                  <div className="flex-1">
                    <span className={`font-semibold text-base-content`}>
                      Level {level.value} - {level.label.split(" - ")[0]}
                    </span>
                    <p className="text-sm text-base-content/70">
                      {level.label.split(" - ")[1]}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="card bg-base-100">
          <div className="card-body">
            <label className="label">
              <span className="label-text font-semibold">Description</span>
            </label>
            <textarea
              value={incidentData.description}
              onChange={(e) =>
                setIncidentData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe what happened in detail..."
              className="textarea textarea-bordered w-full h-32"
            />
            <div className="label">
              <span className="label-text-alt text-base-content/60">
                Include what happened, when, where, and any contributing factors
              </span>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card bg-base-100">
          <div className="card-body">
            <label className="label">
              <span className="label-text font-semibold">Location</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={getCurrentLocation}
                className="btn btn-outline gap-2"
              >
                <MapPin className="w-4 h-4" />
                Update Location
              </button>
              {incidentData.location && (
                <div className="alert alert-success alert-sm flex-1">
                  <MapPin className="w-4 h-4" />
                  <span>
                    Location captured (Accuracy: ~
                    {Math.round(incidentData.location.accuracy)}m)
                  </span>
                </div>
              )}
            </div>
            <div className="label">
              <span className="label-text-alt text-base-content/60">
                GPS coordinates will be automatically captured for precise
                incident mapping
              </span>
            </div>
          </div>
        </div>

        {/* Critical Incident Warning */}
        {incidentData.severity >= 4 && (
          <div className="alert alert-error">
            <Camera className="w-6 h-6" />
            <div>
              <h3 className="font-bold">Critical Incident Update</h3>
              <div className="text-sm">
                This incident update will be flagged for immediate safety
                manager review.
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/incidents/${id}`)}
            className="btn btn-outline flex-1"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`btn btn-error flex-1 ${saving ? "loading" : ""}`}
            disabled={saving || !incidentData.description.trim()}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      {/* Version Note */}
      <div className="alert alert-info mt-6">
        <div>
          <h4 className="font-bold">Version Control</h4>
          <div className="text-xs">
            Saving these changes will create a new version of the incident.
            Previous versions are preserved in the audit trail.
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditIncident;
