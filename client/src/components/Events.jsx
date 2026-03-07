import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Calendar, MapPin, Clock, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import EventDetails from './EventDetails';
import EventCard from './EventCard';

const Events = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestFormData, setGuestFormData] = useState({ name: '', phone: '', location: '', invitedBy: '' });
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await API.get(user ? '/api/events' : '/api/public/events');
        if (response.data.success) {
          const fetchedEvents = response.data.data || [];
          // Sort events by date
          const sortedEvents = fetchedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
          setEvents(sortedEvents);
        } else {
          throw new Error(response.data.message || 'Failed to fetch events');
        }
      } catch (err) {
        console.error('Error fetching events:', err, err.response?.data);
        setError(err.response?.data?.message || 'Failed to fetch events. Please try again later.');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [user]);

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleRegister = async (event) => {
    try {
      setRegistrationStatus(null);
      const response = await API.post(`/api/events/${event._id}/register`);
      
      if (response.data.success) {
        // Show success message
        setRegistrationStatus({
          success: true,
          message: response.data.message || 'Registration successful'
        });
        
        // Refresh events to update registration status
        const eventsRes = await API.get('/api/events');
        if (eventsRes.data.success) {
          setEvents(eventsRes.data.data);
        }
      }
    } catch (err) {
      console.error('Registration error:', err);
      setRegistrationStatus({
        success: false,
        message: err.response?.data?.message || 'Failed to register for event. Please try again.'
      });
    }
  };

  const handleCheckIn = async (eventId) => {
    try {
      const response = await API.post(`/api/events/${eventId}/check-in`);
      if (response.data.success) {
        // Refresh events to update check-in status
        const eventsRes = await API.get('/api/events');
        if (eventsRes.data.success) {
          setEvents(eventsRes.data.data);
        }
      }
    } catch (err) {
      console.error('Check-in error:', err);
      setError(err.response?.data?.message || 'Failed to check in. Please try again.');
    }
  };

  const handleViewAttendance = async (eventId) => {
    try {
      const response = await API.get(`/api/events/${eventId}/attendance`);
      if (response.data.success) {
        console.log('Attendance data:', response.data.data);
        // TODO: Implement attendance view modal
        alert('Attendance view functionality will be implemented soon.');
      }
    } catch (err) {
      console.error('Fetch attendance error:', err);
      setError('Failed to fetch attendance data. ' + (err.response?.data?.message || 'Please try again.'));
    }
  };

  const handleGuestRegister = (event) => {
    setSelectedEvent(event);
    setShowGuestModal(true);
    setGuestFormData({ name: '', phone: '', location: '', invitedBy: '' });
  };

  const submitGuestRegistration = async (e) => {
    e.preventDefault();
    try {
      setRegistrationStatus(null);
      const response = await API.post(`/api/events/${selectedEvent._id}/attendance`, guestFormData);
      
      if (response.data.success) {
        setRegistrationStatus({
          success: true,
          message: 'Thank you for registering! We look forward to seeing you at the event.'
        });
        setShowGuestModal(false);
        setGuestFormData({ name: '', phone: '', location: '', invitedBy: '' });
      }
    } catch (err) {
      console.error('Guest registration error:', err);
      setRegistrationStatus({
        success: false,
        message: err.response?.data?.message || 'Failed to register. Please try again.'
      });
    }
  };

  // Filter for upcoming events
  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate >= today;
  });

  if (loading) return <div className="text-center py-16">Loading events...</div>;
  if (error) return <div className="text-center py-16 text-red-600">{error}</div>;

  return (
    <section className="py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-gray-900">Upcoming Events</h2>
          <p className="mt-2 text-sm text-gray-500">Join our upcoming events</p>
        </div>

        {/* Registration status message */}
        {registrationStatus && (
          <div
            className={`p-4 mb-8 rounded-lg text-center ${
              registrationStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {registrationStatus.message}
          </div>
        )}

        {upcomingEvents.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl shadow-sm">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming events</h3>
            <p className="mt-1 text-sm text-gray-500">Check back later for new events.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map(event => (
              <EventCard
                key={event._id}
                event={event}
                user={user}
                onCheckIn={handleCheckIn}
                onViewDetails={handleViewDetails}
                onViewAttendance={handleViewAttendance}
                onRegister={handleRegister}
                onGuestRegister={handleGuestRegister}
              />
            ))}
          </div>
        )}

        {/* Event Details Modal */}
        {selectedEvent && (
          <EventDetails
            event={selectedEvent}
            isOpen={showEventDetails}
            onClose={() => {
              setShowEventDetails(false);
              setSelectedEvent(null);
            }}
            user={user}
          />
        )}

        {/* Guest Registration Modal */}
        {showGuestModal && selectedEvent && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Register for {selectedEvent.name}</h3>
                <button
                  onClick={() => setShowGuestModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={submitGuestRegistration} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={guestFormData.name}
                    onChange={(e) => setGuestFormData({ ...guestFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={guestFormData.phone}
                    onChange={(e) => setGuestFormData({ ...guestFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="+234 XXX XXX XXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={guestFormData.location}
                    onChange={(e) => setGuestFormData({ ...guestFormData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Lagos, Nigeria"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invited By (Optional)
                  </label>
                  <input
                    type="text"
                    value={guestFormData.invitedBy}
                    onChange={(e) => setGuestFormData({ ...guestFormData, invitedBy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Member name (optional)"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowGuestModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Register
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Events;