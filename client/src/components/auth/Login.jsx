import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { login, clearError } from '../../redux/slices/authSlice';
import collage from '../../assets/images/collage.png';
import { Mail, Lock } from 'lucide-react';

const BLOBS = [
  { w: 320, h: 320, top: '-12%', left: '-12%', delay: 0,   dur: 6 },
  { w: 200, h: 200, top: '62%',  left: '4%',   delay: 1.5, dur: 8 },
  { w: 140, h: 140, top: '18%',  left: '58%',  delay: 0.8, dur: 7 },
  { w: 100, h: 100, top: '78%',  left: '62%',  delay: 2,   dur: 5 },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// Left panel transitions: gradient exits right, form enters from left
const leftEnter  = { x: -60, opacity: 0 };
const leftCenter = { x: 0,   opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } };
const leftExit   = { x: 60,  opacity: 0, transition: { duration: 0.35, ease: 'easeIn'  } };

// Right panel transitions: collage exits left, gradient enters from right
const rightEnter  = { x: 60,  opacity: 0 };
const rightCenter = { x: 0,   opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } };
const rightExit   = { x: -60, opacity: 0, transition: { duration: 0.35, ease: 'easeIn'  } };

const GradientBlobs = () => (
  <>
    {BLOBS.map((b, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full pointer-events-none"
        style={{ width: b.w, height: b.h, top: b.top, left: b.left, background: 'rgba(255,255,255,0.08)' }}
        animate={{ y: [0, -22, 0], scale: [1, 1.04, 1] }}
        transition={{ duration: b.dur, delay: b.delay, repeat: Infinity, ease: 'easeInOut' }}
      />
    ))}
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ width: 190, height: 190, bottom: '6%', right: '-6%', background: 'rgba(167,139,250,0.18)' }}
      animate={{ y: [0, 20, 0], scale: [1, 0.96, 1] }}
      transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
    />
  </>
);

const Login = () => {
  const [showForm, setShowForm]     = useState(false);
  const [formData, setFormData]     = useState({ email: '', password: '' });
  const [formErrors, setFormErrors] = useState({});
  const [shaking, setShaking]       = useState(false);

  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.auth);

  useEffect(() => {
    if (error) {
      setShaking(true);
      const t = setTimeout(() => setShaking(false), 550);
      return () => clearTimeout(t);
    }
  }, [error]);

  const handleShowForm = () => { dispatch(clearError()); setShowForm(true); };
  const handleBack     = () => { dispatch(clearError()); setShowForm(false); };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (formErrors[e.target.name]) setFormErrors({ ...formErrors, [e.target.name]: '' });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email is invalid';
    if (!formData.password) errors.password = 'Password is required';
    else if (formData.password.length < 8) errors.password = 'Password must be at least 8 characters';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try { await dispatch(login(formData)).unwrap(); }
      catch (_) {}
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-white">

      {/* ══════════════════════════════════════
          LEFT COLUMN
          State 1 → gradient welcome panel
          State 2 → white form panel
      ══════════════════════════════════════ */}
      <div className="hidden md:block md:w-1/2 relative overflow-hidden min-h-screen">
        <AnimatePresence mode="wait">

          {/* State 1 — Gradient welcome */}
          {!showForm && (
            <motion.div
              key="welcome"
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #4338ca 0%, #7c3aed 55%, #312e81 100%)' }}
              initial={leftEnter}
              animate={leftCenter}
              exit={leftExit}
            >
              <GradientBlobs />
              <div className="relative z-10 text-center px-12 max-w-sm">
                <div className="mb-8 inline-flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-white font-bold text-xs tracking-wide">TN</span>
                  </div>
                  <span className="text-white/80 text-sm font-medium tracking-wide">The Trailblazers Nation</span>
                </div>
                <h1 className="text-4xl font-bold text-white leading-tight mb-4">Welcome Back</h1>
                <p className="text-indigo-200 text-sm leading-relaxed mb-8">
                  To keep connected with us please sign in with your personal info
                </p>
                <button
                  type="button"
                  onClick={handleShowForm}
                  className="px-10 py-2.5 rounded-full border-2 border-white/50 text-white text-xs font-semibold tracking-widest uppercase hover:bg-white/10 transition-colors duration-200"
                >
                  Sign In
                </button>
                <div className="mt-6">
                  <Link to="/" className="text-indigo-300 text-xs hover:text-white transition-colors">
                    ← Back to Home
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* State 2 — Form panel */}
          {showForm && (
            <motion.div
              key="form"
              className="absolute inset-0 flex flex-col justify-center px-10 xl:px-16 bg-white"
              initial={leftEnter}
              animate={leftCenter}
              exit={leftExit}
            >
              {/* Logo */}
              <div className="absolute top-8 left-8 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">TN</span>
                </div>
                <span className="text-sm font-semibold text-gray-700">The Trailblazers Nation</span>
              </div>

              <motion.div
                className="max-w-sm w-full mx-auto"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Heading */}
                <motion.div variants={fieldVariants} className="mb-6 text-center">
                  <h2
                    className="text-3xl font-bold"
                    style={{ background: 'linear-gradient(135deg, #4338ca, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                  >
                    Sign In
                  </h2>
                  <p className="mt-3 text-xs text-gray-400 tracking-wide">or use your email account</p>
                </motion.div>

                {/* Error banner */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="mb-4 flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-xs"
                    >
                      <span>{error}</span>
                      <button type="button" onClick={() => dispatch(clearError())} className="text-red-400 hover:text-red-600">✕</button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                <motion.form
                  onSubmit={handleSubmit}
                  animate={shaking ? { x: [0, -10, 10, -10, 10, -6, 6, 0] } : { x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4"
                >
                  {/* Email */}
                  <motion.div variants={fieldVariants}>
                    <div className={`flex items-center gap-3 px-5 py-3.5 rounded-full bg-gray-100 ${formErrors.email ? 'ring-1 ring-red-400' : ''}`}>
                      <Mail size={16} className="text-gray-400 flex-shrink-0" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email"
                        className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
                      />
                    </div>
                    {formErrors.email && <p className="mt-1 ml-4 text-xs text-red-500">{formErrors.email}</p>}
                  </motion.div>

                  {/* Password */}
                  <motion.div variants={fieldVariants}>
                    <div className={`flex items-center gap-3 px-5 py-3.5 rounded-full bg-gray-100 ${formErrors.password ? 'ring-1 ring-red-400' : ''}`}>
                      <Lock size={16} className="text-gray-400 flex-shrink-0" />
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Password"
                        className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
                      />
                    </div>
                    {formErrors.password && <p className="mt-1 ml-4 text-xs text-red-500">{formErrors.password}</p>}
                  </motion.div>

                  {/* Forgot password */}
                  <motion.div variants={fieldVariants} className="text-right">
                    <Link to="/forgot-password" className="text-xs text-gray-400 hover:text-indigo-600 transition-colors">
                      Forget your password?
                    </Link>
                  </motion.div>

                  {/* Submit */}
                  <motion.div variants={fieldVariants} className="pt-1">
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full py-3.5 rounded-full text-white text-sm font-semibold tracking-widest uppercase
                        focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed
                        flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #4338ca 0%, #7c3aed 100%)' }}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Signing in...
                        </>
                      ) : 'Sign In'}
                    </motion.button>
                  </motion.div>
                </motion.form>

                {/* Back link */}
                <motion.div variants={fieldVariants} className="mt-6 text-center">
                  <button type="button" onClick={handleBack} className="text-xs text-gray-400 hover:text-indigo-600 transition-colors">
                    ← Back
                  </button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══════════════════════════════════════
          RIGHT COLUMN
          State 1 → collage image
          State 2 → gradient "Hello, there!" panel
      ══════════════════════════════════════ */}
      <div className="hidden md:block md:w-1/2 relative overflow-hidden min-h-screen">
        <AnimatePresence mode="wait">

          {/* State 1 — Collage */}
          {!showForm && (
            <motion.div
              key="collage"
              className="absolute inset-0"
              initial={rightEnter}
              animate={rightCenter}
              exit={rightExit}
            >
              <img src={collage} alt="The Trailblazers Nation" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-indigo-900/10" />
            </motion.div>
          )}

          {/* State 2 — Gradient hello panel */}
          {showForm && (
            <motion.div
              key="hello"
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #4338ca 0%, #7c3aed 55%, #312e81 100%)' }}
              initial={rightEnter}
              animate={rightCenter}
              exit={rightExit}
            >
              <GradientBlobs />
              <div className="relative z-10 text-center px-12 max-w-sm">
                <motion.h2
                  className="text-4xl font-bold text-white mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  Hello, there!
                </motion.h2>
                <motion.p
                  className="text-indigo-200 text-sm leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.5 }}
                >
                  Enter your personal details and start your journey with us
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══════════════════════════════════════
          MOBILE — single column
      ══════════════════════════════════════ */}
      <div className="flex flex-col min-h-screen md:hidden">
        {!showForm ? (
          <div className="flex-1 relative">
            <img src={collage} alt="The Trailblazers Nation" className="w-full h-64 object-cover" />
            <div className="p-8 text-center">
              <div className="inline-flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">TN</span>
                </div>
                <span className="text-sm font-semibold text-gray-700">The Trailblazers Nation</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">Welcome Back</h1>
              <p className="text-gray-500 text-sm mb-8">Sign in to access your dashboard and continue your journey.</p>
              <button
                type="button"
                onClick={handleShowForm}
                className="px-10 py-3 rounded-full text-white text-sm font-semibold tracking-widest uppercase"
                style={{ background: 'linear-gradient(135deg, #4338ca, #7c3aed)' }}
              >
                Sign In
              </button>
              <div className="mt-4">
                <Link to="/" className="text-xs text-gray-400 hover:text-indigo-600">← Back to Home</Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center px-8 py-16">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">TN</span>
              </div>
              <span className="text-sm font-semibold text-gray-700">The Trailblazers Nation</span>
            </div>
            <h2 className="text-2xl font-bold mb-1" style={{ background: 'linear-gradient(135deg, #4338ca, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Sign In
            </h2>
            <p className="text-xs text-gray-400 mb-6">or use your email account</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className={`flex items-center gap-3 px-5 py-3.5 rounded-full bg-gray-100 ${formErrors.email ? 'ring-1 ring-red-400' : ''}`}>
                <Mail size={15} className="text-gray-400" />
                <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none" />
              </div>
              {formErrors.email && <p className="ml-4 text-xs text-red-500">{formErrors.email}</p>}
              <div className={`flex items-center gap-3 px-5 py-3.5 rounded-full bg-gray-100 ${formErrors.password ? 'ring-1 ring-red-400' : ''}`}>
                <Lock size={15} className="text-gray-400" />
                <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Password" className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none" />
              </div>
              {formErrors.password && <p className="ml-4 text-xs text-red-500">{formErrors.password}</p>}
              <div className="text-right">
                <Link to="/forgot-password" className="text-xs text-gray-400 hover:text-indigo-600">Forget your password?</Link>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3.5 rounded-full text-white text-sm font-semibold tracking-widest uppercase flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #4338ca, #7c3aed)' }}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            {error && <p className="mt-4 text-xs text-red-500 text-center">{error}</p>}
            <button type="button" onClick={handleBack} className="mt-6 text-xs text-gray-400 hover:text-indigo-600 text-center w-full">← Back</button>
          </div>
        )}
      </div>

    </div>
  );
};

export default Login;
