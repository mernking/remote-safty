import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSync } from "../context/SyncContext";
import {
  Home,
  MapPin,
  ClipboardCheck,
  AlertTriangle,
  MessageSquare,
  FileText,
  Users,
  RefreshCw,
  LogOut,
  User,
  Bell,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useState, useEffect } from "react";

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { isOnline, syncStatus, pendingOperations, forceSync } = useSync();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);

  // Fetch notifications on mount and periodically
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(
          "/api/v1/notifications?unreadOnly=true&limit=5",
          {
            credentials: "include",
          }
        );
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard/", icon: Home },
    {
      name: "Sites",
      href: "/dashboard/sites",
      icon: MapPin,
      roles: ["ADMIN", "SAFETY_MANAGER"],
    },
    {
      name: "Inspections",
      href: "/dashboard/inspections",
      icon: ClipboardCheck,
    },
    { name: "Incidents", href: "/dashboard/incidents", icon: AlertTriangle },
    {
      name: "Toolbox Talks",
      href: "/dashboard/toolbox-talks",
      icon: MessageSquare,
    },
    {
      name: "Reports",
      href: "/dashboard/reports",
      icon: FileText,
      roles: ["ADMIN", "SAFETY_MANAGER"],
    },
    { name: "Users", href: "/dashboard/users", icon: Users, roles: ["ADMIN"] },
  ];

  const filteredNavigation = navigation.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  return (
    <div className="min-h-screen bg-base-200">
      {/* Top Navigation Bar */}
      <div className="navbar bg-base-100 shadow-lg">
        <div className="navbar-start">
          <div className="dropdown">
            <label tabIndex={0} className="btn btn-ghost lg:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h8m-8 6h16"
                />
              </svg>
            </label>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
            >
              {filteredNavigation.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={location.pathname === item.href ? "active" : ""}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <Link to="/dashboard" className="btn btn-ghost normal-case text-xl">
            Safety Compliance
          </Link>
        </div>

        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            {filteredNavigation.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={location.pathname === item.href ? "active" : ""}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="navbar-end gap-2">
          {/* Sync Status */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-success" />
            ) : (
              <WifiOff className="w-4 h-4 text-error" />
            )}

            <button
              onClick={forceSync}
              disabled={!isOnline || syncStatus === "syncing"}
              className="btn btn-ghost btn-sm"
              title="Sync Data"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  syncStatus === "syncing" ? "animate-spin" : ""
                }`}
              />
              {pendingOperations > 0 && (
                <span className="badge badge-sm badge-primary">
                  {pendingOperations}
                </span>
              )}
            </button>
          </div>

          {/* Notifications */}
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle">
              <div className="indicator">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="badge badge-xs badge-primary indicator-item">
                    {notifications.length}
                  </span>
                )}
              </div>
            </label>
            <div
              tabIndex={0}
              className="mt-3 z-[1] card card-compact dropdown-content w-80 bg-base-100 shadow"
            >
              <div className="card-body">
                <span className="font-bold text-lg">Notifications</span>
                {notifications.length === 0 ? (
                  <p className="text-sm text-base-content/70">
                    No new notifications
                  </p>
                ) : (
                  <div className="space-y-2">
                    {notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className="alert alert-info alert-sm"
                      >
                        <div>
                          <h4 className="font-semibold">
                            {notification.title}
                          </h4>
                          <p className="text-sm">{notification.message}</p>
                        </div>
                      </div>
                    ))}
                    {notifications.length > 5 && (
                      <p className="text-sm text-base-content/70">
                        +{notifications.length - 5} more notifications
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Menu */}
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
              <div className="w-8 rounded-full bg-primary text-primary-content flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
            </label>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
            >
              <li className="menu-title">
                <span className="text-base-content">
                  {user?.name || user?.email}
                  <br />
                  <span className="badge badge-ghost badge-sm">
                    {user?.role}
                  </span>
                </span>
              </li>
              <li>
                <Link to="/dashboard/profile">Profile Settings</Link>
              </li>
              <li>
                <a onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                  Logout
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
};

export default Layout;
