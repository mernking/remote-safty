import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSync } from "../../context/SyncContext";
import { toast } from "react-toastify";
import { ArrowLeft, Camera, Plus, X, Users, Calendar } from "lucide-react";

const NewToolboxTalk = () => {
  const { user } = useAuth();
  const { addToSyncQueue } = useSync();
  const navigate = useNavigate();

  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [talkData, setTalkData] = useState({
    title: "",
    agenda: "",
    scheduledAt: "",
    attendees: [],
  });
  const [attachments, setAttachments] = useState([]);
  const [attendeeInput, setAttendeeInput] = useState("");
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
    return selectedSite && talkData.title.trim() && talkData.agenda.trim();
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
        title: talkData.title.trim(),
        agenda: talkData.agenda.trim(),
        scheduledAt: talkData.scheduledAt || null,
        attendees: talkData.attendees,
        attachments: attachments.map((att) => ({
          filename: att.name,
          mimeType: att.type,
          size: att.size,
        })),
      };

      // Add to sync queue for offline support
      addToSyncQueue({
        type: "create",
        entity: "ToolboxTalk",
        payload: submitData,
        localId: `toolbox_${Date.now()}`,
      });

      // Try to submit immediately if online
      try {
        const response = await fetch("/api/v1/toolbox-talks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(submitData),
        });

        if (response.ok) {
          const data = await response.json();
          toast.success("Toolbox talk created successfully!");

          // Create reminder if scheduled
          if (talkData.scheduledAt) {
            toast.info("Reminder set for scheduled toolbox talk", {
              autoClose: 3000,
            });
          }

          navigate(`/dashboard/toolbox-talks/${data.toolboxTalk.id}`);
        } else {
          toast.info("Toolbox talk saved locally and will sync when online");
          navigate("/dashboard/toolbox-talks");
        }
      } catch {
        toast.info("Toolbox talk saved locally and will sync when online");
        navigate("/dashboard/toolbox-talks");
      }
    } catch (error) {
      console.error("Error creating toolbox talk:", error);
      toast.error("Failed to create toolbox talk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/dashboard/toolbox-talks")}
          className="btn btn-ghost btn-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">New Toolbox Talk</h1>
          <p className="text-base-content/70">
            Create a safety discussion session
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
              required
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
              required
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
                <Plus className="w-4 h-4" />
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
                Add names of team members who will participate in the safety
                discussion
              </span>
            </div>
          </div>
        </div>

        {/* Attachments */}
        <div className="card bg-base-100">
          <div className="card-body">
            <label className="label">
              <span className="label-text font-semibold">
                Supporting Materials
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

        {/* Preview */}
        {selectedSite && talkData.title && talkData.agenda && (
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="font-semibold mb-3">Preview</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Site:</strong>{" "}
                  {sites.find((s) => s.id === selectedSite)?.name}
                </p>
                <p>
                  <strong>Title:</strong> {talkData.title}
                </p>
                <p>
                  <strong>Scheduled:</strong>{" "}
                  {talkData.scheduledAt
                    ? new Date(talkData.scheduledAt).toLocaleString()
                    : "Immediate"}
                </p>
                <p>
                  <strong>Attendees:</strong>{" "}
                  {talkData.attendees.length > 0
                    ? talkData.attendees.join(", ")
                    : "None specified"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate("/dashboard/toolbox-talks")}
            className="btn btn-outline flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!validateForm() || loading}
            className={`btn btn-secondary flex-1 ${loading ? "loading" : ""}`}
          >
            {loading ? "Creating..." : "Create Toolbox Talk"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewToolboxTalk;
