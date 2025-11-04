"use client";

const technologies = [
  {
    category: "Frontend",
    items: [
      {
        name: "React 18",
        description: "Modern hooks and functional components",
      },
      {
        name: "DaisyUI + Tailwind",
        description: "Responsive component library",
      },
      { name: "IndexedDB", description: "Offline data storage" },
      { name: "Service Workers", description: "Background sync and caching" },
    ],
  },
  {
    category: "Backend",
    items: [
      { name: "Node.js + Express", description: "RESTful API server" },
      { name: "Prisma ORM", description: "Type-safe database access" },
      {
        name: "SQLite / PostgreSQL",
        description: "Dev and production databases",
      },
      { name: "JWT", description: "Secure authentication" },
    ],
  },
  {
    category: "Features",
    items: [
      { name: "PWA", description: "Installable on all platforms" },
      { name: "Offline-first", description: "Works without internet" },
      { name: "GPS tracking", description: "Location-based features" },
      { name: "Camera integration", description: "Photo evidence capture" },
    ],
  },
];

export function TechStack() {
  return (
    <section className="py-24 px-4 bg-black">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            A Shared Foundation to Build Upon
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Modern tech stack designed for reliability, performance, and
            developer experience
          </p>
        </div>

        {/* Tech Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {technologies.map((tech, index) => (
            <div key={index} className="feature-card rounded-xl p-6">
              <h3 className="text-2xl font-semibold text-purple-400 mb-6 border-b border-purple-500/30 pb-3">
                {tech.category}
              </h3>
              <div className="space-y-4">
                {tech.items.map((item, itemIndex) => (
                  <div key={itemIndex}>
                    <h4 className="text-white font-semibold mb-1">
                      {item.name}
                    </h4>
                    <p className="text-sm text-gray-400">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Code Example */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="feature-card rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              Quick Start
            </h3>
            <div className="bg-gray-950 rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <div className="text-gray-500"># Clone the repository</div>
              <div className="text-green-400">
                git clone https://github.com/your-repo/safety-management
              </div>
              <div className="mt-2 text-gray-500"># Install dependencies</div>
              <div className="text-green-400">cd server && npm install</div>
              <div className="text-green-400">cd ../webApp && npm install</div>
              <div className="mt-2 text-gray-500"># Start development</div>
              <div className="text-green-400">npm run dev</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
