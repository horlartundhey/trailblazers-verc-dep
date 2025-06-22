import React from 'react';
import { formatDate } from '../utils/dateUtils';
import { Link } from 'react-router-dom';

const EventCard = ({ event, user, onCheckIn, onViewDetails, onViewAttendance }) => {
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

        <div className="mt-4 space-y-2">
          {isAuthenticated ? (
            <>
              {/* Member view */}
              {isMember && (
                <>
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
              <button
                onClick={() => onViewDetails(event)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                View Event Details
              </button>
              <Link
                to="/register"
                className="block w-full px-4 py-2 text-center bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
              >
                Sign up as Member
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
