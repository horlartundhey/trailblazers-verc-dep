import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Footer from '../components/Footer';
import About from '../components/About';
import Events from '../components/Events';
import Gallery from '../components/Gallery';

const Index = () => {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Hero />        
        <About />
        <Events />
        {/* <Gallery /> */}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
