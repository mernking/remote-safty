import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { User, ArrowLeft, Shield, Eye, EyeOff, Key } from "lucide-react";
import { toast } from "react-toastify";

const EditUser = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "WORKER",
    status: "ACTIVE",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

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
        if (data.user) {
          setUser(data.user);
          setFormData({
            name: data.user.name || "",
            email: data.user.email || "",
            role: data.user.role || "WORKER",
            status: data.user.status || "ACTIVE",
            password: "",
            confirmPassword: "",
          });
        } else {
          toast.error("User data not found");
          navigate("/dashboard/users");
        }
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
      };

      // Only include password if it's being changed
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`/api/v1/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("User updated successfully!");
        navigate("/dashboard/users");
      } else {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          toast.error(data.message || "Failed to update user");
        }
      }
    } catch (error) {
      console.error("Update user error:", error);
      toast.error("Failed to update user. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateApiKey = async () => {
    if (
      !confirm(
        `Generate a new API key for ${user?.name}? This will replace any existing key.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/users/${id}/generate-api-key`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`API key generated successfully!`);
        alert(
          `New API key for ${user?.name}: ${data.apiKey}\n\nPlease save this key securely!`
        );

        // Refresh user data
        fetchUser();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to generate API key");
      }
    } catch (error) {
      console.error("Generate API key error:", error);
      toast.error("Failed to generate API key");
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
          You need administrator privileges to edit users.
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

  const roleOptions = [
    {
      value: "WORKER",
      label: "Worker",
      description: "Basic user with limited access",
    },
    {
      value: "SUPERVISOR",
      label: "Supervisor",
      description: "Can create inspections and manage team",
    },
    {
      value: "SAFETY_MANAGER",
      label: "Safety Manager",
      description: "Can manage sites and oversee safety programs",
    },
    {
      value: "ADMIN",
      label: "Administrator",
      description: "Full system access and user management",
    },
  ];

  const statusOptions = [
    {
      value: "ACTIVE",
      label: "Active",
      description: "User can access the system",
    },
    {
      value: "BANNED",
      label: "Banned",
      description: "User is banned and cannot access the system",
    },
    {
      value: "DELETED",
      label: "Deleted",
      description: "User account is soft deleted",
    },
  ];

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
            Edit User
          </h1>
          <p className="text-base-content/70 mt-2">
            Update user account information and permissions.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Full Name *</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter full name"
                  className={`input input-bordered ${
                    errors.name ? "input-error" : ""
                  }`}
                  value={formData.name}
                  onChange={handleInputChange}
                />
                {errors.name && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.name}
                    </span>
                  </label>
                )}
              </div>

              {/* Email */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Email Address *
                  </span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter email address"
                  className={`input input-bordered ${
                    errors.email ? "input-error" : ""
                  }`}
                  value={formData.email}
                  onChange={handleInputChange}
                />
                {errors.email && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.email}
                    </span>
                  </label>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  New Password (leave blank to keep current)
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter new password"
                  className={`input input-bordered pr-10 ${
                    errors.password ? "input-error" : ""
                  }`}
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 btn btn-ghost btn-sm btn-circle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.password}
                  </span>
                </label>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  Confirm New Password
                </span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm new password"
                className={`input input-bordered ${
                  errors.confirmPassword ? "input-error" : ""
                }`}
                value={formData.confirmPassword}
                onChange={handleInputChange}
              />
              {errors.confirmPassword && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.confirmPassword}
                  </span>
                </label>
              )}
            </div>

            {/* Role Selection */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Role *</span>
              </label>
              <select
                name="role"
                className="select select-bordered"
                value={formData.role}
                onChange={handleInputChange}
              >
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <label className="label">
                <span className="label-text-alt">
                  {
                    roleOptions.find((r) => r.value === formData.role)
                      ?.description
                  }
                </span>
              </label>
            </div>

            {/* Status Selection */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Status *</span>
              </label>
              <select
                name="status"
                className="select select-bordered"
                value={formData.status}
                onChange={handleInputChange}
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <label className="label">
                <span className="label-text-alt">
                  {
                    statusOptions.find((s) => s.value === formData.status)
                      ?.description
                  }
                </span>
              </label>
            </div>

            {/* API Key Section */}
            <div className="divider">API Key Management</div>
            <div className="form-control">
              <div className="flex items-center justify-between">
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">
                      API Key Status
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    {user?.apiKey ? (
                      <>
                        <div className="badge badge-success gap-1">
                          <Key className="w-3 h-3" />
                          Active
                        </div>
                        <span className="text-sm text-base-content/70">
                          Key enabled: {user?.keyEnabled ? "Yes" : "No"}
                        </span>
                      </>
                    ) : (
                      <div className="badge badge-neutral">No API key</div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateApiKey}
                  className="btn btn-outline btn-sm"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Generate New Key
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="card-actions justify-end mt-6">
              <button
                type="button"
                onClick={() => navigate("/dashboard/users")}
                className="btn btn-ghost"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="loading loading-spinner loading-sm"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4" />
                    Update User
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUser;
