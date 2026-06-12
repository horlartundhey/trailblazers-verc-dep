import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QUOTES = [
  {
    text: "You were not created to blend in. You were created to blaze a trail.",
    author: "Trailblazers Nation",
    bg: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&q=80",
  },
  {
    text: "Faith is taking the first step even when you can't see the whole staircase.",
    author: "Martin Luther King Jr.",
    bg: "https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=1200&q=80",
  },
  {
    text: "God's plans for you are greater than the obstacles in front of you.",
    author: "Trailblazers Nation",
    bg: "https://images.unsplash.com/photo-1470115636492-6d2b56f9146d?w=1200&q=80",
  },
  {
    text: "A community that prays together, stays together. Build your tribe intentionally.",
    author: "Trailblazers Nation",
    bg: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80",
  },
  {
    text: "Purpose is not found, it is built — one faithful step at a time.",
    author: "Trailblazers Nation",
    bg: "https://images.unsplash.com/photo-1455849318743-b2233052fcff?w=1200&q=80",
  },
];

const variants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -60 : 60, transition: { duration: 0.35, ease: 'easeIn' } }),
};

const QuoteCarousel = () => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const go = (dir) => {
    setDirection(dir);
    setIndex(i => (i + dir + QUOTES.length) % QUOTES.length);
  };

  useEffect(() => {
    const t = setInterval(() => go(1), 6000);
    return () => clearInterval(t);
  }, []);

  const quote = QUOTES[index];

  return (
    <section className="relative py-0 overflow-hidden" style={{ height: '480px' }}>
      {/* Background image */}
      <AnimatePresence initial={false} custom={direction} mode="sync">
        <motion.div
          key={`bg-${index}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <img src={quote.bg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-indigo-950/75" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center px-6 text-center max-w-3xl mx-auto">
        <Quote className="h-10 w-10 text-yellow-400 opacity-60 mb-6" />

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <p className="text-2xl md:text-3xl font-semibold text-white leading-relaxed mb-6">
              "{quote.text}"
            </p>
            <p className="text-yellow-400 font-medium text-sm uppercase tracking-widest">
              — {quote.author}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <div className="flex items-center gap-6 mt-10">
          <button
            onClick={() => go(-1)}
            className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex gap-2">
            {QUOTES.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
                className={`rounded-full transition-all duration-300 ${i === index ? 'w-6 h-2 bg-yellow-400' : 'w-2 h-2 bg-white/30 hover:bg-white/50'}`}
              />
            ))}
          </div>
          <button
            onClick={() => go(1)}
            className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default QuoteCarousel;
