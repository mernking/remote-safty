"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { HardHat, Menu, Shield, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-accent border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <div className="relative scale-50 sm:scale-70">
              <Shield className="w-16 h-16 text-primary" />
              <HardHat className="w-8 h-8 text-secondary absolute -bottom-1 -right-1" />
            </div>
            <span className="font-bold text-xl text-primary hidden sm:inline">
              Saftz
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-text hover:text-primary transition-colors"
            >
              Home
            </Link>
            <Link
              to="/support"
              className="text-text hover:text-primary transition-colors"
            >
              Support
            </Link>
            <Link
              to="/community"
              className="text-text hover:text-primary transition-colors"
            >
              Community
            </Link>
            <Link
              to="/contact"
              className="text-text hover:text-primary transition-colors"
            >
              Contact
            </Link>
            <Link to="/login" className="btn btn-outline">
              Login
            </Link>
            <Link to="/signup" className="btn btn-primary">
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link
              to="/"
              className="block px-4 py-2 text-text hover:bg-gray-100 rounded"
            >
              Home
            </Link>
            <Link
              to="/support"
              className="block px-4 py-2 text-text hover:bg-gray-100 rounded"
            >
              Support
            </Link>
            <Link
              to="/community"
              className="block px-4 py-2 text-text hover:bg-gray-100 rounded"
            >
              Community
            </Link>
            <Link
              to="/contact"
              className="block px-4 py-2 text-text hover:bg-gray-100 rounded"
            >
              Contact
            </Link>
            <Link
              to="/login"
              className="block px-4 py-2 text-primary hover:bg-gray-100 rounded"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="block px-4 py-2 btn btn-primary"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
