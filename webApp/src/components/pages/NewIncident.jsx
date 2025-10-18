import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSync } from "../../context/SyncContext";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Camera,
  MapPin,
  Plus,
  X,
  AlertTriangle,
} from "lucide-react";

const NewIncident = () => {
  const { user } = useAuth();
  const { addToSyncQueue } = useSync();
  const navigate = useNavigate();
  const { siteId } = useParams();
  const [searchParams] = useSearchParams();

  const siteFromUrl = siteId || searchParams.get("site");

  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(siteFromUrl || "");
  const [incidentData, setIncidentData] = useState({
    type: "",
    severity: 1,
    description: "",
    location: null,
  });
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const response = await fetch("/api/v1/sites", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setSites(data.sites);
      }
    } catch (error) {
      console.error("Failed to fetch sites:", error);
      toast.error("Failed to load sites");
    }
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser");
      setGettingLocation(false);
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
        setGettingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Failed to get location. Please check permissions.");
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newAttachments = files.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      type: file.type,
      size: file.size,
      preview: URL.createObjectURL(file),
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => {
      const attachment = prev.find((a) => a.id === id);
      if (attachment?.preview) {
        URL.revokeObjectURL(attachment.preview);
      }
      return prev.filter((a) => a.id !== id);
    });
  };

  const validateForm = () => {
    return selectedSite && incidentData.type && incidentData.description.trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        siteId: selectedSite,
        type: incidentData.type,
        severity: incidentData.severity,
        description: incidentData.description,
        location: incidentData.location,
        attachments: attachments.map((att) => ({
          filename: att.name,
          mimeType: att.type,
          size: att.size,
        })),
      };

      // Add to sync queue for offline support
      addToSyncQueue({
        type: "create",
        entity: "Incident",
        payload: submitData,
        localId: `incident_${Date.now()}`,
      });

      // Try to submit immediately if online
      try {
        const response = await fetch("/api/v1/incidents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(submitData),
        });

        if (response.ok) {
          const data = await response.json();
          toast.success("Incident reported successfully!");

          // Send notification for high-severity incidents
          if (incidentData.severity >= 4) {
            const site = sites.find((s) => s.id === selectedSite);
            toast.warning(
              `High-severity incident reported at ${site?.name}. Safety manager has been notified.`,
              {
                autoClose: 10000,
              }
            );
          }

          navigate(`/dashboard/incidents/${data.incident.id}`);
        } else {
          toast.info("Incident saved locally and will sync when online");
          navigate("/dashboard/incidents");
        }
      } catch {
        toast.info("Incident saved locally and will sync when online");
        navigate("/dashboard/incidents");
      }
    } catch (error) {
      console.error("Error reporting incident:", error);
      toast.error("Failed to report incident");
    } finally {
      setLoading(false);
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
    { value: 1, label: "Low - No injury, minor impact", color: "text-info" },
    {
      value: 2,
      label: "Medium - Minor injury, contained impact",
      color: "text-warning",
    },
    {
      value: 3,
      label: "High - Medical attention required",
      color: "text-warning",
    },
    { value: 4, label: "Critical - Lost time injury", color: "text-error" },
    {
      value: 5,
      label: "Severe - Major injury or fatality",
      color: "text-error",
    },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/dashboard/incidents")}
          className="btn btn-ghost btn-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Report Incident</h1>
          <p className="text-base-content/70">
            Report a safety incident or near-miss
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Site Selection */}
        <div className="card bg-base-100">
          <div className="card-body">
            <label className="label">
              <span className="label-text font-semibold">
                Site Location <span className="text-error">*</span>
              </span>
            </label>
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="select select-bordered w-full"
              required
            >
              <option value="">Select a site...</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Incident Type */}
        <div className="card bg-base-100">
          <div className="card-body">
            <label className="label">
              <span className="label-text font-semibold">
                Incident Type <span className="text-error">*</span>
              </span>
            </label>
            <select
              value={incidentData.type}
              onChange={(e) =>
                setIncidentData((prev) => ({ ...prev, type: e.target.value }))
              }
              className="select select-bordered w-full"
              required
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
                    <span className={`font-semibold ${level.color}`}>
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
              <span className="label-text font-semibold">
                Description <span className="text-error">*</span>
              </span>
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
              required
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
                disabled={gettingLocation}
                className={`btn btn-outline gap-2 ${
                  gettingLocation ? "loading" : ""
                }`}
              >
                <MapPin className="w-4 h-4" />
                {gettingLocation ? "Getting Location..." : "Capture Location"}
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

        {/* Attachments */}
        <div className="card bg-base-100">
          <div className="card-body">
            <label className="label">
              <span className="label-text font-semibold">
                Photos & Evidence
              </span>
            </label>

            {attachments.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {attachments.map((att) => (
                  <div key={att.id} className="relative">
                    {att.type.startsWith("image/") ? (
                      <img
                        src={att.preview}
                        alt={att.name}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-24 bg-base-200 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">📄</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="btn btn-circle btn-xs absolute -top-2 -right-2 bg-error text-error-content border-error"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <p className="text-xs truncate mt-1">{att.name}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <label className="btn btn-outline gap-2">
                <Camera className="w-4 h-4" />
                Take Photo
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <label className="btn btn-outline gap-2">
                <Plus className="w-4 h-4" />
                Upload Files
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Emergency Notice for High Severity */}
        {incidentData.severity >= 4 && (
          <div className="alert alert-error">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <h3 className="font-bold">High Severity Incident</h3>
              <div className="text-sm">
                This incident will be flagged for immediate safety manager
                review and may require additional follow-up actions.
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate("/dashboard/incidents")}
            className="btn btn-outline flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!validateForm() || loading}
            className={`btn btn-error flex-1 ${loading ? "loading" : ""}`}
          >
            {loading ? "Reporting..." : "Report Incident"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewIncident;
