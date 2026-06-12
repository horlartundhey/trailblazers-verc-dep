import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../utils/api';

const FALLBACK_IMAGES = [
  { id: 1, src: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80', alt: 'Community gathering' },
  { id: 2, src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80', alt: 'Fellowship' },
  { id: 3, src: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80', alt: 'Worship' },
  { id: 4, src: 'https://images.unsplash.com/photo-1576267423048-15c0040fec78?w=800&q=80', alt: 'Praise' },
  { id: 5, src: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&q=80', alt: 'Community' },
  { id: 6, src: 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=800&q=80', alt: 'Together' },
];

const GalleryPreview = () => {
  const [images, setImages] = useState([]);
  const [lightbox, setLightbox] = useState(null); // index of open image

  useEffect(() => {
    API.get('/api/gallery')
      .then(res => {
        const data = res.data?.data || [];
        setImages(data.slice(0, 6));
      })
      .catch(() => setImages([]));
  }, []);

  const displayImages = images.length >= 3 ? images : FALLBACK_IMAGES;

  const openLightbox = (i) => setLightbox(i);
  const closeLightbox = () => setLightbox(null);
  const prev = () => setLightbox(i => (i - 1 + displayImages.length) % displayImages.length);
  const next = () => setLightbox(i => (i + 1) % displayImages.length);

  // Close on Escape key
  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox]);

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full mb-4">
            Our Moments
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-indigo-950 mb-4">Life at Trailblazers</h2>
          <div className="w-16 h-1 bg-yellow-400 mx-auto rounded-full" />
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
        >
          {displayImages.map((img, i) => (
            <motion.div
              key={img._id || img.id}
              variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } } }}
              whileHover={{ scale: 1.02 }}
              onClick={() => openLightbox(i)}
              className={`relative overflow-hidden rounded-2xl group cursor-pointer ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
              style={{ height: i === 0 ? '360px' : '172px' }}
            >
              <img
                src={img.src || img.url}
                alt={img.alt || img.caption || 'Gallery'}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Hover overlay with expand hint */}
              <div className="absolute inset-0 bg-indigo-950/0 group-hover:bg-indigo-950/40 transition-all duration-300 flex items-center justify-center">
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ opacity: 1, scale: 1 }}
                  className="opacity-0 group-hover:opacity-100 text-white text-xs font-semibold tracking-widest uppercase bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full transition-opacity duration-300"
                >
                  View
                </motion.span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-center mt-10"
        >
          <Link
            to="/gallery"
            className="inline-flex items-center gap-2 px-7 py-3 border-2 border-indigo-700 text-indigo-700 font-semibold rounded-full hover:bg-indigo-700 hover:text-white transition-colors"
          >
            View All Photos <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            {/* Image container */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative max-w-5xl max-h-[85vh] w-full flex items-center justify-center"
              onClick={e => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={lightbox}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  src={displayImages[lightbox]?.src || displayImages[lightbox]?.url}
                  alt={displayImages[lightbox]?.alt || displayImages[lightbox]?.caption || ''}
                  className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl"
                />
              </AnimatePresence>

              {/* Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
                {lightbox + 1} / {displayImages.length}
              </div>
            </motion.div>

            {/* Close */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Prev */}
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            {/* Next */}
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default GalleryPreview;
