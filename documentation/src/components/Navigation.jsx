"use client";

import Link from "next/link";
import { Shield, Github, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Shield className="h-8 w-8 text-purple-500" />
            <span className="text-xl font-bold text-white">SafetyOS</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Features
            </Link>
            <Link
              href="#api"
              className="text-gray-300 hover:text-white transition-colors"
            >
              API
            </Link>
            <Link
              href="#docs"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Docs
            </Link>
            <Link
              href="#getting-started"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Get Started
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6 text-white" />
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-gray-900 border-gray-800">
              <div className="flex flex-col gap-4 mt-8">
                <Link
                  href="#features"
                  className="text-gray-300 hover:text-white transition-colors text-lg"
                >
                  Features
                </Link>
                <Link
                  href="#api"
                  className="text-gray-300 hover:text-white transition-colors text-lg"
                >
                  API
                </Link>
                <Link
                  href="#docs"
                  className="text-gray-300 hover:text-white transition-colors text-lg"
                >
                  Docs
                </Link>
                <Link
                  href="#getting-started"
                  className="text-gray-300 hover:text-white transition-colors text-lg"
                >
                  Get Started
                </Link>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors text-lg flex items-center gap-2"
                >
                  <Github className="h-5 w-5" />
                  GitHub
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
