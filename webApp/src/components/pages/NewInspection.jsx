import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSync } from "../../context/SyncContext";
import { toast } from "react-toastify";
import { ArrowLeft, Camera, Plus, X, CheckCircle } from "lucide-react";

const NewInspection = () => {
  const { user } = useAuth();
  const { addToSyncQueue } = useSync();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const siteFromUrl = searchParams.get("site");

  const [step, setStep] = useState(siteFromUrl ? 2 : 1); // 1: Site Selection, 2: Checklist, 3: Review
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(siteFromUrl || "");
  const [checklistItems, setChecklistItems] = useState([
    {
      id: "ppe",
      name: "Personal Protective Equipment",
      checked: false,
      notes: "",
      required: true,
    },
    {
      id: "fall_protection",
      name: "Fall Protection Systems",
      checked: false,
      notes: "",
      required: true,
    },
    {
      id: "ladders",
      name: "Ladders and Scaffolding",
      checked: false,
      notes: "",
      required: true,
    },
    {
      id: "electrical",
      name: "Electrical Safety",
      checked: false,
      notes: "",
      required: true,
    },
    {
      id: "machinery",
      name: "Machinery Guards",
      checked: false,
      notes: "",
      required: false,
    },
    {
      id: "chemicals",
      name: "Chemical Storage",
      checked: false,
      notes: "",
      required: false,
    },
    {
      id: "emergency",
      name: "Emergency Equipment",
      checked: false,
      notes: "",
      required: true,
    },
    {
      id: "housekeeping",
      name: "Housekeeping",
      checked: false,
      notes: "",
      required: false,
    },
    {
      id: "lighting",
      name: "Lighting",
      checked: false,
      notes: "",
      required: false,
    },
    {
      id: "exits",
      name: "Emergency Exits",
      checked: false,
      notes: "",
      required: true,
    },
  ]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const handleChecklistChange = (id, field, value) => {
    setChecklistItems((items) =>
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
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

  const validateStep = () => {
    switch (step) {
      case 1:
        return selectedSite !== "";
      case 2: {
        // Allow users to proceed even if they haven't checked all boxes
        // They can check items they know about and leave notes for others
        return true;
      }
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    } else {
      toast.error("Please complete all required fields");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // Prepare checklist data
      const checklistData = {};
      checklistItems.forEach((item) => {
        checklistData[item.id] = {
          checked: item.checked,
          notes: item.notes,
          name: item.name,
          required: item.required,
        };
      });

      // Create inspection data
      const inspectionData = {
        siteId: selectedSite,
        checklist: checklistData,
        status: "completed",
        attachments: attachments.map((att) => ({
          filename: att.name,
          mimeType: att.type,
          size: att.size,
        })),
      };

      // Add to sync queue for offline support
      addToSyncQueue({
        type: "create",
        entity: "Inspection",
        payload: inspectionData,
        localId: `inspection_${Date.now()}`,
      });

      // Try to submit immediately if online
      try {
        const response = await fetch("/api/v1/inspections", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(inspectionData),
        });

        if (response.ok) {
          const data = await response.json();
          toast.success("Inspection created successfully!");
          navigate(`/dashboard/inspections/${data.inspection.id}`);
        } else {
          toast.info("Inspection saved locally and will sync when online");
          navigate("/dashboard/inspections");
        }
      } catch {
        toast.info("Inspection saved locally and will sync when online");
        navigate("/dashboard/inspections");
      }
    } catch (error) {
      console.error("Error creating inspection:", error);
      toast.error("Failed to create inspection");
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            step >= 1
              ? "bg-primary text-primary-content"
              : "bg-base-300 text-base-content/50"
          }`}
        >
          1
        </div>
        <div
          className={`w-12 h-0.5 ${step >= 2 ? "bg-primary" : "bg-base-300"}`}
        />
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            step >= 2
              ? "bg-primary text-primary-content"
              : "bg-base-300 text-base-content/50"
          }`}
        >
          2
        </div>
        <div
          className={`w-12 h-0.5 ${step >= 3 ? "bg-primary" : "bg-base-300"}`}
        />
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            step >= 3
              ? "bg-primary text-primary-content"
              : "bg-base-300 text-base-content/50"
          }`}
        >
          3
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Select Site</h2>
        <p className="text-base-content/70">
          Choose the jobsite location for this inspection.
        </p>
      </div>

      <div className="grid gap-4">
        {sites.map((site) => (
          <div
            key={site.id}
            className={`card cursor-pointer transition-all ${
              selectedSite === site.id
                ? "bg-primary/10 border-primary"
                : "bg-base-100 hover:bg-base-200"
            }`}
            onClick={() => setSelectedSite(site.id)}
          >
            <div className="card-body p-4">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="site"
                  checked={selectedSite === site.id}
                  onChange={() => setSelectedSite(site.id)}
                  className="radio radio-primary"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{site.name}</h3>
                  {site.address && (
                    <p className="text-sm text-base-content/70">
                      {site.address}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Safety Checklist</h2>
        <p className="text-base-content/70">
          Complete the safety inspection checklist.
        </p>
      </div>

      <div className="space-y-4">
        {checklistItems.map((item) => (
          <div key={item.id} className="card bg-base-100">
            <div className="card-body p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) =>
                    handleChecklistChange(item.id, "checked", e.target.checked)
                  }
                  className="checkbox checkbox-primary mt-1"
                />
                <div className="flex-1">
                  <label className="font-semibold flex items-center gap-2">
                    {item.name}
                    {item.required && <span className="text-error">*</span>}
                  </label>
                  <textarea
                    placeholder="Add notes (optional)"
                    value={item.notes}
                    onChange={(e) =>
                      handleChecklistChange(item.id, "notes", e.target.value)
                    }
                    className="textarea textarea-bordered textarea-sm w-full mt-2"
                    rows="2"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Review & Submit</h2>
        <p className="text-base-content/70">
          Review your inspection details before submitting.
        </p>
      </div>

      {/* Site Summary */}
      <div className="card bg-base-100">
        <div className="card-body">
          <h3 className="font-semibold mb-3">Site Information</h3>
          <div className="text-sm">
            <p>
              <strong>Site:</strong>{" "}
              {sites.find((s) => s.id === selectedSite)?.name}
            </p>
            <p>
              <strong>Inspector:</strong> {user?.name || user?.email}
            </p>
            <p>
              <strong>Date:</strong> {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Checklist Summary */}
      <div className="card bg-base-100">
        <div className="card-body">
          <h3 className="font-semibold mb-3">Checklist Summary</h3>
          <div className="space-y-2">
            {checklistItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <span className={item.checked ? "text-success" : "text-error"}>
                  {item.checked ? "✓" : "✗"} {item.name}
                </span>
                {item.notes && (
                  <span className="text-base-content/70 truncate max-w-xs">
                    {item.notes}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="card bg-base-100">
          <div className="card-body">
            <h3 className="font-semibold mb-3">
              Attachments ({attachments.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                    onClick={() => removeAttachment(att.id)}
                    className="btn btn-circle btn-xs absolute -top-2 -right-2 bg-error text-error-content border-error"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <p className="text-xs truncate mt-1">{att.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Photos */}
      <div className="card bg-base-100">
        <div className="card-body">
          <h3 className="font-semibold mb-3">Add Photos</h3>
          <div className="flex gap-4">
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
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() =>
            step > 1 ? setStep(step - 1) : navigate("/dashboard/inspections")
          }
          className="btn btn-ghost btn-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">New Inspection</h1>
          <p className="text-base-content/70">Create a new safety inspection</p>
        </div>
      </div>

      {/* Progress Indicator */}
      {renderStepIndicator()}

      {/* Step Content */}
      <div className="mb-8">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() =>
            step > 1 ? setStep(step - 1) : navigate("/dashboard/inspections")
          }
          className="btn btn-outline"
        >
          {step === 1 ? "Cancel" : "Back"}
        </button>

        {step < 3 ? (
          <button onClick={handleNext} className="btn btn-primary">
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className={`btn btn-primary ${loading ? "loading" : ""}`}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Inspection"}
          </button>
        )}
      </div>
    </div>
  );
};

export default NewInspection;
