"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import About from "@/components/landing/About";
import Team from "@/components/landing/Team";
import Testimonials from "@/components/landing/Testimonials";
import Footer from "@/components/landing/Footer";
import LoadingScreen from "@/components/landing/LoadingScreen";
import CrossPlatformSection from "@/components/landing/CrossPlatformSection";
import TerminalScreenWrapper from "@/components/landing/TerminalScreenWrapper";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time (e.g., 1.5 seconds)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <TerminalScreenWrapper>
      {isLoading && <LoadingScreen />}
      <Navbar />
      <main>
        <section id="home">
          <Hero />
        </section>
        <section id="about">
          <About />
        </section>
        <section id="team">
          <Team />
        </section>
        <section id="testimonials">
          <Testimonials />
        </section>
        <section id="cross-platform">
          <CrossPlatformSection />
        </section>
      </main>
      <Footer />
    </TerminalScreenWrapper>
  );
}
