"use client";

import { Terminal, Database, Rocket, Book } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: Terminal,
    title: "Clone & Install",
    description:
      "Get the project and install dependencies for both frontend and backend",
    code: `git clone https://github.com/your-repo/safety-management
cd server && npm install
cd ../webApp && npm install`,
  },
  {
    icon: Database,
    title: "Setup Database",
    description: "Initialize the database with Prisma migrations and seed data",
    code: `cd server
npx prisma migrate dev
npx prisma db seed`,
  },
  {
    icon: Rocket,
    title: "Start Development",
    description: "Run the backend API and frontend development servers",
    code: `# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
cd webApp && npm run dev`,
  },
];

export function GettingStarted() {
  return (
    <section id="getting-started" className="py-24 px-4 bg-black">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 mb-6">
            <Book className="h-4 w-4 text-purple-400" />
            <span className="text-sm text-purple-300">Quick Start Guide</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Start Building in Minutes
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Get up and running with our comprehensive safety management system
            in just three simple steps
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="feature-card rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-purple-500/10 rounded-lg p-3">
                    <Icon className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 font-mono">
                      Step {index + 1}
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      {step.title}
                    </h3>
                  </div>
                </div>
                <p className="text-gray-400 mb-4 text-sm">{step.description}</p>
                <div className="bg-gray-950 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                  <pre className="text-green-400 whitespace-pre-wrap">
                    {step.code}
                  </pre>
                </div>
              </div>
            );
          })}
        </div>

        {/* Access Info */}
        <div className="max-w-4xl mx-auto">
          <div className="feature-card rounded-xl p-8 text-center">
            <h3 className="text-2xl font-semibold text-white mb-4">
              Access Your Application
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="bg-gray-950 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-2">Frontend (PWA)</div>
                <code className="text-blue-400 font-mono">
                  http://localhost:5173
                </code>
                <p className="text-sm text-gray-400 mt-2">
                  React app with offline support
                </p>
              </div>
              <div className="bg-gray-950 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-2">Backend API</div>
                <code className="text-green-400 font-mono">
                  http://localhost:3001
                </code>
                <p className="text-sm text-gray-400 mt-2">
                  RESTful API endpoints
                </p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-800">
              <p className="text-gray-400 mb-4">
                Default admin credentials (change in production):
              </p>
              <div className="inline-block bg-gray-950 rounded-lg p-4 text-left font-mono text-sm">
                <div className="text-gray-300">
                  Email:{" "}
                  <span className="text-yellow-400">admin@example.com</span>
                </div>
                <div className="text-gray-300">
                  Password: <span className="text-yellow-400">admin123</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Button size="lg" className="btn-primary text-white">
                View Full Documentation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
