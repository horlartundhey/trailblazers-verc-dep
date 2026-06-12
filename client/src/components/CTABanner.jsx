import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const CTA_BG = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&q=80';

const CTABanner = () => {
  return (
    <section className="relative py-28 overflow-hidden">
      {/* Background image with dark overlay */}
      <div className="absolute inset-0">
        <img
          src={CTA_BG}
          alt=""
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/80" />
      </div>

      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative container mx-auto px-4 md:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-yellow-400 bg-yellow-400/15 border border-yellow-400/30 px-4 py-1.5 rounded-full mb-6">
            Ready to Begin?
          </span>

          <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight max-w-2xl mx-auto mb-6">
            Start Your Journey With{' '}
            <span className="text-yellow-400">Trailblazers Nation</span>
          </h2>

          <p className="text-white/65 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Whether you're new to faith or looking for a community that goes deeper — there's a place for you here.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/interest"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-yellow-400 text-indigo-950 font-bold rounded-full hover:bg-yellow-300 transition-colors shadow-lg shadow-yellow-400/25"
              >
                Join the Community <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-white/60 text-white font-semibold rounded-full hover:bg-white/10 hover:border-white transition-colors"
              >
                Talk to Us
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTABanner;
