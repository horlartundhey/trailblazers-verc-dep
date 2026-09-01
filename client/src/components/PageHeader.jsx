import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut', delay },
  }),
};

// Shared dark-gradient header band for standalone pages (About, Events,
// Gallery, Contact) — mirrors Hero's pill-label/heading pattern so the
// fixed Navbar reads correctly on pages that don't have a hero image.
const PageHeader = ({ eyebrow, title, subtitle, children }) => {
  return (
    <section className="relative bg-gradient-to-b from-indigo-950 via-indigo-900 to-indigo-950 pt-32 pb-20 px-4 overflow-hidden">
      {/* Extra dark band at top so navbar text is always readable */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent" />

      <div className="relative max-w-4xl mx-auto text-center">
        {eyebrow && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={0}
            className="mb-5 inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold px-5 py-2 rounded-full"
          >
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            {eyebrow}
          </motion.div>
        )}

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0.1}
          className="text-4xl sm:text-5xl font-bold text-white tracking-tight"
        >
          {title}
        </motion.h1>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }}
          className="w-20 h-1 bg-yellow-400 mx-auto mt-5 rounded-full origin-center"
        />

        {subtitle && (
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={0.25}
            className="mt-5 text-lg text-white/75 max-w-2xl mx-auto leading-relaxed"
          >
            {subtitle}
          </motion.p>
        )}

        {children}
      </div>
    </section>
  );
};

export default PageHeader;
