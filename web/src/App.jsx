import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductShowcase from './components/ProductShowcase';
import About from './components/About';
import Team from './components/Team';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import LoadingScreen from './components/LoadingScreen';
import CrossPlatformSection from './components/CrossPlatformSection';
import TerminalScreenWrapper from './components/TerminalScreenWrapper';

function App() {
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
        <section id="product">
          <ProductShowcase />
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

export default App;
