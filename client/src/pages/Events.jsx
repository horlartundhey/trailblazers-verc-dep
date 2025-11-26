import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import API from '../utils/api';
import EventDetails from '../components/EventDetails';
import AttendanceModal from '../components/AttendanceModal';
import EventCard from '../components/EventCard';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [attendanceData, setAttendanceData] = useState(null);
  const [showGuestRegistration, setShowGuestRegistration] = useState(false);
  const [guestFormData, setGuestFormData] = useState({ name: '', email: '', phone: '' });
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
      const response = await API.post(`/api/events/${selectedEvent._id}/register-guest`, {
        name: guestFormData.name,
        email: guestFormData.email,
        phone: guestFormData.phone
      });

      if (response.data.success) {
        setGuestRegistrationSuccess(true);
        setGuestFormData({ name: '', email: '', phone: '' });
        
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
      setError(err.response?.data?.message || 'Failed to register for event. Please try again.');
      console.error('Guest registration error:', err);
    } finally {
      setGuestRegistrationLoading(false);
    }
  };

  const closeGuestRegistrationModal = () => {
    setShowGuestRegistration(false);
    setSelectedEvent(null);
    setGuestFormData({ name: '', email: '', phone: '' });
    setGuestRegistrationSuccess(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <BackButton />
          <h1 className="text-4xl font-bold text-center mb-8">Upcoming Events</h1>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {events.length === 0 && !loading ? (
        <p className="text-center text-gray-600">No events scheduled at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard
              key={event._id}
              event={event}
              user={user}
              onCheckIn={handleCheckIn}
              onViewDetails={handleViewDetails}
              onViewAttendance={handleViewAttendance}
              onGuestRegister={handleGuestRegister}
            />
          ))}
        </div>
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
      {showGuestRegistration && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Register as Guest</h2>
                <button
                  onClick={closeGuestRegistrationModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-lg">{selectedEvent.name}</h3>
                <p className="text-sm text-gray-600">{new Date(selectedEvent.date).toLocaleDateString()}</p>
                <p className="text-sm text-gray-600">{selectedEvent.location}</p>
              </div>

              {guestRegistrationSuccess ? (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-green-700 font-medium">Registration successful! Check your email for confirmation.</p>
                  </div>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={guestFormData.email}
                      onChange={handleGuestFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={guestFormData.phone}
                      onChange={handleGuestFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4">
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeGuestRegistrationModal}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={guestRegistrationLoading}
                      className={`flex-1 px-4 py-2 rounded-md text-white transition-colors ${
                        guestRegistrationLoading
                          ? 'bg-indigo-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {guestRegistrationLoading ? 'Registering...' : 'Register'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Events;
