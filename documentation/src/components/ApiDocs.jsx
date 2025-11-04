"use client";

import { Code2, Database, Shield, Users, FileText, Bell } from "lucide-react";

const apiCategories = [
  {
    icon: Shield,
    name: "Authentication",
    color: "text-blue-400",
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/auth/login",
        desc: "User login with JWT tokens",
      },
      {
        method: "POST",
        path: "/api/v1/auth/refresh",
        desc: "Refresh access token",
      },
      {
        method: "POST",
        path: "/api/v1/auth/logout",
        desc: "Invalidate tokens",
      },
    ],
  },
  {
    icon: FileText,
    name: "Inspections",
    color: "text-purple-400",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/inspections",
        desc: "List all inspections",
      },
      {
        method: "POST",
        path: "/api/v1/inspections",
        desc: "Create new inspection",
      },
      {
        method: "PUT",
        path: "/api/v1/inspections/:id",
        desc: "Update inspection",
      },
    ],
  },
  {
    icon: Bell,
    name: "Incidents",
    color: "text-red-400",
    endpoints: [
      { method: "GET", path: "/api/v1/incidents", desc: "List all incidents" },
      {
        method: "POST",
        path: "/api/v1/incidents",
        desc: "Report new incident",
      },
      {
        method: "GET",
        path: "/api/v1/incidents/:id",
        desc: "Get incident details",
      },
    ],
  },
  {
    icon: Database,
    name: "Sites",
    color: "text-green-400",
    endpoints: [
      { method: "GET", path: "/api/v1/sites", desc: "List jobsites" },
      { method: "POST", path: "/api/v1/sites", desc: "Register new site" },
      { method: "PUT", path: "/api/v1/sites/:id", desc: "Update site info" },
    ],
  },
  {
    icon: Users,
    name: "Users",
    color: "text-yellow-400",
    endpoints: [
      { method: "GET", path: "/api/v1/users", desc: "List users (admin)" },
      { method: "POST", path: "/api/v1/users", desc: "Create user (admin)" },
      { method: "PUT", path: "/api/v1/users/:id", desc: "Update user" },
    ],
  },
  {
    icon: Code2,
    name: "Sync",
    color: "text-cyan-400",
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/sync/upload",
        desc: "Upload offline changes",
      },
      {
        method: "GET",
        path: "/api/v1/sync/download",
        desc: "Download server updates",
      },
      { method: "GET", path: "/api/v1/sync/status", desc: "Check sync status" },
    ],
  },
];

const methodColors = {
  GET: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  POST: "text-green-400 bg-green-400/10 border-green-400/30",
  PUT: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  DELETE: "text-red-400 bg-red-400/10 border-red-400/30",
};

export function ApiDocs() {
  return (
    <section
      id="api"
      className="py-24 px-4 bg-gradient-to-b from-black to-gray-900"
    >
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Fully Typed API
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            50+ RESTful endpoints with JWT authentication, role-based access
            control, and comprehensive documentation
          </p>
        </div>

        {/* API Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {apiCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <div key={index} className="feature-card rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Icon className={`h-6 w-6 ${category.color}`} />
                  <h3 className="text-xl font-semibold text-white">
                    {category.name}
                  </h3>
                </div>
                <div className="space-y-3">
                  {category.endpoints.map((endpoint, endpointIndex) => (
                    <div key={endpointIndex} className="text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-mono border ${
                            methodColors[endpoint.method]
                          }`}
                        >
                          {endpoint.method}
                        </span>
                        <code className="text-purple-300 font-mono text-xs">
                          {endpoint.path}
                        </code>
                      </div>
                      <p className="text-gray-400 text-xs ml-1">
                        {endpoint.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Example Request/Response */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="feature-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-green-400">→</span> Request
            </h3>
            <div className="bg-gray-950 rounded-lg p-4 font-mono text-xs overflow-x-auto">
              <div className="text-purple-400">POST /api/v1/inspections</div>
              <div className="text-gray-500 mt-2">{"{"}</div>
              <div className="text-gray-300 ml-4">"siteId": "site-uuid",</div>
              <div className="text-gray-300 ml-4">"checklist": {"{"}</div>
              <div className="text-gray-300 ml-8">
                "equipment": "Excavator #7",
              </div>
              <div className="text-gray-300 ml-8">"status": "completed"</div>
              <div className="text-gray-300 ml-4">{"}"},</div>
              <div className="text-gray-300 ml-4">
                "attachments": ["photo1.jpg"]
              </div>
              <div className="text-gray-500">{"}"}</div>
            </div>
          </div>

          <div className="feature-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-blue-400">←</span> Response
            </h3>
            <div className="bg-gray-950 rounded-lg p-4 font-mono text-xs overflow-x-auto">
              <div className="text-green-400">200 OK</div>
              <div className="text-gray-500 mt-2">{"{"}</div>
              <div className="text-gray-300 ml-4">"id": "inspection-uuid",</div>
              <div className="text-gray-300 ml-4">"status": "completed",</div>
              <div className="text-gray-300 ml-4">"version": 1,</div>
              <div className="text-gray-300 ml-4">
                "createdAt": "2025-11-04T..."
              </div>
              <div className="text-gray-500">{"}"}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
