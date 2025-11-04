import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { TechStack } from "@/components/TechStack";
import { ApiDocs } from "@/components/ApiDocs";
import { GettingStarted } from "@/components/GettingStarted";
import { OpenSource } from "@/components/OpenSource";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      <Navigation />
      <Hero />
      <Features />
      <TechStack />
      <ApiDocs />
      <GettingStarted />
      <OpenSource />
      <Footer />
    </main>
  );
}
