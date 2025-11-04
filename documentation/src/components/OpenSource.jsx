"use client";

import { Heart, Github, Star, GitFork, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OpenSource() {
  return (
    <section className="py-24 px-4 bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto">
        {/* Heart Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-pink-500/10 rounded-full">
            <Heart className="h-12 w-12 text-pink-400" fill="currentColor" />
          </div>
        </div>

        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Free & Open Source
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            SafetyOS is MIT Licensed and will always be free and open source.
            Built by the community, for the community.
          </p>
        </div>

        {/* GitHub Stats */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="feature-card rounded-xl p-6 text-center">
              <Star className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-1">1.2k+</div>
              <div className="text-gray-400">GitHub Stars</div>
            </div>
            <div className="feature-card rounded-xl p-6 text-center">
              <GitFork className="h-8 w-8 text-blue-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-1">200+</div>
              <div className="text-gray-400">Forks</div>
            </div>
            <div className="feature-card rounded-xl p-6 text-center">
              <Users className="h-8 w-8 text-green-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-1">50+</div>
              <div className="text-gray-400">Contributors</div>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="feature-card rounded-xl p-8">
            <h3 className="text-2xl font-semibold text-white mb-6 text-center">
              Why Open Source?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-semibold mb-2">
                  ✓ Transparency
                </h4>
                <p className="text-gray-400 text-sm">
                  Audit the code, know exactly how your data is handled
                </p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">
                  ✓ Community-Driven
                </h4>
                <p className="text-gray-400 text-sm">
                  Contribute features, report bugs, shape the future
                </p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">
                  ✓ No Vendor Lock-in
                </h4>
                <p className="text-gray-400 text-sm">
                  Host it yourself, customize to your needs
                </p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">
                  ✓ Forever Free
                </h4>
                <p className="text-gray-400 text-sm">
                  MIT License means it's free forever
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            size="lg"
            className="btn-primary text-white px-8 py-6 text-lg"
          >
            <Github className="mr-2 h-5 w-5" />
            Star on GitHub
          </Button>
          <p className="text-gray-500 text-sm mt-4">
            Released under the MIT License
          </p>
        </div>
      </div>
    </section>
  );
}
