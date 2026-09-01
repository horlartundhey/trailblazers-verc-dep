import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Compass, Sparkles, Users2, HandHeart, GraduationCap, PartyPopper, HeartHandshake } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import PageHeader from '../components/PageHeader';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut', delay },
  }),
};

const whatWeDo = [
  { icon: HandHeart, text: 'Regular worship and fellowship meetings' },
  { icon: GraduationCap, text: 'Leadership development programs' },
  { icon: Users2, text: 'Community outreach initiatives' },
  { icon: HeartHandshake, text: 'Mentorship programs' },
  { icon: Sparkles, text: 'Youth empowerment workshops' },
  { icon: PartyPopper, text: 'Social and spiritual events' },
];

const About = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50">
        <PageHeader
          eyebrow="Who We Are"
          title="About Trailblazers Nation"
          subtitle="A dynamic Christian community dedicated to empowering young people through faith, leadership, and service."
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 pb-20">
          <BackButton />

          {/* Mission & Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: Compass,
                title: 'Our Mission',
                body: 'To nurture and develop young Christian leaders who will make a positive impact in their communities through faith-based initiatives, mentorship, and community service.',
              },
              {
                icon: Heart,
                title: 'Our Vision',
                body: 'To create a global network of empowered young Christians who lead with integrity, serve with compassion, and inspire positive change in their communities.',
              },
            ].map(({ icon: Icon, title, body }, i) => (
              <motion.div
                key={title}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-80px' }}
                custom={i * 0.15}
                className="bg-white rounded-2xl shadow-lg shadow-indigo-900/5 p-8"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-5">
                  <Icon className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-indigo-950 mb-3">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{body}</p>
              </motion.div>
            ))}
          </div>

          {/* What We Do */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            custom={0.2}
            className="mt-8 bg-white rounded-2xl shadow-lg shadow-indigo-900/5 p-8"
          >
            <h3 className="text-2xl font-bold text-indigo-950 mb-6 text-center">What We Do</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {whatWeDo.map(({ icon: Icon, text }, i) => (
                <motion.div
                  key={text}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: '-40px' }}
                  custom={i * 0.08}
                  className="flex items-start gap-3 p-4 rounded-xl bg-gray-50"
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-indigo-600" />
                  </div>
                  <span className="text-gray-700 leading-snug pt-1.5">{text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
