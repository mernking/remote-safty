import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  MapPin,
  ArrowLeft,
  Edit,
  ClipboardCheck,
  AlertTriangle,
  Users,
  Calendar,
} from "lucide-react";

const SiteDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState(null);
  const [stats, setStats] = useState({
    inspections: 0,
    incidents: 0,
    toolboxTalks: 0,
    workers: 0,
  });

  useEffect(() => {
    fetchSite();
  }, [id]);

  const fetchSite = async () => {
    try {
      const response = await fetch(`/api/v1/sites/${id}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setSite(data.site);
        setStats({
          inspections: data.site.inspections?.length || 0,
          incidents: data.site.incidents?.length || 0,
          toolboxTalks: data.site.toolboxTalks?.length || 0,
          workers: 0, // We'll need to add this from API
        });
      } else {
        navigate("/dashboard/sites");
      }
    } catch (error) {
      console.error("Fetch site error:", error);
      navigate("/dashboard/sites");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="text-center py-12">
        <MapPin className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
        <h3 className="text-lg font-semibold text-base-content mb-2">
          Site not found
        </h3>
        <p className="text-base-content/70">
          The requested site could not be found.
        </p>
      </div>
    );
  }

  const canEdit =
    currentUser?.role === "ADMIN" || currentUser?.role === "SAFETY_MANAGER";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard/sites")}
          className="btn btn-ghost btn-sm gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sites
        </button>
        <div>
          <h1 className="text-3xl font-bold text-base-content flex items-center gap-3">
            <MapPin className="w-8 h-8" />
            {site.name}
          </h1>
          <p className="text-base-content/70 mt-2">
            Site details and safety overview.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Site Information */}
        <div className="lg:col-span-2">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              {/* Site Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{site.name}</h2>
                    <p className="text-base-content/70">{site.address}</p>
                    {site.description && (
                      <p className="text-sm text-base-content/60 mt-1">
                        {site.description}
                      </p>
                    )}
                  </div>
                </div>

                {canEdit && (
                  <button
                    onClick={() => navigate(`/dashboard/sites/${site.id}/edit`)}
                    className="btn btn-primary btn-sm gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Site
                  </button>
                )}
              </div>

              {/* Site Details */}
              <div className="divider">Site Information</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Site ID</span>
                  </label>
                  <p className="text-sm font-mono bg-base-200 p-2 rounded">
                    {site.id}
                  </p>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Status</span>
                  </label>
                  <div className="badge badge-success">Active</div>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Created</span>
                  </label>
                  <p className="text-sm">
                    {new Date(site.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">
                      Last Updated
                    </span>
                  </label>
                  <p className="text-sm">
                    {new Date(site.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Location */}
              {(site.lat || site.lng) && (
                <>
                  <div className="divider">Location</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">
                        <span className="label-text font-semibold">
                          Latitude
                        </span>
                      </label>
                      <p className="text-sm">{site.lat?.toFixed(6)}</p>
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text font-semibold">
                          Longitude
                        </span>
                      </label>
                      <p className="text-sm">{site.lng?.toFixed(6)}</p>
                    </div>
                  </div>

                  {/* Google Maps Iframe */}
                  {site.lat && site.lng && (
                    <div className="mt-4">
                      <label className="label">
                        <span className="label-text font-semibold">
                          Map Location
                        </span>
                      </label>
                      <div className="w-full h-64 rounded-lg overflow-hidden border border-base-300">
                        <iframe
                          src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d15852.150023863764!2d${site.lng}!3d${site.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sng!4v1760747940098!5m2!1sen!2sng`}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen=""
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title={`Location of ${site.name}`}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Quick Actions */}
              <div className="divider">Quick Actions</div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    navigate(`/dashboard/inspections/new?site=${site.id}`)
                  }
                  className="btn btn-primary btn-sm gap-2"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  New Inspection
                </button>
                <button
                  onClick={() =>
                    navigate(`/dashboard/sites/${site.id}/incidents/new`)
                  }
                  className="btn btn-outline btn-error btn-sm gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Report Incident
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Stats */}
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="card-title">Activity Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {stats.inspections}
                  </div>
                  <div className="text-xs text-base-content/70 flex items-center justify-center gap-1">
                    <ClipboardCheck className="w-3 h-3" />
                    Inspections
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-error">
                    {stats.incidents}
                  </div>
                  <div className="text-xs text-base-content/70 flex items-center justify-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Incidents
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">
                    {stats.toolboxTalks}
                  </div>
                  <div className="text-xs text-base-content/70 flex items-center justify-center gap-1">
                    <Users className="w-3 h-3" />
                    Toolbox Talks
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-info">
                    {stats.workers}
                  </div>
                  <div className="text-xs text-base-content/70 flex items-center justify-center gap-1">
                    <Users className="w-3 h-3" />
                    Workers
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Placeholder */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="card-title">Recent Activity</h3>
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
                <p className="text-base-content/70">
                  Recent activity will be displayed here
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteDetail;
