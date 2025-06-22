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
      </div>
    </section>
  );
};

export default Events;