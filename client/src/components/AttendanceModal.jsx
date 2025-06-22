import React from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const AttendanceModal = ({ event, attendanceData, isOpen, onClose }) => {
  if (!event || !attendanceData) return null;

  // Group attendance by status
  const checkedIn = attendanceData.filter(record => record.checkedIn);
  const notCheckedIn = attendanceData.filter(record => !record.checkedIn);

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

          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Attendance for {event.title || event.name}</h2>
            
            {/* Attendance Summary */}
            <div className="mb-6 grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">Total Registered</p>
                <p className="text-2xl font-bold text-blue-700">{attendanceData.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">Checked In</p>
                <p className="text-2xl font-bold text-green-700">{checkedIn.length}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-600">Not Checked In</p>
                <p className="text-2xl font-bold text-yellow-700">{notCheckedIn.length}</p>
              </div>
            </div>

            {/* Checked In List */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Checked In Members</h3>
              <div className="bg-white shadow rounded-lg divide-y">
                {checkedIn.length === 0 ? (
                  <p className="p-4 text-gray-500">No members have checked in yet</p>
                ) : (
                  checkedIn.map(record => (
                    <div key={record.user._id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{record.user.name}</p>
                        <p className="text-sm text-gray-500">{record.user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          Checked in at: {new Date(record.checkedInAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Not Checked In List */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Not Checked In</h3>
              <div className="bg-white shadow rounded-lg divide-y">
                {notCheckedIn.length === 0 ? (
                  <p className="p-4 text-gray-500">Everyone has checked in!</p>
                ) : (
                  notCheckedIn.map(record => (
                    <div key={record.user._id} className="p-4">
                      <p className="font-medium text-gray-900">{record.user.name}</p>
                      <p className="text-sm text-gray-500">{record.user.email}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Close button */}
            <div className="mt-6">
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
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

export default AttendanceModal;
