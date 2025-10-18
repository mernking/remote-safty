import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSync } from "../../context/SyncContext";
import { toast } from "react-toastify";
import { ArrowLeft, Save, X, Users } from "lucide-react";

const EditToolboxTalk = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToSyncQueue } = useSync();

  const [toolboxTalk, setToolboxTalk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [talkData, setTalkData] = useState({
    title: "",
    agenda: "",
    scheduledAt: "",
    attendees: [],
  });
  const [attendeeInput, setAttendeeInput] = useState("");

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
        if (data.toolboxTalk) {
          setToolboxTalk(data.toolboxTalk);

          // Parse attendees data
          const attendees = data.toolboxTalk.attendees;
          const attendeesArray = Array.isArray(attendees)
            ? attendees
            : JSON.parse(attendees || "[]");

          setTalkData({
            title: data.toolboxTalk.title,
            agenda: data.toolboxTalk.agenda,
            scheduledAt: data.toolboxTalk.scheduledAt
              ? data.toolboxTalk.scheduledAt.slice(0, 16)
              : "",
            attendees: attendeesArray,
          });
        } else {
          toast.error("Toolbox talk data not found");
          navigate("/dashboard/toolbox-talks");
        }
      } else {
        toast.error("Toolbox talk not found");
        navigate("/dashboard/toolbox-talks");
      }
    } catch (error) {
      console.error("Failed to fetch toolbox talk:", error);
      toast.error("Failed to load toolbox talk");
      navigate("/dashboard/toolbox-talks");
    } finally {
      setLoading(false);
    }
  };

  const addAttendee = () => {
    if (
      attendeeInput.trim() &&
      !talkData.attendees.includes(attendeeInput.trim())
    ) {
      setTalkData((prev) => ({
        ...prev,
        attendees: [...prev.attendees, attendeeInput.trim()],
      }));
      setAttendeeInput("");
    }
  };

  const removeAttendee = (attendee) => {
    setTalkData((prev) => ({
      ...prev,
      attendees: prev.attendees.filter((a) => a !== attendee),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!talkData.title.trim() || !talkData.agenda.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);

    try {
      const updateData = {
        title: talkData.title.trim(),
        agenda: talkData.agenda.trim(),
        scheduledAt: talkData.scheduledAt || null,
        attendees: talkData.attendees,
      };

      // Add to sync queue for offline support
      addToSyncQueue({
        type: "update",
        entity: "ToolboxTalk",
        payload: { id, ...updateData },
        localId: `toolbox_update_${Date.now()}`,
      });

      // Try to update immediately if online
      try {
        const response = await fetch(`/api/v1/toolbox-talks/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(updateData),
        });

        if (response.ok) {
          toast.success("Toolbox talk updated successfully!");
          navigate(`/dashboard/toolbox-talks/${id}`);
        } else {
          toast.info("Toolbox talk updated locally and will sync when online");
          navigate(`/dashboard/toolbox-talks/${id}`);
        }
      } catch {
        toast.info("Toolbox talk updated locally and will sync when online");
        navigate(`/dashboard/toolbox-talks/${id}`);
      }
    } catch (error) {
      console.error("Error updating toolbox talk:", error);
      toast.error("Failed to update toolbox talk");
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

  if (!toolboxTalk) {
    return (
      <div className="text-center py-12">
        <X className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
        <h3 className="text-lg font-semibold text-base-content mb-2">
          Toolbox Talk Not Found
        </h3>
        <p className="text-base-content/70 mb-6">
          The requested toolbox talk could not be found.
        </p>
        <button
          onClick={() => navigate("/dashboard/toolbox-talks")}
          className="btn btn-primary"
        >
          Back to Toolbox Talks
        </button>
      </div>
    );
  }

  // Check permissions
  const canEdit =
    user?.role === "ADMIN" || toolboxTalk.createdById === user?.id;
  if (!canEdit) {
    return (
      <div className="text-center py-12">
        <X className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
        <h3 className="text-lg font-semibold text-base-content mb-2">
          Access Denied
        </h3>
        <p className="text-base-content/70 mb-6">
          You don't have permission to edit this toolbox talk.
        </p>
        <button
          onClick={() => navigate(`/dashboard/toolbox-talks/${id}`)}
          className="btn btn-primary"
        >
          Back to Toolbox Talk
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/dashboard/toolbox-talks/${id}`)}
          className="btn btn-ghost btn-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Edit Toolbox Talk</h1>
          <p className="text-base-content/70">
            Update safety discussion details
          </p>
        </div>
      </div>

      {/* Talk Info */}
      <div className="card bg-base-100 shadow-lg mb-6">
        <div className="card-body">
          <h2 className="text-lg font-semibold mb-3">
            Toolbox Talk Information
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Site:</span>{" "}
              {toolboxTalk.site?.name}
            </div>
            <div>
              <span className="font-semibold">Created By:</span>{" "}
              {toolboxTalk.createdBy?.name}
            </div>
            <div>
              <span className="font-semibold">Status:</span>{" "}
              {toolboxTalk.status}
            </div>
            <div>
              <span className="font-semibold">Version:</span> v
              {toolboxTalk.version}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="card bg-base-100">
          <div className="card-body">
            <label className="label">
              <span className="label-text font-semibold">
                Talk Title <span className="text-error">*</span>
              </span>
            </label>
            <input
              type="text"
              value={talkData.title}
              onChange={(e) =>
                setTalkData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g., Fall Protection Safety Discussion"
              className="input input-bordered w-full"
            />
          </div>
        </div>

        {/* Agenda */}
        <div className="card bg-base-100">
          <div className="card-body">
            <label className="label">
              <span className="label-text font-semibold">
                Discussion Agenda <span className="text-error">*</span>
              </span>
            </label>
            <textarea
              value={talkData.agenda}
              onChange={(e) =>
                setTalkData((prev) => ({ ...prev, agenda: e.target.value }))
              }
              placeholder="Describe the safety topics to be discussed..."
              className="textarea textarea-bordered w-full h-32"
            />
            <div className="label">
              <span className="label-text-alt text-base-content/60">
                Outline the key safety topics and discussion points
              </span>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="card bg-base-100">
          <div className="card-body">
            <label className="label">
              <span className="label-text font-semibold">
                Schedule (Optional)
              </span>
            </label>
            <input
              type="datetime-local"
              value={talkData.scheduledAt}
              onChange={(e) =>
                setTalkData((prev) => ({
                  ...prev,
                  scheduledAt: e.target.value,
                }))
              }
              className="input input-bordered w-full"
            />
            <div className="label">
              <span className="label-text-alt text-base-content/60">
                Set a date and time for the toolbox talk. Leave empty for
                immediate completion.
              </span>
            </div>
          </div>
        </div>

        {/* Attendees */}
        <div className="card bg-base-100">
          <div className="card-body">
            <label className="label">
              <span className="label-text font-semibold">Attendees</span>
            </label>

            {/* Add Attendee */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={attendeeInput}
                onChange={(e) => setAttendeeInput(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addAttendee())
                }
                placeholder="Enter attendee name..."
                className="input input-bordered flex-1"
              />
              <button
                type="button"
                onClick={addAttendee}
                disabled={!attendeeInput.trim()}
                className="btn btn-primary"
              >
                <Users className="w-4 h-4" />
              </button>
            </div>

            {/* Attendee List */}
            {talkData.attendees.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Users className="w-4 h-4" />
                  <span>
                    {talkData.attendees.length} Attendee
                    {talkData.attendees.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {talkData.attendees.map((attendee) => (
                    <div key={attendee} className="badge badge-outline gap-2">
                      {attendee}
                      <button
                        type="button"
                        onClick={() => removeAttendee(attendee)}
                        className="btn btn-ghost btn-xs"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="label">
              <span className="label-text-alt text-base-content/60">
                Update the list of team members who will participate in the
                safety discussion
              </span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/toolbox-talks/${id}`)}
            className="btn btn-outline flex-1"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`btn btn-secondary flex-1 ${saving ? "loading" : ""}`}
            disabled={
              saving || !talkData.title.trim() || !talkData.agenda.trim()
            }
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
            Saving these changes will create a new version of the toolbox talk.
            Previous versions are preserved in the audit trail.
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditToolboxTalk;
