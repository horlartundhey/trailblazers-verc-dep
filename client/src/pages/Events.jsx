import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarX2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import PageHeader from '../components/PageHeader';
import API from '../utils/api';
import EventDetails from '../components/EventDetails';
import AttendanceModal from '../components/AttendanceModal';
import EventCard from '../components/EventCard';

const gridStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardFadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const inputClass =
  'w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [attendanceData, setAttendanceData] = useState(null);
  const [showGuestRegistration, setShowGuestRegistration] = useState(false);
  const [guestFormData, setGuestFormData] = useState({ 
    name: '', 
    phone: '', 
    location: '', 
    invitedBy: '' 
  });
  const [guestRegistrationLoading, setGuestRegistrationLoading] = useState(false);
  const [guestRegistrationSuccess, setGuestRegistrationSuccess] = useState(false);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchEvents = async () => {
      try {
        // Use public or authenticated endpoint based on user status
        const endpoint = user ? '/api/events' : '/api/public/events';
        const response = await API.get(endpoint);
        console.log('Events response:', response.data);
        
        if (response.data.success && Array.isArray(response.data.data)) {
          setEvents(response.data.data);
          setError(null);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        setError('Failed to load events. Please try again later.');
        console.error('Error fetching events:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user]);

  const handleCheckIn = async (eventId) => {
    try {
      setLoading(true);
      const response = await API.post(`/api/events/${eventId}/check-in`);
      
      if (response.data.success) {
        setEvents(events.map(event => 
          event._id === eventId ? response.data.data : event
        ));
        setError(null);
      }
    } catch (err) {
      setError('Failed to update attendance. ' + (err.response?.data?.message || 'Please try again.'));
      console.error('Check-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleViewAttendance = async (event) => {
    try {
      const response = await API.get(`/api/events/${event._id}/attendance`);
      if (response.data.success) {
        setSelectedEvent(event);
        setAttendanceData(response.data.data);
        setShowAttendance(true);
      }
    } catch (err) {
      setError('Failed to fetch attendance data. ' + (err.response?.data?.message || 'Please try again.'));
      console.error('Fetch attendance error:', err);
    }
  };

  const handleGuestRegister = (event) => {
    setSelectedEvent(event);
    setGuestFormData({ name: '', email: '', phone: '' });
    setGuestRegistrationSuccess(false);
    setShowGuestRegistration(true);
    setError(null);
  };

  const handleGuestFormChange = (e) => {
    const { name, value } = e.target;
    setGuestFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGuestFormSubmit = async (e) => {
    e.preventDefault();
    setGuestRegistrationLoading(true);
    setError(null);

    try {
      const response = await API.post(`/api/events/${selectedEvent._id}/attendance`, {
        name: guestFormData.name,
        phone: guestFormData.phone,
        location: guestFormData.location,
        invitedBy: guestFormData.invitedBy
      });

      if (response.data.success) {
        setGuestRegistrationSuccess(true);
        setGuestFormData({ 
          name: '', 
          phone: '', 
          location: '', 
          invitedBy: '' 
        });
        
        // Refresh events to show updated capacity
        const eventsResponse = await API.get('/api/public/events');
        if (eventsResponse.data.success) {
          setEvents(eventsResponse.data.data);
        }

        setTimeout(() => {
          setShowGuestRegistration(false);
          setGuestRegistrationSuccess(false);
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register attendance. Please try again.');
      console.error('Guest attendance registration error:', err);
    } finally {
      setGuestRegistrationLoading(false);
    }
  };

  const closeGuestRegistrationModal = () => {
    setShowGuestRegistration(false);
    setSelectedEvent(null);
    setGuestFormData({ 
      name: '', 
      phone: '', 
      location: '', 
      invitedBy: '' 
    });
    setGuestRegistrationSuccess(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </main>
        <Footer />
      </div>
    );
  }

  // Filter to show only upcoming events
  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
    return eventDate >= today;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50">
        <PageHeader
          eyebrow="What's Happening"
          title="Upcoming Events"
          subtitle="Join us for worship, fellowship, and community — see what's coming up."
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 pb-20">
          <BackButton />

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-8">
          <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p>{error}</p>
        </div>
      )}

      {upcomingEvents.length === 0 && !loading ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg shadow-indigo-900/5">
          <CalendarX2 className="h-10 w-10 text-indigo-200 mx-auto mb-3" />
          <p className="text-gray-500">No upcoming events scheduled at the moment.</p>
        </div>
      ) : (
        <motion.div
          variants={gridStagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {upcomingEvents.map((event) => (
            <motion.div key={event._id} variants={cardFadeUp}>
              <EventCard
                event={event}
                user={user}
                onCheckIn={handleCheckIn}
                onViewDetails={handleViewDetails}
                onViewAttendance={handleViewAttendance}
                onGuestRegister={handleGuestRegister}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {selectedEvent && (
        <>
          <EventDetails
            event={selectedEvent}
            isOpen={showEventDetails}
            onClose={() => {
              setShowEventDetails(false);
              setSelectedEvent(null);
            }}
            user={user}
          />
          
          <AttendanceModal
            event={selectedEvent}
            isOpen={showAttendance}
            onClose={() => {
              setShowAttendance(false);
              setSelectedEvent(null);
              setAttendanceData(null);
            }}
            attendanceData={attendanceData}
          />
        </>
      )}

      {/* Guest Registration Modal */}
      <AnimatePresence>
        {showGuestRegistration && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-indigo-950">Register Your Attendance</h2>
                <button
                  onClick={closeGuestRegistrationModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-5 pb-4 border-b border-gray-100">
                <h3 className="font-semibold text-lg text-indigo-950">{selectedEvent.name}</h3>
                <p className="text-sm text-gray-500">{new Date(selectedEvent.date).toLocaleDateString()}</p>
                <p className="text-sm text-gray-500">{selectedEvent.location}</p>
              </div>

              {guestRegistrationSuccess ? (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
                  <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="font-medium">You have successfully registered for this event, we will be in touch to share more information about the event</p>
                </div>
              ) : (
                <form onSubmit={handleGuestFormSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={guestFormData.name}
                      onChange={handleGuestFormChange}
                      required
                      className={inputClass}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={guestFormData.phone}
                      onChange={handleGuestFormChange}
                      required
                      className={inputClass}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={guestFormData.location}
                      onChange={handleGuestFormChange}
                      required
                      className={inputClass}
                      placeholder="Your city or area"
                    />
                  </div>

                  <div>
                    <label htmlFor="invitedBy" className="block text-sm font-medium text-gray-700 mb-1">
                      Invited By (Optional)
                    </label>
                    <input
                      type="text"
                      id="invitedBy"
                      name="invitedBy"
                      value={guestFormData.invitedBy}
                      onChange={handleGuestFormChange}
                      className={inputClass}
                      placeholder="Name of the person who invited you"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeGuestRegistrationModal}
                      className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={guestRegistrationLoading}
                      className={`flex-1 px-4 py-2.5 rounded-full text-white font-semibold transition-colors ${
                        guestRegistrationLoading
                          ? 'bg-indigo-400 cursor-not-allowed'
                          : 'bg-indigo-700 hover:bg-indigo-600'
                      }`}
                    >
                      {guestRegistrationLoading ? 'Registering...' : 'Register'}
                    </button>
                  </div>
                </form>
              )}
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Events;
