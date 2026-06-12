import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

const TESTIMONIALS = [
  {
    name: 'Adaeze Okonkwo',
    role: 'Member since 2019',
    quote: 'Joining Trailblazers Nation completely transformed my walk with God. The community here is unlike anything I\'ve experienced — genuine, warm, and purpose-driven.',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&q=80',
  },
  {
    name: 'Emeka Nwosu',
    role: 'Member since 2020',
    quote: 'I came in broken and found a family. The teachings are life-changing and the people are even better. This is where I found my God-given purpose.',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80',
  },
  {
    name: 'Blessing Adeyemi',
    role: 'Member since 2021',
    quote: 'The events, the Bible studies, the genuine love — Trailblazers Nation is a safe haven. I\'ve grown more in two years here than in my entire faith journey before.',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80',
  },
];

const cardVariant = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};

const Testimonials = () => {
  return (
    <section className="py-20 bg-indigo-950">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-14"
        >
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-yellow-400 bg-yellow-400/10 px-4 py-1.5 rounded-full mb-4">
            Community Voices
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">What Our Members Say</h2>
          <div className="w-16 h-1 bg-yellow-400 mx-auto rounded-full" />
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.15 } } }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {TESTIMONIALS.map((t) => (
            <motion.div
              key={t.name}
              variants={cardVariant}
              whileHover={{ y: -4 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex flex-col"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed flex-1 mb-6">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-indigo-600"
                />
                <div>
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-indigo-400 text-xs">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
