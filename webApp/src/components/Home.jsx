import {
  ArrowRight,
  CheckCircle,
  Users,
  Zap,
  BarChart3,
  AlertCircle,
  Github,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-text">
      <section
        id="hero"
        className="relative flex flex-col items-center justify-center overflow-hidden px-4 py-24 sm:px-6 lg:px-8 md:min-h-screen"
      >
        <div className="mx-auto max-w-6xl">
          <div className="space-y-8 text-center">
            <div className="space-y-4">
              <h1 className="text-balance text-5xl font-bold tracking-tight text-text sm:text-6xl lg:text-7xl">
                Build a Safer Tomorrow, Together. Open Source Safety Management.
              </h1>
              <p className="mx-auto max-w-3xl leading-relaxed text-lg text-gray-400">
                An open-source, self-hostable platform for safety management.
                Streamline inspections, report incidents, and ensure compliance
                with a tool you control.
              </p>
            </div>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link to="/signup" className="btn btn-primary w-full sm:w-auto">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <a
                href="https://github.com/mernking/remote-safty"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary w-full sm:w-auto"
              >
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </a>
            </div>
            <div className="w-full flex justify-center items-center">
              <a
                href="https://chidavid.netlify.app/contact"
                target="_blank"
                rel="noopener noreferrer"
              >
                <button className="btn btn-link">
                  contact me for support{" "}
                  <span>
                    <User />
                  </span>
                </button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
