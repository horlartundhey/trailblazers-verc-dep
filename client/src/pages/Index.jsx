import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import About from '../components/About';
import Events from '../components/Events';
import GalleryPreview from '../components/GalleryPreview';
import QuoteCarousel from '../components/QuoteCarousel';
import Testimonials from '../components/Testimonials';
import FAQAccordion from '../components/FAQAccordion';
import CTABanner from '../components/CTABanner';
import Footer from '../components/Footer';

const Index = () => {
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
        <GalleryPreview />
        <QuoteCarousel />
        <Testimonials />
        <FAQAccordion />
        <CTABanner />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
