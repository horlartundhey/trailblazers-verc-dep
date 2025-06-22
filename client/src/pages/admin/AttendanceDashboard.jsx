import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import API from '../../utils/api';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const AttendanceDashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const eventsPerPage = 10;

  useEffect(() => {
    fetchEvents(currentPage);
  }, [currentPage]);

  const fetchEvents = async (page) => {
    try {
      setLoading(true);
      const response = await API.get(`/api/events?page=${page}&limit=${eventsPerPage}`);
      if (response.data.success) {
        setEvents(response.data.data);
        setTotalPages(Math.ceil(response.data.total / eventsPerPage));
      }
    } catch (err) {
      setError('Failed to fetch events');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventAttendance = async (eventId) => {
    try {
      const response = await API.get(`/api/events/${eventId}/attendance`);
      if (response.data.success) {
        const attendance = response.data.data;
        const stats = {
          total: attendance.length,
          checkedIn: attendance.filter(record => record.checkedIn).length,
          notCheckedIn: attendance.filter(record => !record.checkedIn).length,
          byRole: {
            Member: attendance.filter(record => record.user.role === 'Member').length,
            Leader: attendance.filter(record => record.user.role === 'Leader').length
          }
        };
        setAttendanceStats(stats);
        setSelectedEvent(events.find(e => e._id === eventId));
      }
    } catch (err) {
      setError('Failed to fetch attendance data');
      console.error('Error fetching attendance:', err);
    }
  };

  const exportAttendance = async (eventId) => {
    try {
      const response = await API.get(`/api/events/${eventId}/attendance/export`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-${eventId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to export attendance data');
      console.error('Error exporting attendance:', err);
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
      <h1 className="text-3xl font-bold mb-8">Event Attendance Dashboard</h1>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Events List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <CalendarIcon className="h-6 w-6 mr-2 text-blue-500" />
            Events
          </h2>
          <div className="space-y-4">
            {events.map(event => (
              <button
                key={event._id}
                onClick={() => fetchEventAttendance(event._id)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selectedEvent?._id === event._id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <h3 className="font-semibold">{event.title || event.name}</h3>
                <p className="text-sm text-gray-600">
                  {new Date(event.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </button>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center px-3 py-1 rounded border disabled:opacity-50"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" /> Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center px-3 py-1 rounded border disabled:opacity-50"
            >
              Next <ArrowRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>

        {/* Attendance Stats */}
        {selectedEvent && attendanceStats && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-semibold">
                {selectedEvent.title || selectedEvent.name}
              </h2>
              <button
                onClick={() => exportAttendance(selectedEvent._id)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Export CSV
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <UsersIcon className="h-6 w-6 text-blue-500 mr-2" />
                  <div>
                    <p className="text-sm text-blue-600">Total Registered</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {attendanceStats.total}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2" />
                  <div>
                    <p className="text-sm text-green-600">Checked In</p>
                    <p className="text-2xl font-bold text-green-700">
                      {attendanceStats.checkedIn}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <XCircleIcon className="h-6 w-6 text-yellow-500 mr-2" />
                  <div>
                    <p className="text-sm text-yellow-600">Not Checked In</p>
                    <p className="text-2xl font-bold text-yellow-700">
                      {attendanceStats.notCheckedIn}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <UsersIcon className="h-6 w-6 text-purple-500 mr-2" />
                  <div>
                    <p className="text-sm text-purple-600">By Role</p>
                    <div className="text-sm">
                      <p>Members: {attendanceStats.byRole.Member}</p>
                      <p>Leaders: {attendanceStats.byRole.Leader}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Attendance Rate</h3>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                      {Math.round((attendanceStats.checkedIn / attendanceStats.total) * 100)}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                  <div
                    style={{ width: `${(attendanceStats.checkedIn / attendanceStats.total) * 100}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceDashboard;
