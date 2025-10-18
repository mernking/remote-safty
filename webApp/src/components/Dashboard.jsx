import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSync } from "../context/SyncContext";
import {
  ClipboardCheck,
  AlertTriangle,
  MessageSquare,
  MapPin,
  TrendingUp,
  Users,
  FileText,
  Plus,
  Wifi,
  WifiOff,
  Clock,
  CheckCircle,
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const { isOnline, syncStatus, lastSyncTime, pendingOperations } = useSync();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/v1/reports/dashboard", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: "New Inspection",
      description: "Start a safety inspection",
      icon: ClipboardCheck,
      href: "/dashboard/inspections/new",
      color: "btn-primary",
    },
    {
      title: "Report Incident",
      description: "Log a safety incident",
      icon: AlertTriangle,
      href: "/dashboard/incidents/new",
      color: "btn-error",
    },
    {
      title: "Toolbox Talk",
      description: "Create safety discussion",
      icon: MessageSquare,
      href: "/dashboard/toolbox-talks/new",
      color: "btn-secondary",
    },
    {
      title: "View Sites",
      description: "Manage jobsite locations",
      icon: MapPin,
      href: "/dashboard/sites",
      color: "btn-accent",
      roles: ["ADMIN", "SAFETY_MANAGER"],
    },
  ];

  const filteredActions = quickActions.filter(
    (action) => !action.roles || action.roles.includes(user?.role)
  );

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
            Welcome back, {user?.name || user?.email}!
          </h1>
          <p className="text-base-content/70 mt-2">
            Here's what's happening on your jobsites today.
          </p>
        </div>

        {/* Sync Status */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              {isOnline ? (
                <Wifi className="w-5 h-5 text-success" />
              ) : (
                <WifiOff className="w-5 h-5 text-error" />
              )}
              <div>
                <div className="font-semibold text-sm">
                  {isOnline ? "Online" : "Offline"}
                </div>
                <div className="text-xs text-base-content/70">
                  {syncStatus === "syncing"
                    ? "Syncing..."
                    : lastSyncTime
                    ? `Last sync: ${new Date(
                        lastSyncTime
                      ).toLocaleTimeString()}`
                    : "Not synced yet"}
                </div>
              </div>
              {pendingOperations > 0 && (
                <div className="badge badge-primary badge-sm">
                  {pendingOperations} pending
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <ClipboardCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {stats.summary.totalInspections}
                  </div>
                  <div className="text-sm text-base-content/70">
                    Inspections (30d)
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-error/10 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-error" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {stats.summary.totalIncidents}
                  </div>
                  <div className="text-sm text-base-content/70">
                    Incidents (30d)
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {stats.summary.totalToolboxTalks}
                  </div>
                  <div className="text-sm text-base-content/70">
                    Toolbox Talks (30d)
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-warning/10 rounded-lg">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {stats.summary.pendingActions}
                  </div>
                  <div className="text-sm text-base-content/70">
                    Pending Actions
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredActions.map((action) => (
              <Link
                key={action.title}
                to={action.href}
                className={`btn ${action.color} btn-outline gap-3 h-auto p-4`}
              >
                <action.icon className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-semibold">{action.title}</div>
                  <div className="text-sm opacity-75">{action.description}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Inspections */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <h2 className="card-title">Recent Inspections</h2>
              <Link
                to="/dashboard/inspections"
                className="btn btn-ghost btn-sm"
              >
                View All
              </Link>
            </div>
            {stats?.recentActivity?.draftInspections > 0 && (
              <div className="alert alert-warning alert-sm">
                <Clock className="w-4 h-4" />
                <span>
                  {stats.recentActivity.draftInspections} inspection
                  {stats.recentActivity.draftInspections > 1 ? "s" : ""} in
                  draft
                </span>
              </div>
            )}
            {/* Recent inspections will be populated when API endpoint is implemented */}
            <div className="text-center py-8 text-base-content/50">
              <ClipboardCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Recent inspections will appear here</p>
            </div>
          </div>
        </div>

        {/* Sites Overview */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <h2 className="card-title">Sites Overview</h2>
              <Link to="/dashboard/sites" className="btn btn-ghost btn-sm">
                View All
              </Link>
            </div>
            {stats?.sites && stats.sites.length > 0 ? (
              <div className="space-y-3">
                {stats.sites.slice(0, 3).map((site) => (
                  <div
                    key={site.id}
                    className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                  >
                    <div>
                      <div className="font-semibold">{site.name}</div>
                      <div className="text-sm text-base-content/70">
                        {site.inspections} inspections, {site.incidents}{" "}
                        incidents
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="badge badge-primary badge-sm">
                        {site.inspections}
                      </div>
                      {site.incidents > 0 && (
                        <div className="badge badge-error badge-sm">
                          {site.incidents}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-base-content/50">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No sites configured yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Safety Alerts */}
      {stats?.summary?.highSeverityIncidents > 0 && (
        <div className="card bg-error/10 border-error shadow-lg">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-error" />
              <div>
                <h3 className="font-semibold text-error">Safety Alert</h3>
                <p className="text-sm">
                  {stats.summary.highSeverityIncidents} high-severity incident
                  {stats.summary.highSeverityIncidents > 1 ? "s" : ""} reported
                  this month. Please review and address immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
