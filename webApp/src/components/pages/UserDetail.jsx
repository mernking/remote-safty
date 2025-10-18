import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  User,
  ArrowLeft,
  Shield,
  Edit,
  Key,
  ClipboardCheck,
  AlertTriangle,
  MessageSquare,
  Calendar,
} from "lucide-react";
import { toast } from "react-toastify";

const UserDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    inspections: 0,
    incidents: 0,
    toolboxTalks: 0,
    notifications: 0,
  });

  useEffect(() => {
    if (currentUser?.role === "ADMIN") {
      fetchUser();
    }
  }, [id, currentUser]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/v1/users/${id}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setStats({
          inspections: data.user._count?.inspections || 0,
          incidents: data.user._count?.incidents || 0,
          toolboxTalks: data.user._count?.toolboxTalks || 0,
          notifications: data.user._count?.notifications || 0,
        });
      } else {
        toast.error("Failed to load user");
        navigate("/dashboard/users");
      }
    } catch (error) {
      console.error("Fetch user error:", error);
      toast.error("Failed to load user");
      navigate("/dashboard/users");
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      ADMIN: { color: "badge-error", icon: Shield },
      SAFETY_MANAGER: { color: "badge-warning", icon: Shield },
      SUPERVISOR: { color: "badge-info", icon: User },
      WORKER: { color: "badge-success", icon: User },
    };
    const config = roleConfig[role] || { color: "badge-neutral", icon: User };
    return (
      <div className={`badge ${config.color} gap-1`}>
        <config.icon className="w-4 h-4" />
        {role.replace("_", " ")}
      </div>
    );
  };

  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
        <h3 className="text-lg font-semibold text-base-content mb-2">
          Access Denied
        </h3>
        <p className="text-base-content/70">
          You need administrator privileges to view user details.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
        <h3 className="text-lg font-semibold text-base-content mb-2">
          User not found
        </h3>
        <p className="text-base-content/70">
          The requested user could not be found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard/users")}
          className="btn btn-ghost btn-sm gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </button>
        <div>
          <h1 className="text-3xl font-bold text-base-content flex items-center gap-3">
            <User className="w-8 h-8" />
            User Details
          </h1>
          <p className="text-base-content/70 mt-2">
            View and manage user account information.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <div className="lg:col-span-2">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              {/* User Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="avatar placeholder">
                    <div className="bg-neutral-focus text-neutral-content rounded-full w-16 h-16">
                      <span className="text-xl">
                        {user.name
                          ? user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                          : user.email[0].toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {user.name || "Unnamed User"}
                    </h2>
                    <p className="text-base-content/70">{user.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {getRoleBadge(user.role)}
                      {user.apiKey && user.keyEnabled && (
                        <div className="badge badge-outline badge-sm gap-1">
                          <Key className="w-3 h-3" />
                          API Key
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="dropdown dropdown-left">
                  <label tabIndex={0} className="btn btn-primary btn-sm gap-2">
                    <Edit className="w-4 h-4" />
                    Actions
                  </label>
                  <ul
                    tabIndex={0}
                    className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-40"
                  >
                    <li>
                      <button
                        onClick={() =>
                          navigate(`/dashboard/users/${user.id}/edit`)
                        }
                      >
                        <Edit className="w-4 h-4" />
                        Edit User
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          const newKey = prompt(
                            `Generate new API key for ${user.name}?`
                          );
                          if (newKey) {
                            // API key generation logic would go here
                          }
                        }}
                      >
                        <Key className="w-4 h-4" />
                        Generate API Key
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              {/* User Details */}
              <div className="divider">Account Information</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">User ID</span>
                  </label>
                  <p className="text-sm font-mono bg-base-200 p-2 rounded">
                    {user.id}
                  </p>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">
                      Account Status
                    </span>
                  </label>
                  <div className="badge badge-success">Active</div>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Created</span>
                  </label>
                  <p className="text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">
                      Last Updated
                    </span>
                  </label>
                  <p className="text-sm">
                    {new Date(user.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* API Key Information */}
              {user.apiKey && (
                <>
                  <div className="divider">API Key Information</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">
                        <span className="label-text font-semibold">
                          API Key Status
                        </span>
                      </label>
                      <div className="flex items-center gap-2">
                        <div
                          className={`badge ${
                            user.keyEnabled ? "badge-success" : "badge-warning"
                          }`}
                        >
                          {user.keyEnabled ? "Enabled" : "Disabled"}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text font-semibold">
                          Last Generated
                        </span>
                      </label>
                      <p className="text-sm">
                        {new Date(user.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </>
              )}
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
                    <MessageSquare className="w-3 h-3" />
                    Toolbox Talks
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-info">
                    {stats.notifications}
                  </div>
                  <div className="text-xs text-base-content/70 flex items-center justify-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Notifications
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

export default UserDetail;
