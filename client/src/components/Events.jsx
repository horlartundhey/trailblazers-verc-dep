import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Calendar, MapPin, Clock, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import API from '../utils/api';

const Events = ({ onRegister, userId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        let response;
        if (user) {
          response = await API.get('/api/events');
        } else {
          response = await API.get('/api/public/events');
        }
        
        if (response.data.success) {
          const fetchedEvents = response.data.data || [];
          // Sort events by date
          const sortedEvents = fetchedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
          setEvents(sortedEvents);
        } else {
          throw new Error(response.data.message || 'Failed to fetch events');
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to fetch events. Please try again later.');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [user]);

  const handleRegisterClick = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
    setRegistrationStatus(null);
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedEvent(null);
    setRegistrationStatus(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (user) {
        await onRegister(selectedEvent._id);
        setRegistrationStatus({
          success: true,
          message: 'Registration successful! Check your status in the dashboard.',
        });
      } else {
        const response = await API.post(`/api/events/${selectedEvent._id}/guest-register`, formData);
        setRegistrationStatus({
          success: true,
          message: `Registration ${response.data.data.status === 'Confirmed' ? 'confirmed!' : 'added to waitlist!'}`,
        });
      }
    } catch (err) {
      console.error('Registration error:', err);
      setRegistrationStatus({
        success: false,
        message: err.response?.data?.message || 'Registration failed. Please try again.',
      });
    }
  };

  const isUserRegistered = (event) => {
    if (!user || !userId) return false;
    return event.registeredMembers?.some(
      m => m.memberId && m.memberId.toString() === userId.toString()
    );
  };

  const getRegistrationStatus = (event) => {
    if (!user || !userId) return 'Register';
    const registration = event.registeredMembers?.find(
      m => m.memberId && m.memberId.toString() === userId.toString()
    );
    if (!registration) return 'Register';
    return registration.status === 'Confirmed' ? 'Confirmed' : registration.status;
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
              <div
                key={event._id}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition duration-200"
              >
                <div className="h-48 overflow-hidden rounded-lg mb-4">
                  <img
                    src={event.image || '/images/event-placeholder.jpg'}
                    alt={event.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.name}</h3>
                <div className="flex items-center text-gray-600 mb-1">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-gray-600 mb-1">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>
                    {new Date(event.date).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{event.location}</span>
                </div>
                <p className="text-gray-700 mb-4 line-clamp-3">{event.description}</p>
                <div className="flex items-center justify-between">
                  {user ? (
                    <>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          event.registeredMembers?.filter(m => m.status === 'Confirmed')
                            .length >= event.capacity
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {event.registeredMembers?.filter(m => m.status === 'Confirmed')
                          .length || 0}
                        /{event.capacity} spots
                      </span>
                      <button
                        onClick={() => handleRegisterClick(event)}
                        className={`px-4 py-2 rounded-lg font-medium text-white transition duration-200 ${
                          isUserRegistered(event)
                            ? 'bg-green-600 hover:bg-green-700 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                        disabled={isUserRegistered(event)}
                      >
                        {getRegistrationStatus(event)}
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-end">
                      <p className="text-sm text-gray-600 mb-2">
                        Sign up as a member to register for events
                      </p>
                      <Link
                        to="/register"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition duration-200"
                      >
                        Register as Member
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {user && showModal && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-indigo-900">
                  Register for {selectedEvent.name}
                </h3>
                <button
                  onClick={handleModalClose}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              {registrationStatus ? (
                <div
                  className={`p-4 mb-4 rounded ${
                    registrationStatus.success
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  <p>{registrationStatus.message}</p>
                  <div className="mt-6 text-center">
                    <button
                      onClick={handleModalClose}
                      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {user && (
                    <div className="mb-4 text-gray-700">
                      <p>
                        Registering as: <strong>{user.name}</strong> ({user.email})
                      </p>
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-200"
                  >
                    Complete Registration
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Events;