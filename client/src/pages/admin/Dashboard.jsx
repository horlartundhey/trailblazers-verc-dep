import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../../redux/slices/authSlice';
import UserDetailsModal from './UserDetailsModal';
import API from '../../utils/api';
import GalleryImageForm from '../../components/GalleryImageForm';
import ProfileManagement from '../../components/leader/ProfileManagement';

// Helper function to get profile image URL
const getProfileImageUrl = (profilePicture) => {
  if (!profilePicture) return null;
  // Check if it's already a full URL (http or https)
  if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://')) {
    return profilePicture;
  }
  // Otherwise, prepend the API base URL
  const baseURL = API.defaults.baseURL || 'https://trailblazers-verc-server.vercel.app';
  return `${baseURL}${profilePicture}`;
};

const AdminDashboard = () => {  const [stats, setStats] = useState({
    totalMembers: 0,
    totalLeaders: 0,
    pendingMembers: 0,
    completedMembers: 0,
    totalEvents: 0,
    totalPaymentsNGN: 0,
    totalPaymentsUSD: 0,
    regions: [],
    campuses: []
  });
  const [users, setUsers] = useState([]);
  const [interests, setInterests] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [selectedEventAttendance, setSelectedEventAttendance] = useState(null);
  const [eventAttendanceList, setEventAttendanceList] = useState([]);

  // For the Users modal
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [regions, setRegions] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [events, setEvents] = useState([]);  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [eventTab, setEventTab] = useState('details');
  const [isEditingEvent, setIsEditingEvent] = useState(false);

  // Gallery management state
  const [galleries, setGalleries] = useState([]);
  const [galleryPage, setGalleryPage] = useState(1);
  const [selectedGallery, setSelectedGallery] = useState(null);
  const [showGalleryForm, setShowGalleryForm] = useState(false);
  const galleryItemsPerPage = 6;

  // Assign-leader state
  const [assigningMemberId, setAssigningMemberId] = useState(null);
  const [assignLeaderLoading, setAssignLeaderLoading] = useState(false);



  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [regionPage, setRegionPage] = useState(1);
  const [campusPage, setCampusPage] = useState(1);
  const itemsPerPage = 5;
  const [filterParams, setFilterParams] = useState({
    role: '',
    region: '',
    campus: '',
    registrationStatus: ''
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all users
      const usersResponse = await API.get('/api/users');
      console.log('API Response:', usersResponse);
      const userData = usersResponse.data.data || [];
      setUsers(userData);

      const eventsResponse = await API.get('/api/events');
      const eventsData = eventsResponse.data.data || [];
      setEvents(eventsData);
      
      // Fetch payments (assuming you have an endpoint for this)
      const paymentsResponse = await API.get('/api/payments');
      const paymentsData = paymentsResponse.data.data || [];
      
      // Fetch regions and campuses from RegionCampus management
      const [regionsResponse, campusesResponse, interestsResponse, attendanceResponse] = await Promise.all([
        API.get('/api/region-campus/regions'),
        API.get('/api/region-campus/campuses'),
        API.get('/api/interest'),
        API.get('/api/events/attendance/all')
      ]);
      const regionsData = regionsResponse.data.data || [];
      const campusesData = campusesResponse.data.data || [];
      const interestsData = interestsResponse.data.data || [];
      const attendanceData = attendanceResponse.data.data || [];
      setInterests(interestsData);
      setAttendance(attendanceData);
        
      // Calculate dashboard statistics from user data
      const totalMembers = userData.filter(user => user.role === 'Member').length;
      const totalLeaders = userData.filter(user => user.role === 'Leader').length;
      const pendingMembers = userData.filter(user => 
        user.role === 'Member' && user.registrationStatus === 'Pending').length;
      const completedMembers = userData.filter(user => 
        user.role === 'Member' && user.registrationStatus === 'Completed').length;
      // Calculate total events
      const totalEvents = eventsData.length;
      
      // Calculate total payments separated by currency
      const totalPaymentsNGN = paymentsData
        .filter(payment => payment.currency === 'NGN')
        .reduce((sum, payment) => sum + (payment.amount || 0), 0);
        
      const totalPaymentsUSD = paymentsData
        .filter(payment => payment.currency === 'USD')
        .reduce((sum, payment) => sum + (payment.amount || 0), 0);
        
      // Use RegionCampus data for stats with user counts
      const regionStats = regionsData.map(region => ({
        _id: region._id,
        name: region.name,
        memberCount: region.userCount || 0
      }));
      
      const campusStats = campusesData.map(campus => ({
        _id: campus._id,
        name: campus.name,
        memberCount: campus.userCount || 0
      }));
      
      setStats({
        totalMembers,
        totalLeaders,
        pendingMembers,
        completedMembers,
        totalEvents,
        totalPaymentsNGN,
        totalPaymentsUSD,
        regions: regionStats,
        campuses: campusStats
      });
        
      // Set all regions and campuses for filtering (from RegionCampus collection)
      const allRegionNames = regionsData.map(r => r.name);
      const allCampusNames = campusesData.map(c => c.name);
          
      setRegions(allRegionNames);
      setCampuses(allCampusNames);
        
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const fetchGalleries = useCallback(async () => {
    try {
      const response = await API.get('/api/gallery/admin/programs');
      setGalleries(response.data.data || []);
    } catch (err) {
      console.error('Failed to load galleries:', err);
    }
  }, []);

  useEffect(() => {
    fetchGalleries();
  }, [fetchGalleries]);

  // Mark interests as viewed when tab is clicked
  const markInterestsAsViewed = async () => {
    try {
      await API.put('/api/interest/mark-viewed');
      // Refresh interests data to get updated viewedBy arrays
      const interestsResponse = await API.get('/api/interest');
      const interestsData = interestsResponse.data.data || [];
      setInterests(interestsData);
    } catch (error) {
      console.error('Failed to mark interests as viewed:', error);
    }
  };

  // Mark attendance as viewed when tab is clicked
  const markAttendanceAsViewed = async () => {
    try {
      await API.put('/api/events/attendance/mark-viewed');
      // Refresh attendance data to get updated viewedBy arrays
      const attendanceResponse = await API.get('/api/events/attendance/all');
      const attendanceData = attendanceResponse.data.data || [];
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Failed to mark attendance as viewed:', error);
    }
  };

  // Handle tab change with mark as viewed logic
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'interests') {
      markInterestsAsViewed();
    } else if (tab === 'attendance') {
      markAttendanceAsViewed();
    }
  };

  const handleCreateEvent = async (eventData) => {
    try {
      setLoading(true);
      // Clear previous messages
      setSuccessMessage('');
      setErrorMessage('');
      
      // Add the current user as creator
      const eventPayload = {
        ...eventData,
        createdBy: user._id,  // Add the current user as creator
        registrationStartDate: eventData.registrationStartDate || eventData.date, // Default to event date if not specified
        registrationEndDate: eventData.registrationEndDate || eventData.startTime, // Default to event start time if not specified
      };
      
      // If an image file is present, create a FormData object
      if (eventData.imageFile) {
        const formData = new FormData();
        
        // Append all event data fields
        Object.keys(eventPayload).forEach(key => {
          if (key !== 'imageFile') {
            // Handle arrays specially
            if (Array.isArray(eventPayload[key])) {
              formData.append(key, JSON.stringify(eventPayload[key]));
            } else {
              formData.append(key, eventPayload[key]);
            }
          }
        });
        
        // Append the image file
        formData.append('image', eventData.imageFile);
  
        const response = await API.post('/api/events', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        // Add the new event to the events list
        setEvents(prevEvents => [...prevEvents, response.data.data]);
        
        // Show success message
        setSuccessMessage('Event created successfully!');
        // Switch back to events tab
        setActiveTab('events');
      } else {
        // If no image, proceed with regular JSON post
        const response = await API.post('/api/events', eventPayload);
        
        setEvents(prevEvents => [...prevEvents, response.data.data]);
        setSuccessMessage('Event created successfully!');
        setActiveTab('events');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to create event';
      setErrorMessage(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
    // Add this function to handle opening the modal
  const openEventModal = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  // Add this function to handle closing the modal
  const closeEventModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
  };

  // New function to update an event
  const handleUpdateEvent = async (eventData) => {
    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');
      
      const eventId = selectedEvent._id;
      
      // If an image file is present, create a FormData object
      if (eventData.imageFile) {
        const formData = new FormData();
        
        // Append all event data fields
        Object.keys(eventData).forEach(key => {
          if (key !== 'imageFile') {
            // Handle arrays specially
            if (Array.isArray(eventData[key])) {
              formData.append(key, JSON.stringify(eventData[key]));
            } else {
              formData.append(key, eventData[key]);
            }
          }
        });
        
        // Append the image file
        formData.append('image', eventData.imageFile);
  
        const response = await API.put(`/api/events/${eventId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        // Update the events list
        setEvents(prevEvents => 
          prevEvents.map(event => 
            event._id === eventId ? response.data.data : event
          )
        );
        
        // Close modal and clear selected event
        setShowModal(false);
        setSelectedEvent(null);
        setIsEditingEvent(false);
        setSuccessMessage('Event updated successfully!');
      } else {
        const response = await API.put(`/api/events/${eventId}`, eventData);
        
        // Update the events list
        setEvents(prevEvents => 
          prevEvents.map(event => 
            event._id === eventId ? response.data.data : event
          )
        );
        
        // Close modal and clear selected event
        setShowModal(false);
        setSelectedEvent(null);
        setIsEditingEvent(false);
        setSuccessMessage('Event updated successfully!');
      }
      
      // Refetch events to ensure data consistency
      await fetchDashboardData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update event';
      setErrorMessage(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // New function to delete an event
  const handleDeleteEvent = async (eventId) => {
    // Add confirmation dialog
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      await API.delete(`/api/events/${eventId}`);
      
      // Remove the event from the events list
      setEvents(prevEvents => prevEvents.filter(event => event._id !== eventId));
      
      // Show success message
      setSuccessMessage('Event deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete event';
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(''), 5000);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = () => {
    dispatch(logout());
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterParams(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const applyFilters = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filterParams.role) queryParams.append('role', filterParams.role);
      if (filterParams.region) queryParams.append('region', filterParams.region);
      if (filterParams.campus) queryParams.append('campus', filterParams.campus);
      if (filterParams.registrationStatus) queryParams.append('registrationStatus', filterParams.registrationStatus);
      
      // Fetch filtered users using the filter endpoint
      const response = await API.get(`/api/users/filter?${queryParams.toString()}`);
      setUsers(response.data.data);
    } catch (err) {
      setError('Failed to filter users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const resetFilters = async () => {
    setFilterParams({
      role: '',
      region: '',
      campus: '',
      registrationStatus: ''
    });
    
    try {
      setLoading(true);
      const response = await API.get('/api/users');
      setUsers(response.data.data);
    } catch (err) {
      setError('Failed to reset filters');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // eslint-disable-next-line no-unused-vars
  const handleRegionCampusView = async (regionId, campusId) => {
    try {
      setLoading(true);
      const response = await API.get(`/api/users/region/${regionId}/campus/${campusId}`);
      setUsers(response.data.data);
      setActiveTab('users');
    } catch (err) {
      setError('Failed to load users for this region and campus');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const viewUserDetails = (userId) => {
    setSelectedUserId(userId);
    setIsModalOpen(true);
    
  };

  // Close the modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUserId(null);
    // Refresh user data after modal closes (in case payments were added)
    fetchDashboardData();
  };

  const handleAssignLeader = async (memberId, leaderId) => {
    setAssignLeaderLoading(true);
    try {
      const res = await API.patch(`/api/users/${memberId}/assign-leader`, { leaderId });
      setUsers(prev => prev.map(u => u._id === memberId ? res.data.data : u));
      setAssigningMemberId(null);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to assign leader');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setAssignLeaderLoading(false);
    }
  };
  
  if (loading && (!users || users.length === 0)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (

    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900">{user?.name}</span>
                <span className="text-xs text-gray-500">Administrator</span>
              </div>
              <div className="relative">
                <button 
                  onClick={() => setShowProfile(true)}
                  className="flex items-center justify-center focus:outline-none hover:opacity-80 transition-opacity"
                >
                  {user?.profilePicture && getProfileImageUrl(user.profilePicture) ? (
                    <>
                      <img
                        src={getProfileImageUrl(user.profilePicture)}
                        alt="Profile"
                        className="h-10 w-10 rounded-full object-cover border-2 border-indigo-500"
                        onError={(e) => {
                          console.error('Failed to load profile image:', getProfileImageUrl(user.profilePicture));
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          // Show fallback
                          const fallback = e.target.nextElementSibling;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div className="h-10 w-10 rounded-full bg-indigo-100 items-center justify-center border-2 border-indigo-500" style={{ display: 'none' }}>
                        <span className="text-lg font-medium text-indigo-600">
                          {user?.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-indigo-500">
                      <span className="text-lg font-medium text-indigo-600">
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 border-2 border-white"></div>
                </button>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Scrollable tabs on mobile with gradient indicator */}
          <div className="relative">
            <div className="flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-thin -mb-px pb-2">
              <button
                className={`py-4 px-2 sm:px-3 border-b-2 whitespace-nowrap text-xs sm:text-sm ${
                  activeTab === 'dashboard' 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                } font-medium`}
                onClick={() => setActiveTab('dashboard')}
              >
                Dashboard
              </button>
            <button
              className={`py-4 px-2 sm:px-3 border-b-2 whitespace-nowrap text-xs sm:text-sm ${
                activeTab === 'gallery' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } font-medium`}
              onClick={() => setActiveTab('gallery')}
            >
              Gallery
            </button>
            <button
              className={`py-4 px-2 sm:px-3 border-b-2 whitespace-nowrap text-xs sm:text-sm ${
                activeTab === 'users' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } font-medium`}
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>
            <button
              className={`py-4 px-2 sm:px-3 border-b-2 whitespace-nowrap text-xs sm:text-sm ${
                activeTab === 'createUser' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } font-medium`}
              onClick={() => setActiveTab('createUser')}
            >
              Create User
            </button>
            <button
              className={`py-4 px-2 sm:px-3 border-b-2 whitespace-nowrap text-xs sm:text-sm ${
                activeTab === 'events' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } font-medium`}
              onClick={() => setActiveTab('events')}
            >
              Events
            </button>
            <button
              className={`py-4 px-2 sm:px-3 border-b-2 whitespace-nowrap text-xs sm:text-sm ${
                activeTab === 'interests' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } font-medium relative`}
              onClick={() => handleTabChange('interests')}
            >
              Interest Submissions
              {user && interests.filter(i => !i.viewedBy?.includes(user._id)).length > 0 && (
                <span className="absolute -top-1 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                  {interests.filter(i => !i.viewedBy?.includes(user._id)).length}
                </span>
              )}
            </button>
            <button
              className={`py-4 px-2 sm:px-3 border-b-2 whitespace-nowrap text-xs sm:text-sm ${
                activeTab === 'attendance' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } font-medium relative`}
              onClick={() => handleTabChange('attendance')}
            >
              Event Attendance
              {user && attendance.filter(a => !a.viewedBy?.includes(user._id)).length > 0 && (
                <span className="absolute -top-1 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                  {attendance.filter(a => !a.viewedBy?.includes(user._id)).length}
                </span>
              )}
            </button>
            <button
              className={`py-4 px-2 sm:px-3 border-b-2 whitespace-nowrap text-xs sm:text-sm ${
                activeTab === 'regions' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } font-medium`}
              onClick={() => navigate('/admin/region-campus')}
            >
              Regions & Campuses
            </button>
          </div>
          
          {/* Scroll indicator gradient - visible only on mobile */}
          <div className="md:hidden absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none"></div>
        </div>
      </div>
      </nav>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Members" value={stats.totalMembers} bgColor="bg-blue-500" />
            <StatCard title="Total Leaders" value={stats.totalLeaders} bgColor="bg-green-500" />
            <StatCard title="Pending Registration" value={stats.pendingMembers} bgColor="bg-yellow-500" />
            <StatCard title="Completed Members" value={stats.completedMembers} bgColor="bg-purple-500" />
            <StatCard title="Total Events" value={stats.totalEvents} bgColor="bg-indigo-500" />            
              <StatCard 
                title="Total Payments NGN" 
                value={`₦${stats.totalPaymentsNGN.toLocaleString()}`} 
                bgColor="bg-emerald-400" 
              />
              <StatCard 
                title="Total Payments USD" 
                value={`$${stats.totalPaymentsUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
                bgColor="bg-teal-600" 
              />
            </div>
            
            {/* Regions and Campuses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-gray-50">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Regions</h3>
                </div>
                <div className="p-6">
                  {stats.regions.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 gap-4">
                        {stats.regions
                          .slice((regionPage - 1) * itemsPerPage, regionPage * itemsPerPage)
                          .map(region => (
                          <div key={region._id} className="border rounded p-4 flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{region.name}</h4>
                              <p className="text-sm text-gray-500">{region.memberCount} members</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {stats.regions.length > itemsPerPage && (
                        <div className="flex justify-between items-center mt-4 pt-4 border-t">
                          <button
                            onClick={() => setRegionPage(Math.max(1, regionPage - 1))}
                            disabled={regionPage === 1}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <span className="text-sm text-gray-600">
                            Page {regionPage} of {Math.ceil(stats.regions.length / itemsPerPage)}
                          </span>
                          <button
                            onClick={() => setRegionPage(Math.min(Math.ceil(stats.regions.length / itemsPerPage), regionPage + 1))}
                            disabled={regionPage >= Math.ceil(stats.regions.length / itemsPerPage)}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500">No regions found</p>
                  )}
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-gray-50">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Campuses</h3>
                </div>
                <div className="p-6">
                  {stats.campuses.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 gap-4">
                        {stats.campuses
                          .slice((campusPage - 1) * itemsPerPage, campusPage * itemsPerPage)
                          .map(campus => (
                          <div key={campus._id} className="border rounded p-4 flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{campus.name}</h4>
                              <p className="text-sm text-gray-500">{campus.memberCount} members</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {stats.campuses.length > itemsPerPage && (
                        <div className="flex justify-between items-center mt-4 pt-4 border-t">
                          <button
                            onClick={() => setCampusPage(Math.max(1, campusPage - 1))}
                            disabled={campusPage === 1}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <span className="text-sm text-gray-600">
                            Page {campusPage} of {Math.ceil(stats.campuses.length / itemsPerPage)}
                          </span>
                          <button
                            onClick={() => setCampusPage(Math.min(Math.ceil(stats.campuses.length / itemsPerPage), campusPage + 1))}
                            disabled={campusPage >= Math.ceil(stats.campuses.length / itemsPerPage)}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500">No campuses found</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Admin actions */}
            <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-5 sm:px-6 bg-gray-50">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ActionButton 
                    title="Manage Users" 
                    description="Add, edit or remove users" 
                    onClick={() => setActiveTab('users')} 
                  />
                  <ActionButton 
                    title="Create User" 
                    description="Add new user to the system" 
                    onClick={() => setActiveTab('createUser')} 
                  />
                  <ActionButton 
                    title="Filter Members" 
                    description="View members by criteria" 
                    onClick={() => {
                      setFilterParams({...filterParams, role: 'Member'});
                      setActiveTab('users');
                    }} 
                  />
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-medium leading-6 text-gray-900">User Management</h3>
              <button
                onClick={() => setActiveTab('createUser')}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
              >
                Add User
              </button>
            </div>
            
            {/* User Statistics Section */}
            <div className="p-4 border-b bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">User Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Role Statistics */}
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-600 mb-1">Total Users</p>
                  <p className="text-2xl font-bold text-indigo-600">{users.length}</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-600 mb-1">Admins</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {users.filter(u => u.role === 'Admin').length}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-600 mb-1">Leaders</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {users.filter(u => u.role === 'Leader').length}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-600 mb-1">Members</p>
                  <p className="text-2xl font-bold text-green-600">
                    {users.filter(u => u.role === 'Member').length}
                  </p>
                </div>
              </div>
              
              {/* Registration Status */}
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-600 mb-1">Completed</p>
                  <p className="text-xl font-bold text-green-600">
                    {users.filter(u => u.registrationStatus === 'Completed').length}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-600 mb-1">Pending</p>
                  <p className="text-xl font-bold text-yellow-600">
                    {users.filter(u => u.registrationStatus === 'Pending').length}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Users Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Region/Campus
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned Leader
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users && users.length > 0 ? (
                      users.map(user => (
                        <tr key={user._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => viewUserDetails(user._id)}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            {user.memberCode && (
                              <div className="text-sm text-gray-500">ID: {user.memberCode}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'Leader' ? 'bg-green-100 text-green-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.region && user.campus ? (
                              <div className="text-sm text-gray-900">
                                {user.region} / {user.campus}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">N/A</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.registrationStatus && (
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.registrationStatus === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {user.registrationStatus}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                            {user.role === 'Member' ? (
                              assigningMemberId === user._id ? (
                                <div className="flex items-center gap-2">
                                  <select
                                    autoFocus
                                    disabled={assignLeaderLoading}
                                    defaultValue={user.leaderId?._id || user.leaderId || ''}
                                    onChange={e => handleAssignLeader(user._id, e.target.value)}
                                    onBlur={() => setAssigningMemberId(null)}
                                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  >
                                    <option value="">-- Unassign --</option>
                                    {users.filter(u => u.role === 'Leader').map(leader => (
                                      <option key={leader._id} value={leader._id}>{leader.name}</option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setAssigningMemberId(user._id)}
                                  className="text-xs text-indigo-600 hover:text-indigo-900 underline"
                                >
                                  {user.leaderId?.name || user.leaderId || 'Unassigned'}
                                </button>
                              )
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => viewUserDetails(user._id)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {isModalOpen && selectedUserId && (
                      <UserDetailsModal 
                        userId={selectedUserId} 
                        isOpen={isModalOpen} 
                        onClose={closeModal} 
                      />
                    )}
            </div>
          </div>
        )}


        
        {/* Create User Tab */}
        {activeTab === 'createUser' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Create New User</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Add a new admin, leader, or member to the system
              </p>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <UserForm onUserCreated={fetchDashboardData} />
            </div>
          </div>
        )}

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Gallery Management</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  {selectedGallery ? `Viewing: ${selectedGallery.programTitle}` : 'Upload and manage gallery albums'}
                </p>
              </div>
              <div className="flex gap-2">
                {selectedGallery && (
                  <button
                    onClick={() => setSelectedGallery(null)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    ← Back to Albums
                  </button>
                )}
                <button
                  onClick={() => { setShowGalleryForm(v => !v); setSelectedGallery(null); }}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  {showGalleryForm ? 'Cancel Upload' : '+ Upload Photos'}
                </button>
              </div>
            </div>

            <div className="px-4 py-5 sm:p-6">
              {/* Upload form toggle */}
              {showGalleryForm && (
                <div className="mb-8 border border-gray-200 rounded-lg p-4">
                  <GalleryImageForm onSuccess={() => { setShowGalleryForm(false); fetchGalleries(); }} />
                </div>
              )}

              {/* Gallery detail view */}
              {selectedGallery && !showGalleryForm && (
                <div>
                  <div className="mb-4 flex flex-wrap gap-4 text-sm text-gray-600">
                    {selectedGallery.programDate && (
                      <span><strong>Date:</strong> {new Date(selectedGallery.programDate).toLocaleDateString()}</span>
                    )}
                    {selectedGallery.attendees > 0 && (
                      <span><strong>Attendees:</strong> {selectedGallery.attendees}</span>
                    )}
                    {selectedGallery.healings > 0 && (
                      <span><strong>Healings:</strong> {selectedGallery.healings}</span>
                    )}
                    <span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selectedGallery.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                        {selectedGallery.isPublic ? 'Public' : 'Private'}
                      </span>
                    </span>
                  </div>
                  {selectedGallery.description && (
                    <p className="mb-4 text-sm text-gray-600">{selectedGallery.description}</p>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {selectedGallery.images.map((img) => (
                      <div key={img._id} className="group relative rounded-lg overflow-hidden aspect-square bg-gray-100">
                        <img
                          src={img.src}
                          alt={img.caption || selectedGallery.programTitle}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-end">
                          <p className="text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity truncate w-full">{img.caption}</p>
                        </div>
                        <button
                          onClick={async () => {
                            if (!window.confirm('Delete this image?')) return;
                            try {
                              await API.delete(`/api/gallery/${img._id}`);
                              setSelectedGallery(prev => ({
                                ...prev,
                                images: prev.images.filter(i => i._id !== img._id),
                                imageCount: (prev.imageCount || prev.images.length) - 1
                              }));
                              fetchGalleries();
                            } catch (err) {
                              alert('Failed to delete image');
                            }
                          }}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                          title="Delete image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gallery album grid */}
              {!selectedGallery && !showGalleryForm && (
                <>
                  {galleries.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No gallery albums yet</h3>
                      <p className="mt-1 text-sm text-gray-500">Click "Upload Photos" to add your first album.</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {galleries
                          .slice((galleryPage - 1) * galleryItemsPerPage, galleryPage * galleryItemsPerPage)
                          .map((gallery) => (
                            <div
                              key={gallery._id}
                              onClick={() => setSelectedGallery(gallery)}
                              className="group cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow"
                            >
                              {/* Cover image */}
                              <div className="relative aspect-video bg-gray-100 overflow-hidden">
                                {gallery.thumbnailImage ? (
                                  <img
                                    src={gallery.thumbnailImage}
                                    alt={gallery.programTitle}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                                <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium ${gallery.isPublic ? 'bg-green-500 text-white' : 'bg-gray-700 text-white'}`}>
                                  {gallery.isPublic ? 'Public' : 'Private'}
                                </span>
                              </div>
                              {/* Album info - single row */}
                              <div className="px-3 py-2 flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{gallery.programTitle}</p>
                                  <p className="text-xs text-gray-500">
                                    {gallery.programDate ? new Date(gallery.programDate).toLocaleDateString() : '—'}
                                    {' · '}
                                    {gallery.imageCount || gallery.images?.length || 0} photo{(gallery.imageCount || gallery.images?.length || 0) !== 1 ? 's' : ''}
                                  </p>
                                </div>
                                <svg className="h-4 w-4 text-gray-400 flex-shrink-0 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          ))}
                      </div>

                      {/* Pagination */}
                      {galleries.length > galleryItemsPerPage && (
                        <div className="mt-6 flex items-center justify-between">
                          <p className="text-sm text-gray-700">
                            Showing {(galleryPage - 1) * galleryItemsPerPage + 1}–{Math.min(galleryPage * galleryItemsPerPage, galleries.length)} of {galleries.length} albums
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setGalleryPage(p => Math.max(1, p - 1))}
                              disabled={galleryPage === 1}
                              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
                            >
                              Previous
                            </button>
                            <button
                              onClick={() => setGalleryPage(p => Math.min(Math.ceil(galleries.length / galleryItemsPerPage), p + 1))}
                              disabled={galleryPage >= Math.ceil(galleries.length / galleryItemsPerPage)}
                              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Interest Submissions Tab */}
        {activeTab === 'interests' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Interest Submissions</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Review and manage people who have expressed interest in joining
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              {interests.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No interest submissions</h3>
                  <p className="mt-1 text-sm text-gray-500">No one has submitted the interest form yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Church</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {interests.map((interest) => (
                        <tr key={interest._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{interest.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{interest.phone}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{interest.email || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{interest.age || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{interest.location || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{interest.church || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">{interest.reason || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              interest.status === 'Pending' ? 'bg-blue-100 text-blue-800' :
                              interest.status === 'Approved' ? 'bg-green-100 text-green-800' :
                              interest.status === 'Reviewed' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {interest.status === 'Pending' ? 'Submitted' : interest.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(interest.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Event Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Event Attendance</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                View guest registrations organized by events
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              {attendance.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records</h3>
                  <p className="mt-1 text-sm text-gray-500">No guests have registered for event attendance yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Group attendance by event */}
                  {(() => {
                    // Create a map of events with their attendance
                    const eventAttendanceMap = {};
                    attendance.forEach(record => {
                      const eventId = record.event;
                      if (!eventAttendanceMap[eventId]) {
                        eventAttendanceMap[eventId] = {
                          eventName: record.eventName,
                          eventDate: record.eventDate,
                          records: []
                        };
                      }
                      eventAttendanceMap[eventId].records.push(record);
                    });

                    return Object.entries(eventAttendanceMap).map(([eventId, eventData]) => (
                      <div key={eventId} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900 mb-1">
                                {eventData.eventName}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {new Date(eventData.eventDate).toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </p>
                            </div>
                            <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-bold leading-none text-white bg-indigo-600 rounded-full">
                              {eventData.records.length}
                            </span>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                              <span>Total Registrations</span>
                              <span className="font-semibold">{eventData.records.length}</span>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedEventAttendance(eventData.eventName);
                                setEventAttendanceList(eventData.records);
                                setAttendanceModalOpen(true);
                              }}
                              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
                            >
                              View Attendance List
                            </button>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Event Management</h3>
              <button
                onClick={() => setActiveTab('createEvent')}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
              >
                Create Event
              </button>
            </div>
            
            {/* Events Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capacity
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.map(event => (
                    <tr key={event._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {event.image ? (
                          <img 
                            src={event.image.startsWith('http://') || event.image.startsWith('https://') ? event.image : `https://trailblazers-verc-server.vercel.app${event.image}`} 
                            alt={event.name}
                            className="h-12 w-12 rounded object-cover"
                            onError={(e) => {
                              console.error('Image load error:', event.image);
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltZzwvdGV4dD48L3N2Zz4=';
                            }}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                            No Img
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{event.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(event.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{event.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{event.capacity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEventModal(event)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
            </div>                        
          </div>                    
        )}

      {/* Success message display */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          {successMessage}
        </div>
      )}

      {/* Error message display */}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          {errorMessage}
        </div>
      )}
      
      {/* Create Event Tab */}
      {activeTab === 'createEvent' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Create New Event</h3>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <EventForm 
              onSubmit={handleCreateEvent} 
              regions={stats.regions.map(r => r.name)}
              campuses={stats.campuses.map(c => c.name)}
            />
          </div>
        </div>
      )}
      
      {/* Edit Event Tab */}
      {activeTab === 'editEvent' && isEditingEvent && selectedEvent && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Edit Event</h3>
            <button
              onClick={() => {
                setIsEditingEvent(false);
                setSelectedEvent(null);
                setActiveTab('events');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <EventForm 
              onSubmit={handleUpdateEvent} 
              regions={stats.regions.map(r => r.name)}
              campuses={stats.campuses.map(c => c.name)}
              initialData={selectedEvent}
            />
          </div>
        </div>
      )}
      
    </main>
    {/* Event Modal - placed at the root level outside all tabs */}
      {showModal && selectedEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Event Details</h3>
              <button 
                onClick={closeEventModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
              <div className="px-6 py-4">
              {/* Tabs */}
              <div className="border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setEventTab('details')}
                    className={`${
                      eventTab === 'details'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Event Details
                  </button>
                  <button
                    onClick={() => setEventTab('attendance')}
                    className={`${
                      eventTab === 'attendance'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Attendance
                  </button>
                </nav>
              </div>

              {eventTab === 'details' ? (
                <>
                  {selectedEvent.image && (
                    <div className="mb-6">
                      <img 
                        src={selectedEvent.image.startsWith('http://') || selectedEvent.image.startsWith('https://') ? selectedEvent.image : `https://trailblazers-verc-server.vercel.app${selectedEvent.image}`}
                        alt={selectedEvent.name}
                        className="w-full h-64 object-cover rounded-lg shadow-md"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="text-md text-gray-900">{selectedEvent.name}</p>
                  </div>
              
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="text-md text-gray-900">{selectedEvent.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="text-md text-gray-900">{new Date(selectedEvent.date).toLocaleDateString()}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="text-md text-gray-900">{selectedEvent.location}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Capacity</p>
                  <p className="text-md text-gray-900">{selectedEvent.capacity}</p>
                </div>
                  <div>
                  <p className="text-sm font-medium text-gray-500">Created By</p>
                  <p className="text-md text-gray-900">
                    {selectedEvent?.createdBy?.name || 'Unknown User'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Registration Opens</p>
                  <p className="text-md text-gray-900">
                    {selectedEvent?.registrationStartDate 
                      ? format(new Date(selectedEvent.registrationStartDate), 'MMM dd, yyyy h:mm a')
                      : 'Not set'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Registration Closes</p>
                  <p className="text-md text-gray-900">
                    {selectedEvent?.registrationEndDate
                      ? format(new Date(selectedEvent.registrationEndDate), 'MMM dd, yyyy h:mm a')
                      : 'Not set'}
                  </p>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500">Regions</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedEvent.regions && selectedEvent.regions.map((region, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {region}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500">Campuses</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedEvent.campuses && selectedEvent.campuses.map((campus, index) => (
                    <span key={index} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      {campus}
                    </span>
                  ))}
                </div>              </div>
              </>) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Attendance List</h3>
                    <p className="text-sm text-gray-500">
                      {selectedEvent?.attendance?.length || 0} registered
                    </p>
                  </div>
                  
                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    {selectedEvent?.attendance?.length > 0 ? (
                      <ul className="divide-y divide-gray-200">
                        {selectedEvent.attendance.map((record) => (
                          <li key={record._id} className="px-4 py-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{record.user.name}</p>
                                <p className="text-sm text-gray-500">{record.user.email}</p>
                                <p className="text-sm text-gray-500">Role: {record.user.role}</p>
                              </div>
                              <div className="flex items-center">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  record.checkedIn
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {record.checkedIn ? 'Checked In' : 'Registered'}
                                </span>
                                {record.checkedIn && record.checkedInAt && (
                                  <p className="ml-2 text-sm text-gray-500">
                                    {format(new Date(record.checkedInAt), 'MMM dd, h:mm a')}
                                  </p>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-center py-4 text-gray-500">No attendees yet</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-3 bg-gray-50 text-right">
              <button
                onClick={closeEventModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 mr-2"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setIsEditingEvent(true);
                  setShowModal(false); // Close modal but keep selectedEvent
                  setActiveTab('editEvent');
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Management Modal */}
      <ProfileManagement 
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />

      {/* Attendance Details Modal */}
      {attendanceModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={() => setAttendanceModalOpen(false)}
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        Attendance List - {selectedEventAttendance}
                      </h3>
                      <button
                        onClick={() => setAttendanceModalOpen(false)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="mt-4">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invited By</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {eventAttendanceList.map((record) => (
                              <tr key={record._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{record.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{record.phone}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{record.location}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">{record.invitedBy || 'N/A'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    record.status === 'Registered' ? 'bg-green-100 text-green-800' :
                                    record.status === 'Checked In' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {record.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(record.createdAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setAttendanceModalOpen(false)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
};


// Stat Card Component
const StatCard = ({ title, value, bgColor }) => {
  return (
    <div className={`${bgColor} rounded-lg text-white min-w-[140px]`}>
      <div className="p-4">
        <dt className="text-sm font-normal truncate mb-1">{title}</dt>
        <dd className="text-2xl font-semibold">{value}</dd>
      </div>
    </div>
  );
};

// Action Button Component
const ActionButton = ({ title, description, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition"
    >
      <h4 className="text-lg font-medium text-gray-900">{title}</h4>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </button>
  );
};



// New Event Form Component
const EventForm = ({ onSubmit, regions, campuses, initialData = {} }) => {
  // Convert database path to full URL for preview
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath; // Already full URL
    return `https://trailblazers-verc-server.vercel.app${imagePath}`; // Prepend base URL
    // return `http://localhost:5000${imagePath}`; // For local development
  };

  console.log('EventForm initialData:', initialData);
  console.log('EventForm initialData.image:', initialData.image);
  console.log('EventForm getImageUrl result:', getImageUrl(initialData.image));

  const [formData, setFormData] = useState({    name: initialData.name || '',
    description: initialData.description || '',
    date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
    startTime: initialData.startTime ? new Date(initialData.startTime).toISOString().slice(0, 16) : '',
    endTime: initialData.endTime ? new Date(initialData.endTime).toISOString().slice(0, 16) : '',
    registrationStartDate: initialData.registrationStartDate ? new Date(initialData.registrationStartDate).toISOString().slice(0, 16) : '',
    registrationEndDate: initialData.registrationEndDate ? new Date(initialData.registrationEndDate).toISOString().slice(0, 16) : '',
    location: initialData.location || '',
    capacity: initialData.capacity || 0,
    registrationAccessControl: initialData.registrationAccessControl || 'Public',
    regions: initialData.regions || [],
    campuses: initialData.campuses || [],
    image: initialData.image || '',
    imageFile: null // Add state for file upload
  });

  const [previewImage, setPreviewImage] = useState(getImageUrl(initialData.image));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        alert('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
        return;
      }

      if (file.size > maxSize) {
        alert('File is too large. Maximum size is 5MB.');
        return;
      }

      // Set file and create preview
      setFormData(prev => ({
        ...prev,
        imageFile: file
      }));

      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMultiSelectChange = (e) => {
    const { name, selectedOptions } = e.target;
    const values = Array.from(selectedOptions).map(option => option.value);
    setFormData(prev => ({
      ...prev,
      [name]: values
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Remove imageFile before submitting if no file selected
    const submissionData = { ...formData };
    if (!submissionData.imageFile) {
      delete submissionData.imageFile;
    }
    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-6 mt-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Event Name</label>
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
          />
        </div>        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">Event Date</label>
          <input
            type="date"
            name="date"
            id="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">Start Time</label>
            <input
              type="datetime-local"
              name="startTime"
              id="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">End Time</label>
            <input
              type="datetime-local"
              name="endTime"
              id="endTime"
              value={formData.endTime}
              onChange={handleChange}
              required
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <h3 className="block text-sm font-medium text-gray-700 mb-2">Registration Period</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="registrationStartDate" className="block text-sm font-medium text-gray-700">Opens</label>
              <input
                type="datetime-local"
                name="registrationStartDate"
                id="registrationStartDate"
                value={formData.registrationStartDate}
                onChange={handleChange}
                required
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="registrationEndDate" className="block text-sm font-medium text-gray-700">Closes</label>
              <input
                type="datetime-local"
                name="registrationEndDate"
                id="registrationEndDate"
                value={formData.registrationEndDate}
                onChange={handleChange}
                required
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            id="description"
            rows="3"
            value={formData.description}
            onChange={handleChange}
            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
          <input
            type="text"
            name="location"
            id="location"
            value={formData.location}
            onChange={handleChange}
            required
            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">Capacity</label>
          <input
            type="number"
            name="capacity"
            id="capacity"
            value={formData.capacity}
            onChange={handleChange}
            required
            min="1"
            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label htmlFor="registrationAccessControl" className="block text-sm font-medium text-gray-700">
            Registration Access
          </label>
          <select
            name="registrationAccessControl"
            id="registrationAccessControl"
            value={formData.registrationAccessControl}
            onChange={handleChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="Public">Open to Visitors</option>
            <option value="All">Open to All (Members & Leaders)</option>
            <option value="Members">Members Only</option>
            <option value="Leaders">Leaders Only</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Controls who can register for this event
          </p>
        </div>

        <div>
        <label htmlFor="regions" className="block text-sm font-medium text-gray-700">
          Regions (Optional)
        </label>
        <select
          multiple
          name="regions"
          id="regions"
          value={formData.regions}
          onChange={handleMultiSelectChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          {regions.map((region, index) => (
            <option key={index} value={region}>{region}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Leave blank to include all regions automatically
        </p>
      </div>

      <div>
        <label htmlFor="campuses" className="block text-sm font-medium text-gray-700">
          Campuses (Optional)
        </label>
        <select
          multiple
          name="campuses"
          id="campuses"
          value={formData.campuses}
          onChange={handleMultiSelectChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          {campuses.map((campus, index) => (
            <option key={index} value={campus}>{campus}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Leave blank to include all campuses automatically
        </p>
      </div>

        <div className="sm:col-span-2">
        <label htmlFor="imageUpload" className="block text-sm font-medium text-gray-700">
          Event Image (Optional)
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            {previewImage ? (
              <img 
                src={previewImage} 
                alt="Preview" 
                className="mx-auto h-32 w-auto object-cover rounded-md"
                onError={(e) => {
                  console.error('Image failed to load:', previewImage);
                  e.target.style.display = 'none';
                }}
                onLoad={() => {
                  console.log('Image loaded successfully:', previewImage);
                }}
              />
            ) : (
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="imageUpload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
              >
                <span>Upload an image</span>
                <input
                  id="imageUpload"
                  name="image"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>
              {previewImage && (
                <button
                  type="button"
                  onClick={() => {
                    setPreviewImage(null);
                    setFormData(prev => ({
                      ...prev,
                      imageFile: null,
                      image: ''
                    }));
                  }}
                  className="ml-3 text-sm text-red-600"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF up to 5MB
            </p>
          </div>
        </div>
      </div>
      </div>

      <div className="mt-6">
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {initialData._id ? 'Update Event' : 'Create Event'}
        </button>
      </div>
    </form>
  );
};


// User Form Component
const UserForm = ({ onUserCreated }) => {

  const currentUserRole = useSelector((state) => state.auth.user?.role);

  console.log('Received Current User Role:', currentUserRole);

    const [formData, setFormData] = useState({
      name: '',
      email: '',
      phone: '',
      password: '',
      memberCode: '', // For admin-assigned member code
      role: 'Member', // Default role
      region: '',
      campus: '',
      newRegion: '', // For adding a new region
      newCampus: '', // For adding a new campus
      position: '' // For Leader position
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [regions, setRegions] = useState([]); // Fetched regions
    const [campuses, setCampuses] = useState([]); // Fetched campuses
  
    // Fetch regions and campuses from RegionCampus management
    useEffect(() => {
      const fetchRegionsAndCampuses = async () => {
        try {
          const [regionsRes, campusesRes] = await Promise.all([
            API.get('/api/region-campus/regions'),
            API.get('/api/region-campus/campuses')
          ]);
          setRegions(regionsRes.data.data.map(r => r.name) || []);
          setCampuses(campusesRes.data.data.map(c => c.name) || []);
        } catch (err) {
          setError('Failed to fetch regions and campuses');
          console.error(err);
        }
      };
      fetchRegionsAndCampuses();
    }, []);
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      setSuccess(null);
  
      try {
        // Validate Leader position
        if (formData.role === 'Leader' && !formData.position) {
          setError('Position is required for Leaders');
          setLoading(false);
          return;
        }

        // Prepare payload
        const payload = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: formData.role
        };

        // Add memberCode if provided for Members
        if (formData.role === 'Member' && formData.memberCode && formData.memberCode.trim()) {
          payload.memberCode = formData.memberCode.trim();
        }
  
        // Handle region and campus based on role
        if (formData.role === 'Member' || formData.role === 'Leader') {
          // For Leader with new region/campus
          if (formData.role === 'Leader') {
            payload.region = formData.newRegion || formData.region;
            payload.campus = formData.newCampus || formData.campus;
            payload.position = formData.position.trim(); // Add position for Leader with trim
          } else {
            // For Member, must select existing region/campus
            payload.region = formData.region;
            payload.campus = formData.campus;
          }
        }

        console.log('Submitting payload:', payload); // Debug log
  
        // Choose the correct endpoint based on the role being created
        let endpoint;
        if (formData.role === 'Member' && currentUserRole === 'Leader') {
          // Leaders can only create members
          endpoint = '/api/users/members';
        } else {
          // Admins can create any role
          endpoint = '/api/users';
        }
  
        await API.post(endpoint, payload);
  
        // Display success message and reset form
        setSuccess(`${formData.role} created successfully!${
          formData.role === 'Member' ? ' User can now log in with full access.' : ''
        }`);
        
        // Call parent callback to refresh dashboard data
        if (onUserCreated) {
          onUserCreated();
        }
        
        // Reset form after successful submission
        setFormData({
          name: '',
          email: '',
          phone: '',
          password: '',
          memberCode: '',
          role: 'Member',
          region: '',
          campus: '',
          newRegion: '',
          newCampus: '',
          position: ''
        });
      } catch (err) {
        const errorMsg = err.response?.data?.message || 
                        (err.response?.data?.errors && err.response.data.errors.length > 0 
                          ? err.response.data.errors[0].msg 
                          : 'Failed to create user');
        setError(errorMsg);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
            <p>{error}</p>
          </div>
        )}
  
        {success && (
          <div className="mb-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4" role="alert">
            <p>{success}</p>
          </div>
        )}
  
        <div className="grid grid-cols-1 gap-6 mt-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter full name"
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200"
            />
          </div>
  
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="email@example.com"
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              name="phone"
              id="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1234567890"
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200"
            />
          </div>
  
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              placeholder="Minimum 6 characters"
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200"
            />
          </div>

          {formData.role === 'Member' && currentUserRole === 'Admin' && (
            <div>
              <label htmlFor="memberCode" className="block text-sm font-medium text-gray-700 mb-1">
                Member Code (Optional)
              </label>
              <input
                type="text"
                name="memberCode"
                id="memberCode"
                value={formData.memberCode}
                onChange={handleChange}
                placeholder="e.g., TBN-12345"
                pattern="TBN-\d{5}"
                title="Format: TBN-XXXXX (5 digits)"
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200"
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave blank to auto-generate. Format: TBN-XXXXX (e.g., TBN-12345)
              </p>
            </div>
          )}
  
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select 
              id="role" 
              name="role" 
              value={formData.role} 
              onChange={handleChange} 
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm py-2.5 px-4 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200"
            >
              <option value="Member">Member</option>
              
              {currentUserRole === 'Admin' && (
                <>
                  <option value="Leader">Leader</option>
                  <option value="Admin">Admin</option>
                </>
              )}
            </select>
          </div>
  
          {(formData.role === 'Leader' || formData.role === 'Member') && (
            <>
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                  Region {formData.role === 'Member' && <span className="text-red-500">*</span>}
                </label>
                <select
                  id="region"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  required={formData.role === 'Member'} // Required for Members
                  className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm py-2.5 px-4 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200"
                >
                  <option value="">Select a region</option>
                  {regions.map((region, index) => (
                    <option key={index} value={region}>{region}</option>
                  ))}
                </select>
                {formData.role === 'Leader' && (
                  <div className="mt-2">
                    <label className="text-xs text-gray-500">Or create a new region:</label>
                    <input
                      type="text"
                      name="newRegion"
                      placeholder="Enter a new region"
                      value={formData.newRegion}
                      onChange={handleChange}
                      className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200"
                    />
                  </div>
                )}
              </div>
  
              <div>
                <label htmlFor="campus" className="block text-sm font-medium text-gray-700 mb-1">
                  Campus {formData.role === 'Member' && <span className="text-red-500">*</span>}
                </label>
                <select
                  id="campus"
                  name="campus"
                  value={formData.campus}
                  onChange={handleChange}
                  required={formData.role === 'Member'} // Required for Members
                  className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm py-2.5 px-4 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200"
                >
                  <option value="">Select a campus</option>
                  {campuses.map((campus, index) => (
                    <option key={index} value={campus}>{campus}</option>
                  ))}
                </select>
                {formData.role === 'Leader' && (
                  <div className="mt-2">
                    <label className="text-xs text-gray-500">Or create a new campus:</label>
                    <input
                      type="text"
                      name="newCampus"
                      placeholder="Enter a new campus"
                      value={formData.newCampus}
                      onChange={handleChange}
                      className="mt-2 block w-full border-2 border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {formData.role === 'Leader' && (
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                Position <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                required
                placeholder="e.g., Regional Coordinator, Campus Leader"
                className="mt-1 block w-full border-2 border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200"
              />
              <p className="mt-1 text-xs text-gray-500">
                Specify the leadership position or title
              </p>
            </div>
          )}
        </div>
  
        {formData.role === 'Member' && (
          <div className="mt-4 text-sm text-gray-500 bg-gray-50 p-3 rounded">
            <p>Note: A member must be associated with a region and campus that has an existing Leader. 
            Admin-created members are automatically set to "Completed" status and can log in immediately.</p>
          </div>
        )}
  
        <div className="mt-6">
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              loading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    );
    
};

export default AdminDashboard;