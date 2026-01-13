import React from 'react';
import { formatDate } from '../utils/dateUtils';
import { Link } from 'react-router-dom';

const EventCard = ({ event, user, onCheckIn, onViewDetails, onViewAttendance, onRegister, onGuestRegister }) => {
  const isAdmin = user?.role === 'Admin';
  const isLeader = user?.role === 'Leader';
  const isMember = user?.role === 'Member';
  const isAuthenticated = !!user;

  const isEventDay = (eventDate) => {
    const today = new Date();
    const date = new Date(eventDate);
    return (
      today.getFullYear() === date.getFullYear() &&
      today.getMonth() === date.getMonth() &&
      today.getDate() === date.getDate()
    );
  };

  const isWithinEventHours = (startTime, endTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    return now >= start && now <= end;
  };

  const isCheckedIn = (event) => {
    if (!user || !event.attendance) return false;
    const attendanceRecord = event.attendance.find(
      record => record.user === user._id
    );
    return attendanceRecord?.checkedIn || false;
  };

  const canCheckIn = (event) => {
    return isEventDay(event.date) && isWithinEventHours(event.startTime, event.endTime);
  };

  const isUserRegistered = () => {
    if (!user || !event.registeredMembers) return false;
    return event.registeredMembers.some(m => m.memberId === user._id);
  };

  const getRegistrationStatus = () => {
    if (!user || !event.registeredMembers) return null;
    const registration = event.registeredMembers.find(m => m.memberId === user._id);
    return registration?.status || null;
  };

  const registrationStatus = getRegistrationStatus();
  const userRegistered = isUserRegistered();
  const isFull = event.registeredMembers?.filter(m => m.status === 'Confirmed').length >= event.capacity;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
      {event.image && (
        <img
          src={event.image}
          alt={event.title || event.name}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">{event.title || event.name}</h3>
        <p className="text-gray-600 mb-2">
          {formatDate(event.date)}
        </p>
        <p className="text-gray-600 mb-2">
          {new Date(event.startTime).toLocaleTimeString()} - {new Date(event.endTime).toLocaleTimeString()}
        </p>
        <p className="text-gray-600 mb-4">{event.location}</p>
        <p className="text-gray-700 line-clamp-3">{event.description}</p>

        {/* Registration status */}
        <div className="mt-4 mb-2">
          <p className={`text-sm font-medium ${isFull ? 'text-red-600' : 'text-green-600'}`}>
            {event.registeredMembers?.filter(m => m.status === 'Confirmed').length || 0}/{event.capacity} spots filled
          </p>
        </div>

        <div className="mt-4 space-y-2">
          {isAuthenticated ? (
            <>
              {/* Member view */}
              {isMember && (
                <>
                  {/* Registration button for members */}
                  {!userRegistered && !isFull && (
                    <button
                      onClick={() => onRegister(event)}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                    >
                      Register for Event
                    </button>
                  )}
                  
                  {/* Registration status display */}
                  {userRegistered && (
                    <div className={`w-full px-4 py-2 text-center rounded font-medium ${
                      registrationStatus === 'Confirmed'
                        ? 'bg-green-100 text-green-800'
                        : registrationStatus === 'Waitlist'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}>
                      {registrationStatus === 'Confirmed' ? '✓ Registration Confirmed' 
                        : registrationStatus === 'Waitlist' ? 'On Waitlist'
                        : 'Registration Pending'}
                    </div>
                  )}

                  {/* Check-in button */}
                  {userRegistered && registrationStatus === 'Confirmed' && (
                    <button
                      onClick={() => onCheckIn(event._id)}
                      disabled={!canCheckIn(event) || isCheckedIn(event)}
                      className={`w-full px-4 py-2 rounded font-medium ${
                        isCheckedIn(event)
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : canCheckIn(event)
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {isCheckedIn(event) ? 'Checked In ✓' : 'Check In'}
                    </button>
                  )}

                  <button
                    onClick={() => onViewDetails(event)}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    View Details
                  </button>
                </>
              )}

              {/* Admin view */}
              {isAdmin && (
                <>
                  <button
                    onClick={() => onViewAttendance(event)}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  >
                    View Attendance
                  </button>
                  <button
                    onClick={() => onViewDetails(event)}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    View Details
                  </button>
                </>
              )}

              {/* Leader view */}
              {isLeader && (
                <>
                  <button
                    onClick={() => onViewAttendance(event)}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  >
                    View Attendance
                  </button>
                  {canCheckIn(event) && !isCheckedIn(event) && (
                    <button
                      onClick={() => onCheckIn(event._id)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Check In
                    </button>
                  )}
                  <button
                    onClick={() => onViewDetails(event)}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    View Details
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              {/* Non-member view */}
              {/* Guest registration button for Public events */}
              {event.registrationAccessControl === 'Public' && !isFull && (
                <button
                  onClick={() => onGuestRegister(event)}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors mb-2"
                >
                  Register as Guest
                </button>
              )}

              {/* Show access message for restricted events */}
              {event.registrationAccessControl === 'Members' && (
                <div className="w-full px-4 py-2 bg-yellow-50 text-yellow-800 rounded text-center text-sm mb-2">
                  Members only event - Please sign in or show interest in joining
                </div>
              )}
              {event.registrationAccessControl === 'Leaders' && (
                <div className="w-full px-4 py-2 bg-yellow-50 text-yellow-800 rounded text-center text-sm mb-2">
                  Leaders only event - Contact admin for access
                </div>
              )}

              <button
                onClick={() => onViewDetails(event)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                View Event Details
              </button>
              <Link
                to="/interest"
                className="block w-full px-4 py-2 text-center bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
              >
                Show Interest to Join
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
