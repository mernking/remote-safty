"use client";

import Link from "next/link";
import { Shield, Github, Twitter, Linkedin, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-black py-12 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-6 w-6 text-purple-500" />
              <span className="text-lg font-bold text-white">SafetyOS</span>
            </div>
            <p className="text-gray-400 text-sm">
              Open source safety management for remote jobsites
            </p>
          </div>

          {/* Documentation */}
          <div>
            <h3 className="text-white font-semibold mb-4">Documentation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="#getting-started"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Getting Started
                </Link>
              </li>
              <li>
                <Link
                  href="#api"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  API Reference
                </Link>
              </li>
              <li>
                <Link
                  href="#features"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/deployment"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Deployment Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/issues"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Issue Tracker
                </a>
              </li>
              <li>
                <a
                  href="/changelog"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Changelog
                </a>
              </li>
              <li>
                <a
                  href="/contributing"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Contributing
                </a>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-white font-semibold mb-4">Community</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://discord.gg"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Discord Chat
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Twitter/X
                </a>
              </li>
              <li>
                <a
                  href="mailto:contact@safetyos.dev"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="/blog"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Blog
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-800">
          <div className="text-gray-400 text-sm mb-4 md:mb-0">
            Released under the MIT License. Copyright © 2025 SafetyOS
            Contributors
          </div>
          <div className="flex gap-4">
            <a
              href="https://github.com"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="https://twitter.com"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="https://linkedin.com"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Linkedin className="h-5 w-5" />
            </a>
            <a
              href="mailto:contact@safetyos.dev"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
