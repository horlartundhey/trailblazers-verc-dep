import { Link } from 'react-router-dom';
import { ArrowRight, Users, Heart, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import heroImg from '../assets/images/IMG_0286-1.jpg';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: 'easeOut', delay },
  }),
};

const Hero = () => {
  return (
    <section className="relative min-h-[92vh] flex flex-col">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="Trailblazers Nation community"
          className="w-full h-full object-cover object-center"
        />
        {/* Main gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/75 via-indigo-900/65 to-indigo-950/85" />
        {/* Extra dark band at top so navbar text is always readable */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center text-center px-4 py-24">
        {/* Pill label */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0}
          className="mb-6 inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 text-white text-base font-semibold px-6 py-2.5 rounded-full"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
          Welcome to Trailblazers Nation
        </motion.div>

        {/* Main heading */}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0.15}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight max-w-4xl"
        >
          Walking Boldly{' '}
          <span className="relative inline-block">
            <span className="text-yellow-300">in Faith</span>
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.8, duration: 0.5, ease: 'easeOut' }}
              className="absolute -bottom-1 left-0 right-0 h-1 bg-yellow-400/60 rounded-full origin-left"
            />
          </span>
          {', Purpose & Love'}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0.3}
          className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl leading-relaxed"
        >
          A family of believers passionate about spreading the light of Jesus Christ
          and empowering individuals to walk boldly in faith, purpose, and love.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0.45}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/interest"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-yellow-400 text-indigo-950 font-bold rounded-full hover:bg-yellow-300 transition-colors shadow-lg shadow-yellow-400/30"
            >
              Join Trailblazers Nation <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/events"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/40 text-white font-semibold rounded-full hover:bg-white/20 transition-colors"
            >
              Upcoming Events
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Stats strip — floats over the bottom edge */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 mx-4 sm:mx-8 lg:mx-auto lg:max-w-4xl -mb-16"
      >
        <div className="bg-white rounded-2xl shadow-xl shadow-indigo-900/20 grid grid-cols-3 divide-x divide-gray-100">
          {[
            { icon: <Heart className="h-5 w-5 text-indigo-600" />, stat: '10+', label: 'Years of Ministry' },
            { icon: <Users className="h-5 w-5 text-indigo-600" />, stat: '500+', label: 'Growing Community' },
            { icon: <Calendar className="h-5 w-5 text-indigo-600" />, stat: '100+', label: 'Events Held' },
          ].map(({ icon, stat, label }) => (
            <div key={label} className="flex flex-col items-center py-5 px-4 text-center">
              <div className="bg-indigo-50 p-2.5 rounded-full mb-2">{icon}</div>
              <span className="text-2xl font-bold text-indigo-950">{stat}</span>
              <span className="text-xs text-gray-500 mt-0.5">{label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Bottom spacer for the floating stats strip */}
      <div className="h-16 bg-white" />
    </section>
  );
};

export default Hero;
