import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Calendar, MapPin, Clock, Users } from 'lucide-react';
import API from '../../utils/api';

const EventSection = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState({});
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/events');
      if (response.data.success) {
        setEvents(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.response?.data?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId) => {
    try {
      setRegistrationStatus(prev => ({
        ...prev,
        [eventId]: { loading: true }
      }));

      const response = await API.post(`/api/events/${eventId}/register`);
      
      if (response.data.success) {
        setRegistrationStatus(prev => ({
          ...prev,
          [eventId]: { success: true, message: response.data.data.message }
        }));
        // Refresh events to update registration status
        fetchEvents();
      }
    } catch (err) {
      console.error('Registration error:', err);
      setRegistrationStatus(prev => ({
        ...prev,
        [eventId]: { 
          error: true, 
          message: err.response?.data?.message || 'Failed to register for event'
        }
      }));
    }
  };

  const isUserRegistered = (event) => {
    return event.registeredMembers?.some(
      m => m.memberId === user?._id
    );
  };

  const getRegistrationStatus = (event) => {
    const registration = event.registeredMembers?.find(
      m => m.memberId === user?._id
    );
    return registration?.status || null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-600">
        {error}
      </div>
    );
  }

  const upcomingEvents = events.filter(event => new Date(event.date) >= new Date());

  if (upcomingEvents.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming events</h3>
        <p className="mt-1 text-sm text-gray-500">Check back later for new events.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {upcomingEvents.map(event => (
        <div key={event._id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="sm:flex sm:items-start sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{event.name}</h3>
              <p className="mt-2 text-gray-600">{event.description}</p>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center text-gray-500">
                  <Calendar className="h-5 w-5 mr-2" />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <Clock className="h-5 w-5 mr-2" />
                  <span>{event.startTime} - {event.endTime}</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <Users className="h-5 w-5 mr-2" />
                  <span>{event.registeredMembers?.filter(m => m.status === 'Confirmed').length || 0} / {event.capacity} registered</span>
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-0 sm:ml-6">
              {isUserRegistered(event) ? (
                <div className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600">
                  {getRegistrationStatus(event)}
                </div>
              ) : (
                <button
                  onClick={() => handleRegister(event._id)}
                  disabled={registrationStatus[event._id]?.loading}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white 
                    ${registrationStatus[event._id]?.loading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                  {registrationStatus[event._id]?.loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Registering...
                    </>
                  ) : (
                    'Register'
                  )}
                </button>
              )}

              {registrationStatus[event._id]?.success && (
                <p className="mt-2 text-sm text-green-600">{registrationStatus[event._id].message}</p>
              )}

              {registrationStatus[event._id]?.error && (
                <p className="mt-2 text-sm text-red-600">{registrationStatus[event._id].message}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventSection;
