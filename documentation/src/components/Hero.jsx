"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Github, Shield } from "lucide-react";

export function Hero() {
  return (
    <section className="hero-gradient min-h-screen flex items-center justify-center px-4 pt-16">
      <div className="container mx-auto text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 mb-8">
          <Shield className="h-4 w-4 text-purple-400" />
          <span className="text-sm text-purple-300">
            Open Source Safety Management
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
          The Safety Platform
          <br />
          <span className="gradient-text">for Remote Jobsites</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
          A comprehensive offline-first PWA for managing safety inspections,
          incident reporting, and compliance tracking on remote construction
          sites.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            size="lg"
            className="btn-primary text-white px-8 py-6 text-lg rounded-lg font-semibold"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-gray-600 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-lg font-semibold"
          >
            <Github className="mr-2 h-5 w-5" />
            GitHub
          </Button>
        </div>

        {/* Animated Icon */}
        <div className="mt-20">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-purple-500/30 blur-3xl rounded-full animate-pulse"></div>
            <div className="relative bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8">
              <Shield className="h-24 w-24 text-purple-400" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
