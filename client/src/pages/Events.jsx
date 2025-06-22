import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
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
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
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
    </div>
  );
};

export default Events;
