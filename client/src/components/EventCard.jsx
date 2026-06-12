import { formatDate } from '../utils/dateUtils';
import { MapPin, Clock, Users } from 'lucide-react';
import { motion } from 'framer-motion';

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
    return now >= new Date(startTime) && now <= new Date(endTime);
  };

  const isCheckedIn = (event) => {
    if (!user || !event.attendance) return false;
    return event.attendance.find(r => r.user === user._id)?.checkedIn || false;
  };

  const canCheckIn = (event) => isEventDay(event.date) && isWithinEventHours(event.startTime, event.endTime);

  const isUserRegistered = () => {
    if (!user || !event.registeredMembers) return false;
    return event.registeredMembers.some(m => m.memberId === user._id);
  };

  const getRegistrationStatus = () => {
    if (!user || !event.registeredMembers) return null;
    return event.registeredMembers.find(m => m.memberId === user._id)?.status || null;
  };

  const registrationStatus = getRegistrationStatus();
  const userRegistered = isUserRegistered();
  const isFull = (event.spotsBooked || 0) >= event.capacity;
  const spotsLeft = event.capacity - (event.spotsBooked || 0);

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 16px 32px -8px rgba(79,70,229,0.15)' }}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col"
    >
      {event.image ? (
        <div className="relative overflow-hidden h-48">
          <img
            src={event.image}
            alt={event.title || event.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 right-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isFull ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {isFull ? 'Full' : `${spotsLeft} spots left`}
            </span>
          </div>
        </div>
      ) : (
        <div className="h-3 bg-gradient-to-r from-indigo-500 to-purple-500" />
      )}

      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-indigo-950 mb-3 leading-snug">
          {event.title || event.name}
        </h3>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4 text-indigo-400 flex-shrink-0" />
            <span>{formatDate(event.date)} · {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin className="h-4 w-4 text-indigo-400 flex-shrink-0" />
              <span>{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="h-4 w-4 text-indigo-400 flex-shrink-0" />
            <span>{event.spotsBooked || 0}/{event.capacity} attending</span>
          </div>
        </div>

        <p className="text-gray-500 text-sm line-clamp-2 mb-5 leading-relaxed">{event.description}</p>

        <div className="mt-auto space-y-2">
          {isAuthenticated ? (
            <>
              {isMember && (
                <>
                  {!userRegistered && !isFull && (
                    <button onClick={() => onRegister(event)} className="w-full py-2.5 bg-indigo-700 text-white text-sm font-semibold rounded-full hover:bg-indigo-600 transition-colors">
                      Register
                    </button>
                  )}
                  {userRegistered && (
                    <div className={`w-full py-2.5 text-center text-sm font-semibold rounded-full ${
                      registrationStatus === 'Confirmed' ? 'bg-green-100 text-green-800' :
                      registrationStatus === 'Waitlist' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {registrationStatus === 'Confirmed' ? '✓ Confirmed' : registrationStatus === 'Waitlist' ? 'On Waitlist' : 'Pending'}
                    </div>
                  )}
                  {userRegistered && registrationStatus === 'Confirmed' && (
                    <button
                      onClick={() => onCheckIn(event._id)}
                      disabled={!canCheckIn(event) || isCheckedIn(event)}
                      className={`w-full py-2.5 text-sm font-semibold rounded-full transition-colors ${
                        isCheckedIn(event) ? 'bg-green-500 text-white' :
                        canCheckIn(event) ? 'bg-blue-600 text-white hover:bg-blue-700' :
                        'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isCheckedIn(event) ? 'Checked In ✓' : 'Check In'}
                    </button>
                  )}
                  <button onClick={() => onViewDetails(event)} className="w-full py-2.5 bg-gray-50 text-gray-600 text-sm font-medium rounded-full hover:bg-gray-100 transition-colors border border-gray-200">
                    View Details
                  </button>
                </>
              )}

              {(isAdmin || isLeader) && (
                <>
                  <button onClick={() => onViewAttendance(event)} className="w-full py-2.5 bg-indigo-700 text-white text-sm font-semibold rounded-full hover:bg-indigo-600 transition-colors">
                    View Attendance
                  </button>
                  {isLeader && canCheckIn(event) && !isCheckedIn(event) && (
                    <button onClick={() => onCheckIn(event._id)} className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 transition-colors">
                      Check In
                    </button>
                  )}
                  <button onClick={() => onViewDetails(event)} className="w-full py-2.5 bg-gray-50 text-gray-600 text-sm font-medium rounded-full hover:bg-gray-100 transition-colors border border-gray-200">
                    View Details
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              {event.registrationAccessControl === 'Public' && !isFull && (
                <button onClick={() => onGuestRegister(event)} className="w-full py-2.5 bg-indigo-700 text-white text-sm font-semibold rounded-full hover:bg-indigo-600 transition-colors">
                  Register Attendance
                </button>
              )}
              {event.registrationAccessControl === 'Members' && (
                <div className="w-full py-2.5 bg-yellow-50 text-yellow-700 rounded-full text-center text-xs font-medium border border-yellow-100">
                  Members only — sign in to register
                </div>
              )}
              {event.registrationAccessControl === 'Leaders' && (
                <div className="w-full py-2.5 bg-orange-50 text-orange-700 rounded-full text-center text-xs font-medium border border-orange-100">
                  Leaders only event
                </div>
              )}
              <button onClick={() => onViewDetails(event)} className="w-full py-2.5 bg-gray-50 text-gray-600 text-sm font-medium rounded-full hover:bg-gray-100 transition-colors border border-gray-200">
                View Details
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default EventCard;
