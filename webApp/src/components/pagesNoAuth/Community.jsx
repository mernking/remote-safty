import { Users, MessageCircle, Heart, TrendingUp } from "lucide-react"

export default function Community() {
  const discussions = [
    {
      id: 1,
      title: "Best practices for incident reporting",
      author: "Sarah Johnson",
      replies: 24,
      likes: 156,
      category: "Best Practices",
      views: 1200,
    },
    {
      id: 2,
      title: "How to integrate Saftz with our HR system",
      author: "Mike Chen",
      replies: 12,
      likes: 89,
      category: "Integration",
      views: 450,
    },
    {
      id: 3,
      title: "Safety compliance checklist template",
      author: "Emma Davis",
      replies: 31,
      likes: 234,
      category: "Resources",
      views: 2100,
    },
    {
      id: 4,
      title: "Tips for improving team engagement",
      author: "James Wilson",
      replies: 18,
      likes: 145,
      category: "Tips & Tricks",
      views: 890,
    },
  ]

  const stats = [
    { label: "Active Members", value: "2,500+" },
    { label: "Discussions", value: "5,200+" },
    { label: "Resources Shared", value: "1,800+" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="section-title">Saftz Community</h1>
          <p className="section-subtitle">
            Connect with safety professionals, share best practices, and learn from others
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
              <p className="text-text-light">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-text mb-2">Join Our Community</h2>
              <p className="text-text-light">
                Get access to exclusive resources, connect with peers, and stay updated on safety trends.
              </p>
            </div>
            <button className="btn-primary whitespace-nowrap">Join Now</button>
          </div>
        </div>

        {/* Recent Discussions */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-2xl font-bold text-text flex items-center gap-2">
              <MessageCircle size={24} className="text-primary" />
              Recent Discussions
            </h2>
          </div>

          <div className="divide-y divide-border">
            {discussions.map((discussion) => (
              <div key={discussion.id} className="p-6 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-text hover:text-primary transition-colors">
                      {discussion.title}
                    </h3>
                    <p className="text-sm text-text-light mt-1">by {discussion.author}</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-primary text-xs font-semibold rounded-full whitespace-nowrap ml-4">
                    {discussion.category}
                  </span>
                </div>

                <div className="flex items-center gap-6 text-sm text-text-light">
                  <div className="flex items-center gap-1">
                    <MessageCircle size={16} />
                    <span>{discussion.replies} replies</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart size={16} />
                    <span>{discussion.likes} likes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp size={16} />
                    <span>{discussion.views} views</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-text mb-6">Browse by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {["Best Practices", "Integration", "Resources", "Tips & Tricks"].map((category, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow cursor-pointer"
              >
                <Users className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-text">{category}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
