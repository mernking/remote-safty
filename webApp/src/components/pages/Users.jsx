import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Users as UsersIcon,
  Plus,
  Search,
  Edit,
  Trash2,
  Key,
  Shield,
  User,
  Ban,
  CheckCircle,
} from "lucide-react";

const Users = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    if (currentUser?.role === "ADMIN") {
      fetchUsers();
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/v1/users", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

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
        <config.icon className="w-3 h-3" />
        {role.replace("_", " ")}
      </div>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: { color: "badge-success", text: "Active" },
      BANNED: { color: "badge-error", text: "Banned" },
      DELETED: { color: "badge-neutral", text: "Deleted" },
    };
    const config = statusConfig[status] || {
      color: "badge-neutral",
      text: status,
    };
    return (
      <div className={`badge ${config.color} badge-sm`}>{config.text}</div>
    );
  };

  const handleBanUser = async (userId, userEmail, currentStatus) => {
    if (userId === currentUser.id) {
      alert("You cannot ban your own account");
      return;
    }

    const action = currentStatus === "BANNED" ? "unban" : "ban";
    if (!confirm(`Are you sure you want to ${action} user ${userEmail}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          status: currentStatus === "BANNED" ? "ACTIVE" : "BANNED",
        }),
      });

      if (response.ok) {
        setUsers(
          users.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  status: currentStatus === "BANNED" ? "ACTIVE" : "BANNED",
                }
              : u
          )
        );
        alert(`User ${action}ned successfully`);
      } else {
        const error = await response.json();
        alert(error.message || `Failed to ${action} user`);
      }
    } catch (error) {
      console.error(`${action} user error:`, error);
      alert(`Failed to ${action} user`);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (userId === currentUser.id) {
      alert("You cannot delete your own account");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete user ${userEmail}? This will soft delete the user.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setUsers(users.filter((u) => u.id !== userId));
        alert("User deleted successfully");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Delete user error:", error);
      alert("Failed to delete user");
    }
  };

  const handleGenerateApiKey = async (userId, userEmail) => {
    try {
      const response = await fetch(`/api/v1/users/${userId}/generate-api-key`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        alert(
          `API key generated for ${userEmail}. The key is: ${data.apiKey}\n\nPlease save this key securely!`
        );
        fetchUsers(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.message || "Failed to generate API key");
      }
    } catch (error) {
      console.error("Generate API key error:", error);
      alert("Failed to generate API key");
    }
  };

  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
        <h3 className="text-lg font-semibold text-base-content mb-2">
          Access Denied
        </h3>
        <p className="text-base-content/70">
          You need administrator privileges to manage users.
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">
            User Management
          </h1>
          <p className="text-base-content/70 mt-2">
            Manage user accounts and permissions.
          </p>
        </div>

        <button
          onClick={() => navigate(`/dashboard/users/new`)}
          className="btn btn-primary gap-2"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="form-control">
          <div className="input-group">
            <span>
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search users..."
              className="input input-bordered"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <select
          className="select select-bordered"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="SAFETY_MANAGER">Safety Manager</option>
          <option value="SUPERVISOR">Supervisor</option>
          <option value="WORKER">Worker</option>
        </select>
      </div>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <UsersIcon className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
          <h3 className="text-lg font-semibold text-base-content mb-2">
            No users found
          </h3>
          <p className="text-base-content/70 mb-6">
            {searchTerm || roleFilter
              ? "Try adjusting your search filters"
              : "Create your first user account"}
          </p>
          {!searchTerm && !roleFilter && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First User
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <div key={user.id} className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="avatar placeholder">
                      <div className="bg-neutral-focus text-neutral-content rounded-full w-12">
                        <span className="text-sm">
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
                      <h3 className="font-semibold text-lg">
                        {user.name || "Unnamed User"}
                      </h3>
                      <p className="text-base-content/70">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getRoleBadge(user.role)}
                        {getStatusBadge(user.status)}
                        {user.apiKey && user.keyEnabled && (
                          <div className="badge badge-outline badge-sm gap-1">
                            <Key className="w-3 h-3" />
                            API Key
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right text-sm text-base-content/70">
                      <div>
                        Created: {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                      <div>
                        Last updated:{" "}
                        {new Date(user.updatedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="dropdown dropdown-left">
                      <label
                        tabIndex={0}
                        className="btn btn-ghost btn-sm btn-square"
                      >
                        <Edit className="w-4 h-4" />
                      </label>
                      <ul
                        tabIndex={0}
                        className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-48"
                      >
                        <li>
                          <a
                            onClick={() =>
                              navigate(`/dashboard/users/${user.id}/edit`)
                            }
                          >
                            Edit User
                          </a>
                        </li>
                        <li>
                          <a
                            onClick={() =>
                              navigate(`/dashboard/users/${user.id}`)
                            }
                          >
                            View Details
                          </a>
                        </li>
                        <li>
                          <a
                            onClick={() =>
                              handleGenerateApiKey(user.id, user.email)
                            }
                          >
                            Generate API Key
                          </a>
                        </li>
                        <li>
                          <a
                            onClick={() =>
                              handleBanUser(user.id, user.email, user.status)
                            }
                          >
                            {user.status === "BANNED" ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Unban User
                              </>
                            ) : (
                              <>
                                <Ban className="w-4 h-4 mr-2" />
                                Ban User
                              </>
                            )}
                          </a>
                        </li>
                        <li>
                          <a
                            onClick={() =>
                              handleDeleteUser(user.id, user.email)
                            }
                            className="text-error"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete User
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* User Stats */}
                <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-base-300">
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {user._count?.inspections || 0}
                    </div>
                    <div className="text-xs text-base-content/70">
                      Inspections
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {user._count?.incidents || 0}
                    </div>
                    <div className="text-xs text-base-content/70">
                      Incidents
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {user._count?.toolboxTalks || 0}
                    </div>
                    <div className="text-xs text-base-content/70">
                      Toolbox Talks
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {user._count?.notifications || 0}
                    </div>
                    <div className="text-xs text-base-content/70">
                      Notifications
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Create New User</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                ✕
              </button>
            </div>
            <NewUser
              inline={true}
              onClose={() => setShowCreateModal(false)}
              onSuccess={() => {
                setShowCreateModal(false);
                fetchUsers();
              }}
            />
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">
                Edit User: {editingUser.name}
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                ✕
              </button>
            </div>
            <EditUser
              inline={true}
              userId={editingUser.id}
              onClose={() => setEditingUser(null)}
              onSuccess={() => {
                setEditingUser(null);
                fetchUsers();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
