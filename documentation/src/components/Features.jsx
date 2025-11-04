"use client";

import {
  Wifi,
  WifiOff,
  Shield,
  Database,
  Smartphone,
  Lock,
  Zap,
  FileCheck,
  Users,
  Activity,
} from "lucide-react";

const features = [
  {
    icon: WifiOff,
    title: "Offline-First Architecture",
    description:
      "Work seamlessly without connectivity. All data is stored locally and syncs automatically when connection is restored.",
    highlight: "IndexedDB + Service Workers",
  },
  {
    icon: Zap,
    title: "Lightning Fast PWA",
    description:
      "Progressive Web App that installs on any device. No app store required. Updates automatically in the background.",
    highlight: "Cross-platform",
  },
  {
    icon: Shield,
    title: "Safety Inspections",
    description:
      "Structured checklists, photo attachments, and GPS location tracking for comprehensive equipment safety checks.",
    highlight: "Auditable records",
  },
  {
    icon: Activity,
    title: "Incident Management",
    description:
      "Report incidents with severity tracking, witness documentation, and automatic notifications for critical events.",
    highlight: "Real-time alerts",
  },
  {
    icon: Database,
    title: "RESTful API",
    description:
      "Complete API coverage with JWT authentication, role-based access control, and comprehensive documentation.",
    highlight: "50+ endpoints",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    description:
      "Role-based permissions, encrypted data storage, audit logs, and API key management for integrations.",
    highlight: "SOC 2 ready",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Design",
    description:
      "Optimized for field use with large touch targets, camera integration, and works great with gloves.",
    highlight: "DaisyUI + Tailwind",
  },
  {
    icon: FileCheck,
    title: "Compliance Tracking",
    description:
      "Generate audit reports, export to PDF/CSV, and maintain complete change history for regulatory requirements.",
    highlight: "OSHA compliant",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Toolbox talks with attendance tracking, site assignments, and user management with granular permissions.",
    highlight: "Multi-role support",
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="py-24 px-4 bg-gradient-to-b from-gray-900 to-black"
    >
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Redefining Safety Management
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Built for the field. Designed for compliance. Engineered for
            reliability.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="feature-card rounded-xl p-6 hover:shadow-xl hover:shadow-purple-500/10"
              >
                <div className="mb-4">
                  <div className="inline-flex p-3 bg-purple-500/10 rounded-lg">
                    <Icon className="h-8 w-8 text-purple-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400 mb-3">{feature.description}</p>
                <div className="inline-block px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
                  <span className="text-xs text-green-400 font-mono">
                    {feature.highlight}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
