import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQS = [
  {
    q: 'How do I become a member of Trailblazers Nation?',
    a: 'Simply click "Become a Member" or visit our Interest Form page. Fill in your details and one of our team members will reach out to guide you through the onboarding process.',
  },
  {
    q: 'When and where do you hold services?',
    a: 'We hold services every Sunday and mid-week Bible study on Wednesdays at 7pm. Location details and virtual links are shared with registered members.',
  },
  {
    q: 'Is Trailblazers Nation open to everyone?',
    a: 'Absolutely. We welcome everyone regardless of background, age, or where you are in your faith journey. Our doors — physical and virtual — are always open.',
  },
  {
    q: 'How can I register for an event?',
    a: 'Browse our Events section on the homepage. Public events allow guest registration directly; member-only events require you to be a registered member and logged in.',
  },
  {
    q: 'What can I expect at my first service?',
    a: 'Expect a warm welcome, uplifting worship, practical Bible-based teaching, and genuine community. Services typically run 90 minutes. Dress comfortably.',
  },
  {
    q: 'Are there small groups or departments I can join?',
    a: 'Yes! We have various departments including worship, media, ushering, and outreach teams. Members can express interest in any department through their member dashboard.',
  },
  {
    q: 'How do I reset my member account password?',
    a: 'Click "Login" and then "Forgot Password." Enter your registered email address and you will receive a password reset link within a few minutes.',
  },
];

const FAQItem = ({ faq, isOpen, onToggle }) => {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
      >
        <span className={`font-semibold text-sm md:text-base transition-colors ${isOpen ? 'text-indigo-700' : 'text-indigo-950 group-hover:text-indigo-700'}`}>
          {faq.q}
        </span>
        <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-indigo-700 text-white' : 'bg-indigo-50 text-indigo-700 group-hover:bg-indigo-100'}`}>
          {isOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="text-gray-500 text-sm leading-relaxed pb-5 pr-10">{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQAccordion = () => {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-14"
        >
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full mb-4">
            Got Questions?
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-indigo-950 mb-4">Frequently Asked Questions</h2>
          <div className="w-16 h-1 bg-yellow-400 mx-auto rounded-full" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 md:px-8"
        >
          {FAQS.map((faq, i) => (
            <FAQItem
              key={i}
              faq={faq}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center text-sm text-gray-400 mt-8"
        >
          Still have questions?{' '}
          <a href="/contact" className="text-indigo-600 font-medium hover:underline">
            Get in touch with us
          </a>
        </motion.p>
      </div>
    </section>
  );
};

export default FAQAccordion;
