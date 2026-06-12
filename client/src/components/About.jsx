import { useState, useEffect } from 'react';
import { Users, Cross, HeartHandshake, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import gal1 from '../assets/images/gal_one.jpg';
import gal2 from '../assets/images/gal_two.jpg';
import gal3 from '../assets/images/gal_three.jpg';
import gal4 from '../assets/images/gal_four.jpg';
import gal5 from '../assets/images/gal_five.jpg';
import gal6 from '../assets/images/gal_six.jpg';
import gal7 from '../assets/images/gal_sev.jpg';
import gal8 from '../assets/images/gal_eigh.jpg';
import extra from '../assets/images/IMG_0533.jpg';

const CAROUSEL_IMAGES = [gal1, gal2, gal3, gal4, gal5, gal6, gal7, gal8, extra];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const slideVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.55, ease: 'easeOut' } },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -60 : 60, transition: { duration: 0.35, ease: 'easeIn' } }),
};

const features = [
  {
    icon: <Cross className="h-6 w-6 text-indigo-700" />,
    title: 'Our Faith',
    description: 'We are grounded in the truth of the Gospel and committed to sharing the love of Christ.',
  },
  {
    icon: <Users className="h-6 w-6 text-indigo-700" />,
    title: 'Our Community',
    description: 'A diverse family united in purpose, supporting one another in faith and life.',
  },
  {
    icon: <HeartHandshake className="h-6 w-6 text-indigo-700" />,
    title: 'Our Mission',
    description: 'To empower believers to live out their God-given purpose in their communities.',
  },
  {
    icon: <BookOpen className="h-6 w-6 text-indigo-700" />,
    title: 'Our Values',
    description: 'Biblical truth, authentic relationships, radical generosity, and joyful service.',
  },
];

const StoryCarousel = () => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const go = (dir) => {
    setDirection(dir);
    setIndex(i => (i + dir + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length);
  };

  useEffect(() => {
    const t = setInterval(() => go(1), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[4/3] w-full">
      {/* Image */}
      <AnimatePresence initial={false} custom={direction} mode="sync">
        <motion.img
          key={index}
          src={CAROUSEL_IMAGES[index]}
          alt="Trailblazers community"
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>

      {/* Gradient overlay at bottom for controls */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

      {/* Prev / Next */}
      <button
        onClick={() => go(-1)}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => go(1)}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
        {CAROUSEL_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
            className={`rounded-full transition-all duration-300 ${
              i === index ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const About = () => {
  return (
    <section className="pt-28 pb-20 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">

        {/* Section header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full mb-4">
            Who We Are
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-indigo-950 mb-4">
            About Trailblazers Nation
          </h2>
          <div className="w-16 h-1 bg-yellow-400 mx-auto mb-6 rounded-full" />
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We are a movement of believers committed to transforming lives through the power of the Gospel.
          </p>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariant}
              whileHover={{ y: -4, boxShadow: '0 12px 28px -8px rgba(79,70,229,0.15)' }}
              className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm cursor-default"
            >
              <div className="flex justify-center mb-4">
                <div className="bg-indigo-50 p-4 rounded-full">
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-lg font-bold text-indigo-950 mb-2">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Our Story */}
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Image Carousel */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="lg:w-1/2 w-full"
          >
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-32 h-32 bg-indigo-100 rounded-full opacity-50 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-4 -right-4 w-40 h-40 bg-yellow-100 rounded-full opacity-50 blur-2xl pointer-events-none" />
              <div className="relative">
                <StoryCarousel />
              </div>
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="lg:w-1/2"
          >
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full mb-4">
              Our Story
            </span>
            <h3 className="text-2xl md:text-3xl font-bold text-indigo-950 mb-4">
              From 12 People to a Movement
            </h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Founded in 2008, Trailblazers Nation began as a small Bible study group with a big vision.
              What started with just 12 people meeting in a living room has grown into a vibrant
              community impacting thousands across the nation.
            </p>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Through years of prayer, worship, and service, we've seen lives transformed, families restored,
              and communities renewed by the power of God's love.
            </p>
            <div className="bg-indigo-50 border-l-4 border-indigo-500 rounded-r-xl p-5">
              <p className="italic text-indigo-900 leading-relaxed">
                "For we are God's handiwork, created in Christ Jesus to do good works,
                which God prepared in advance for us to do."
              </p>
              <p className="text-indigo-600 text-sm font-semibold mt-2">— Ephesians 2:10</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
