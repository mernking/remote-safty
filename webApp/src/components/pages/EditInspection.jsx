import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSync } from "../../context/SyncContext";
import { toast } from "react-toastify";
import { ArrowLeft, Save, X } from "lucide-react";

const EditInspection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToSyncQueue } = useSync();

  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checklistItems, setChecklistItems] = useState([]);

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
        if (data.inspection) {
          setInspection(data.inspection);
        } else {
          toast.error("Inspection data not found");
          navigate("/dashboard/inspections");
          return;
        }

        // Convert checklist object to array format for editing
        const checklist = data.inspection.checklist || {};
        const items = [
          {
            id: "ppe",
            name: "Personal Protective Equipment",
            checked: checklist.ppe?.checked || false,
            notes: checklist.ppe?.notes || "",
            required: true,
          },
          {
            id: "fall_protection",
            name: "Fall Protection Systems",
            checked: checklist.fall_protection?.checked || false,
            notes: checklist.fall_protection?.notes || "",
            required: true,
          },
          {
            id: "ladders",
            name: "Ladders and Scaffolding",
            checked: checklist.ladders?.checked || false,
            notes: checklist.ladders?.notes || "",
            required: true,
          },
          {
            id: "electrical",
            name: "Electrical Safety",
            checked: checklist.electrical?.checked || false,
            notes: checklist.electrical?.notes || "",
            required: true,
          },
          {
            id: "machinery",
            name: "Machinery Guards",
            checked: checklist.machinery?.checked || false,
            notes: checklist.machinery?.notes || "",
            required: false,
          },
          {
            id: "chemicals",
            name: "Chemical Storage",
            checked: checklist.chemicals?.checked || false,
            notes: checklist.chemicals?.notes || "",
            required: false,
          },
          {
            id: "emergency",
            name: "Emergency Equipment",
            checked: checklist.emergency?.checked || false,
            notes: checklist.emergency?.notes || "",
            required: true,
          },
          {
            id: "housekeeping",
            name: "Housekeeping",
            checked: checklist.housekeeping?.checked || false,
            notes: checklist.housekeeping?.notes || "",
            required: false,
          },
          {
            id: "lighting",
            name: "Lighting",
            checked: checklist.lighting?.checked || false,
            notes: checklist.lighting?.notes || "",
            required: false,
          },
          {
            id: "exits",
            name: "Emergency Exits",
            checked: checklist.exits?.checked || false,
            notes: checklist.exits?.notes || "",
            required: true,
          },
        ];
        setChecklistItems(items);
      } else {
        toast.error("Inspection not found");
        navigate("/dashboard/inspections");
      }
    } catch (error) {
      console.error("Failed to fetch inspection:", error);
      toast.error("Failed to load inspection");
      navigate("/dashboard/inspections");
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistChange = (id, field, value) => {
    setChecklistItems((items) =>
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Convert checklist array back to object format
      const checklistData = {};
      checklistItems.forEach((item) => {
        checklistData[item.id] = {
          checked: item.checked,
          notes: item.notes,
          name: item.name,
          required: item.required,
        };
      });

      // Determine status based on checklist completion
      let newStatus = "draft";
      const requiredItems = checklistItems.filter((item) => item.required);
      const completedRequiredItems = requiredItems.filter(
        (item) => item.checked
      );

      if (completedRequiredItems.length === requiredItems.length) {
        newStatus = "completed";
      } else if (completedRequiredItems.length > 0) {
        newStatus = "in_progress";
      }

      // Add to sync queue for offline support
      addToSyncQueue({
        type: "update",
        entity: "Inspection",
        payload: { id, checklist: checklistData, status: newStatus },
        localId: `inspection_update_${Date.now()}`,
      });

      // Try to update immediately if online
      try {
        const response = await fetch(`/api/v1/inspections/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ checklist: checklistData, status: newStatus }),
        });

        if (response.ok) {
          toast.success(
            `Inspection updated and marked as ${newStatus.replace("_", " ")}!`
          );
          navigate(`/dashboard/inspections/${id}`);
        } else {
          toast.info("Inspection updated locally and will sync when online");
          navigate(`/dashboard/inspections/${id}`);
        }
      } catch {
        toast.info("Inspection updated locally and will sync when online");
        navigate(`/dashboard/inspections/${id}`);
      }
    } catch (error) {
      console.error("Error updating inspection:", error);
      toast.error("Failed to update inspection");
    } finally {
      setSaving(false);
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
        <X className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
        <h3 className="text-lg font-semibold text-base-content mb-2">
          Inspection Not Found
        </h3>
        <p className="text-base-content/70 mb-6">
          The requested inspection could not be found.
        </p>
        <button
          onClick={() => navigate("/dashboard/inspections")}
          className="btn btn-primary"
        >
          Back to Inspections
        </button>
      </div>
    );
  }

  // Check permissions
  const canEdit = user?.role === "ADMIN" || inspection.createdById === user?.id;
  if (!canEdit) {
    return (
      <div className="text-center py-12">
        <X className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
        <h3 className="text-lg font-semibold text-base-content mb-2">
          Access Denied
        </h3>
        <p className="text-base-content/70 mb-6">
          You don't have permission to edit this inspection.
        </p>
        <button
          onClick={() => navigate(`/dashboard/inspections/${id}`)}
          className="btn btn-primary"
        >
          Back to Inspection
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/dashboard/inspections/${id}`)}
          className="btn btn-ghost btn-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Edit Inspection</h1>
          <p className="text-base-content/70">
            Update safety inspection checklist
          </p>
        </div>
      </div>

      {/* Inspection Info */}
      <div className="card bg-base-100 shadow-lg mb-6">
        <div className="card-body">
          <h2 className="text-lg font-semibold mb-3">Inspection Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Site:</span>{" "}
              {inspection.site?.name}
            </div>
            <div>
              <span className="font-semibold">Inspector:</span>{" "}
              {inspection.createdBy?.name}
            </div>
            <div>
              <span className="font-semibold">Date:</span>{" "}
              {new Date(inspection.createdAt).toLocaleDateString()}
            </div>
            <div>
              <span className="font-semibold">Version:</span> v
              {inspection.version}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title">Safety Checklist</h2>

            <div className="space-y-4">
              {checklistItems.map((item) => (
                <div key={item.id} className="card bg-base-200">
                  <div className="card-body p-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={(e) =>
                          handleChecklistChange(
                            item.id,
                            "checked",
                            e.target.checked
                          )
                        }
                        className="checkbox checkbox-primary mt-1"
                      />
                      <div className="flex-1">
                        <label className="font-semibold flex items-center gap-2 cursor-pointer">
                          {item.name}
                          {item.required && (
                            <span className="text-error">*</span>
                          )}
                        </label>
                        <textarea
                          placeholder="Add notes..."
                          value={item.notes}
                          onChange={(e) =>
                            handleChecklistChange(
                              item.id,
                              "notes",
                              e.target.value
                            )
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
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/inspections/${id}`)}
            className="btn btn-outline flex-1"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`btn btn-primary flex-1 ${saving ? "loading" : ""}`}
            disabled={saving}
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
            Saving these changes will create a new version of the inspection.
            Previous versions are preserved in the audit trail.
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditInspection;
