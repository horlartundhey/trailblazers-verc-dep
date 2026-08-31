import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const col = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const Footer = () => {
  return (
    <footer className="bg-indigo-950 pt-16 pb-6">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12"
        >
          {/* Brand */}
          <motion.div variants={col} className="lg:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <span className="text-xl font-bold text-white tracking-tight">
                Trailblazers{' '}
                <span className="text-yellow-400">Nation</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              A family of believers passionate about spreading the light of Christ and empowering individuals to walk boldly in faith.
            </p>
            <div className="flex space-x-3">
              {[
                { icon: <Facebook size={16} />, href: '#' },
                { icon: <Instagram size={16} />, href: '#' },
                { icon: <Youtube size={16} />, href: '#' },
              ].map(({ icon, href }, i) => (
                <motion.a
                  key={i}
                  href={href}
                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(99,102,241,0.8)' }}
                  className="w-8 h-8 bg-indigo-800 rounded-full flex items-center justify-center text-gray-300 hover:text-white transition-colors"
                >
                  {icon}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={col}>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Home', to: '/' },
                { label: 'About Us', to: '/about' },
                { label: 'Events', to: '/events' },
                { label: 'Gallery', to: '/gallery' },
                { label: 'Contact', to: '/contact' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-gray-400 hover:text-yellow-400 text-sm transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Resources */}
          <motion.div variants={col}>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Get Involved</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Become a Member', to: '/register' },
                { label: 'Member Login', to: '/login' },
                { label: 'Upcoming Events', to: '/events' },
                { label: 'Privacy Policy', to: '/privacy' },
                { label: 'FAQ', to: '/faq' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-gray-400 hover:text-yellow-400 text-sm transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div variants={col}>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Mail size={15} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 text-sm">thetrailblazersnation@gmail.com</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={15} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 text-sm">+2349068298416</span>
              </li>
            </ul>
            <div className="mt-6">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/interest"
                  className="inline-block px-5 py-2.5 bg-yellow-400 text-indigo-950 text-sm font-bold rounded-full hover:bg-yellow-300 transition-colors"
                >
                  Join the Community
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-indigo-900">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Trailblazers Nation. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
