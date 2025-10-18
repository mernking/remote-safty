import {
  ArrowRight,
  CheckCircle,
  Users,
  Zap,
  BarChart3,
  AlertCircle,
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section id="hero" className="relative md:min-h-[80vh] flex flex-col justify-center items-center overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl text-balance">
                The safety compliance you need for{" "}
                <span className="text-primary">enterprise teams</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Streamline safety management, reduce incidents, and ensure
                compliance across all your job sites. Built for safety managers
                and site supervisors.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn btn-primary w-full sm:w-auto">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
              <button
                variant="outline"
                className="btn btn-primary w-full sm:w-auto bg-transparent"
              >
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-y border-border bg-card/50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-sm text-muted-foreground mb-8">
            Trusted by leading safety organizations
          </p>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 items-center justify-items-center">
            <div className="h-12 bg-muted rounded flex items-center justify-center w-full text-muted-foreground font-semibold">
              Logo 1
            </div>
            <div className="h-12 bg-muted rounded flex items-center justify-center w-full text-muted-foreground font-semibold">
              Logo 2
            </div>
            <div className="h-12 bg-muted rounded flex items-center justify-center w-full text-muted-foreground font-semibold">
              Logo 3
            </div>
            <div className="h-12 bg-muted rounded flex items-center justify-center w-full text-muted-foreground font-semibold">
              Logo 4
            </div>
          </div>
        </div>
      </section>

      {/* Feature 1: Image Right */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-4xl font-bold tracking-tight text-foreground">
                  Real-time incident tracking and reporting
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Capture and analyze safety incidents as they happen. Get
                  instant alerts, detailed reports, and actionable insights to
                  prevent future incidents.
                </p>
              </div>
              <ul className="space-y-3">
                <li className="flex gap-3 items-start">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">
                    Instant incident notifications
                  </span>
                </li>
                <li className="flex gap-3 items-start">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">
                    Automated compliance documentation
                  </span>
                </li>
                <li className="flex gap-3 items-start">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">
                    Root cause analysis tools
                  </span>
                </li>
              </ul>
              <button variant="link" className="p-0 h-auto">
                Learn more <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
            <div className="relative overflow-hidden h-96 rounded-lg border border-border flex items-center justify-center">
              <img
                className="h-full object-center"
                src="/images/incident.png"
                alt=""
              />
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2: Image Left */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-card/30">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="relative overflow-hidden h-96 rounded-lg border border-border flex items-center justify-center order-2 lg:order-1">
              <img
                className="h-full object-center"
                src="/images/inspection.png"
                alt=""
              />
            </div>
            <div className="space-y-6 order-1 lg:order-2">
              <div className="space-y-4">
                <h2 className="text-4xl font-bold tracking-tight text-foreground">
                  Automated compliance management
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Stay compliant with OSHA, ISO, and industry-specific
                  regulations. Automated checklists, audit trails, and
                  certification tracking built-in.
                </p>
              </div>
              <ul className="space-y-3">
                <li className="flex gap-3 items-start">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">
                    Multi-standard compliance support
                  </span>
                </li>
                <li className="flex gap-3 items-start">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">
                    Automated audit scheduling
                  </span>
                </li>
                <li className="flex gap-3 items-start">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">
                    Digital certification tracking
                  </span>
                </li>
              </ul>
              <button variant="link" className="p-0 h-auto">
                Learn more <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 3: Image Right */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-4xl font-bold tracking-tight text-foreground">
                  Team collaboration and training
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Empower your team with real-time collaboration tools, safety
                  training modules, and performance tracking to build a
                  safety-first culture.
                </p>
              </div>
              <ul className="space-y-3">
                <li className="flex gap-3 items-start">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">
                    Real-time team communication
                  </span>
                </li>
                <li className="flex gap-3 items-start">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">
                    Built-in training modules
                  </span>
                </li>
                <li className="flex gap-3 items-start">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">
                    Performance analytics
                  </span>
                </li>
              </ul>
              <button variant="link" className="p-0 h-auto">
                Learn more <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
            <div className="relative overflow-hidden h-96 rounded-lg border border-border flex items-center justify-center">
              <img
                className="h-full object-center"
                src="/images/users.png"
                alt=""
              />
            </div>
          </div>
        </div>
      </section>

      {/* Get Started Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-card/30">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-bold tracking-tight text-foreground">
              Get started in minutes
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to implement safety compliance across your
              organization
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              {
                icon: AlertCircle,
                title: "Setup",
                desc: "Configure your safety protocols",
              },
              {
                icon: Users,
                title: "Invite Team",
                desc: "Add team members and roles",
              },
              {
                icon: Zap,
                title: "Deploy",
                desc: "Launch across all job sites",
              },
              {
                icon: BarChart3,
                title: "Monitor",
                desc: "Track metrics and compliance",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-background p-6 space-y-4 text-center"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-bold tracking-tight text-foreground">
              Building success together
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Hear from safety leaders who transformed their operations with
              Saftz
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Sarah Johnson",
                role: "Safety Manager",
                company: "BuildCorp",
                rating: 5,
              },
              {
                name: "Michael Chen",
                role: "Site Supervisor",
                company: "ConstructPro",
                rating: 5,
              },
              {
                name: "Emma Davis",
                role: "Compliance Officer",
                company: "SafetyFirst Inc",
                rating: 5,
              },
            ].map((testimonial, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-card p-6 space-y-4"
              >
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <span key={j} className="text-yellow-400">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-muted-foreground italic">
                  "Saftz has transformed how we manage safety compliance. The
                  real-time incident tracking and automated reporting have
                  reduced our incident response time by 60%."
                </p>
                <div>
                  <p className="font-semibold text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role} at {testimonial.company}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-card/30">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-bold tracking-tight text-foreground">
              Choose your plan
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Flexible pricing for teams of any size
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              {
                name: "Starter",
                price: "$99",
                features: [
                  "Up to 10 users",
                  "Basic incident tracking",
                  "Email support",
                ],
              },
              {
                name: "Professional",
                price: "$299",
                features: [
                  "Up to 50 users",
                  "Advanced analytics",
                  "Priority support",
                  "Custom integrations",
                ],
                highlight: true,
              },
              {
                name: "Enterprise",
                price: "$999",
                features: [
                  "Unlimited users",
                  "Full compliance suite",
                  "24/7 support",
                  "Dedicated account manager",
                ],
              },
              {
                name: "Custom",
                price: "Contact",
                features: [
                  "Custom features",
                  "On-premise option",
                  "SLA guarantee",
                  "Custom training",
                ],
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`rounded-lg border p-8 space-y-6 ${
                  plan.highlight
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background"
                }`}
              >
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {plan.name}
                  </h3>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {plan.price}
                  </p>
                  {plan.price !== "Contact" && (
                    <p className="text-sm text-muted-foreground">/month</p>
                  )}
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex gap-2 items-start">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  className="w-full btn btn-primary"
                  variant={plan.highlight ? "default" : "outline"}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold tracking-tight text-foreground">
              Start building a safer workplace today
            </h2>
            <p className="text-lg text-muted-foreground">
              Join hundreds of organizations improving safety compliance with
              Saftz.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn btn-primary w-full sm:w-auto">
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
            <button
              className="btn btn-accent w-full sm:w-auto"
              variant="outline"
            >
              Schedule Demo
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
