import React from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const EventDetails = ({ event, isOpen, onClose, user }) => {
  if (!event) return null;

  const isAdmin = user?.role === 'Admin';
  const isLeader = user?.role === 'Leader';
  const isMember = user?.role === 'Member';

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

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Background overlay */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Full-screen container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-lg shadow-xl">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          {/* Event image */}
          {event.image && (
            <div className="w-full h-64 relative">
              <img
                src={event.image}
                alt={event.title || event.name}
                className="w-full h-full object-cover rounded-t-lg"
              />
            </div>
          )}

          {/* Event details */}
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">{event.title || event.name}</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Date & Time</h3>
                <p className="text-gray-600">
                  {new Date(event.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-gray-600">
                  {new Date(event.startTime).toLocaleTimeString()} - {new Date(event.endTime).toLocaleTimeString()}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800">Location</h3>
                <p className="text-gray-600">{event.location}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800">Description</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800">Capacity</h3>
                <p className="text-gray-600">
                  {event.registeredMembers?.length || 0} / {event.capacity} attendees
                </p>
              </div>

              {event.regions && event.regions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Regions</h3>
                  <div className="flex flex-wrap gap-2">
                    {event.regions.map((region, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {region}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-6 space-y-3">
              {/* Non-member actions */}
              {!user && (
                <>
                  <a
                    href="/register"
                    className="block w-full px-4 py-2 text-center bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  >
                    Sign up as Member
                  </a>
                </>
              )}

              {/* Member actions */}
              {isMember && (
                <>
                  {isEventDay(event.date) && isWithinEventHours(event.startTime, event.endTime) && (
                    <button
                      className="block w-full px-4 py-2 text-center bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Check In
                    </button>
                  )}
                </>
              )}

              {/* Admin/Leader actions */}
              {(isAdmin || isLeader) && (
                <>
                  <button
                    className="block w-full px-4 py-2 text-center bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  >
                    View Attendance
                  </button>
                  {isEventDay(event.date) && (
                    <button
                      className="block w-full px-4 py-2 text-center bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Check In
                    </button>
                  )}
                </>
              )}

              <button
                onClick={onClose}
                className="block w-full px-4 py-2 text-center border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default EventDetails;
