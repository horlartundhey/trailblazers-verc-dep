import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../../redux/slices/authSlice';
import UserDetailsModal from './UserDetailsModal';
import API from '../../utils/api';
import GalleryImageForm from '../../components/GalleryImageForm';


const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalMembers: 0,
  totalLeaders: 0,
  pendingMembers: 0,
  completedMembers: 0,
  totalEvents: 0,
  totalPayments: 0,
  regions: [],
  campuses: []
  });
  const [users, setUsers] = useState([]);

  // For the Users modal
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [regions, setRegions] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
const [showModal, setShowModal] = useState(false);



  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  
  useEffect(() => {
    const fetchDashboardData = async () => {
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
        
        
        // Calculate dashboard statistics from user data
        const totalMembers = userData.filter(user => user.role === 'Member').length;
        const totalLeaders = userData.filter(user => user.role === 'Leader').length;
        const pendingMembers = userData.filter(user => 
          user.role === 'Member' && user.registrationStatus === 'Pending').length;
        const completedMembers = userData.filter(user => 
          user.role === 'Member' && user.registrationStatus === 'Completed').length;

          // Calculate total events
      const totalEvents = eventsData.length;
      
      // Calculate total payments (sum of all payment amounts)
      const totalPayments = paymentsData.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        
        // Extract regions and create region stats
        const regionData = {};
        userData.forEach(user => {
          if (user.region) {
            if (!regionData[user.region]) {
              regionData[user.region] = {
                _id: user.region,
                name: user.region,
                memberCount: 0
              };
            }
            regionData[user.region].memberCount += 1;
          }
        });
        
        // Extract campuses and create campus stats
        const campusData = {};
        userData.forEach(user => {
          if (user.campus) {
            if (!campusData[user.campus]) {
              campusData[user.campus] = {
                _id: user.campus,
                name: user.campus,
                memberCount: 0
              };
            }
            campusData[user.campus].memberCount += 1;
          }
        });
        
        setStats({
          totalMembers,
        totalLeaders,
        pendingMembers,
        completedMembers,
        totalEvents,
        totalPayments,
        regions: Object.values(regionData) || [],
        campuses: Object.values(campusData) || []
        });
        
        // Extract unique regions and campuses for filtering
        const uniqueRegions = [...new Set(userData
          .filter(user => user.region)
          .map(user => user.region))];
          
        const uniqueCampuses = [...new Set(userData
          .filter(user => user.campus)
          .map(user => user.campus))];
          
        setRegions(uniqueRegions);
        setCampuses(uniqueCampuses);
        
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const handleCreateEvent = async (eventData) => {
    try {
      setLoading(true);
      // Clear previous messages
      setSuccessMessage('');
      setErrorMessage('');
      
      // If an image file is present, create a FormData object
      if (eventData.imageFile) {
        const formData = new FormData();
        
        // Append all event data fields
        Object.keys(eventData).forEach(key => {
          if (key !== 'imageFile') {
            formData.append(key, eventData[key]);
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
      } else {
        // If no image, proceed with regular JSON post
        const response = await API.post('/api/events', eventData);
        
        setEvents(prevEvents => [...prevEvents, response.data.data]);
        setSuccessMessage('Event created successfully!');
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
  const handleUpdateEvent = async (eventId, eventData) => {
    try {
      setLoading(true);
      const response = await API.put(`/api/events/${eventId}`, eventData);
      
      // Update the events list
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event._id === eventId ? response.data.data : event
        )
      );
      
      // Show success message
      setSuccess('Event updated successfully!');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update event';
      setError(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // New function to delete an event
  const handleDeleteEvent = async (eventId) => {
    try {
      setLoading(true);
      await API.delete(`/api/events/${eventId}`);
      
      // Remove the event from the events list
      setEvents(prevEvents => prevEvents.filter(event => event._id !== eventId));
      
      // Show success message
      setSuccess('Event deleted successfully!');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete event';
      setError(errorMsg);
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
            <span className="text-gray-700">Welcome, {user?.name}</span>
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
          <div className="flex space-x-8">
            <button
              className={`py-4 px-1 border-b-2 ${
                activeTab === 'dashboard' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } font-medium`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`py-4 px-1 border-b-2 ${
                activeTab === 'gallery' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } font-medium`}
              onClick={() => setActiveTab('gallery')}
            >
              Gallery
            </button>
            <button
              className={`py-4 px-1 border-b-2 ${
                activeTab === 'users' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } font-medium`}
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>
            <button
              className={`py-4 px-1 border-b-2 ${
                activeTab === 'createUser' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } font-medium`}
              onClick={() => setActiveTab('createUser')}
            >
              Create User
            </button>
            <button
              className={`py-4 px-1 border-b-2 ${
                activeTab === 'events' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } font-medium`}
              onClick={() => setActiveTab('events')}
            >
              Events
            </button>
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
            <StatCard title="Pending Members" value={stats.pendingMembers} bgColor="bg-yellow-500" />
            <StatCard title="Completed Members" value={stats.completedMembers} bgColor="bg-purple-500" />
            <StatCard title="Total Events" value={stats.totalEvents} bgColor="bg-indigo-500" />
            <StatCard title="Total Payments" value={`N${stats.totalPayments.toFixed(2)}`} bgColor="bg-teal-500" />
            </div>
            
            {/* Regions and Campuses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-gray-50">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Regions</h3>
                </div>
                <div className="p-6">
                  {stats.regions.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {stats.regions.map(region => (
                        <div key={region._id} className="border rounded p-4 flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{region.name}</h4>
                            <p className="text-sm text-gray-500">{region.memberCount} members</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200"
                              onClick={() => setFilterParams(prev => ({...prev, region: region._id}))}
                            >
                              Filter
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
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
                    <div className="grid grid-cols-1 gap-4">
                      {stats.campuses.map(campus => (
                        <div key={campus._id} className="border rounded p-4 flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{campus.name}</h4>
                            <p className="text-sm text-gray-500">{campus.memberCount} members</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200"
                              onClick={() => setFilterParams(prev => ({...prev, campus: campus._id}))}
                            >
                              Filter
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
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
            
            {/* Filter Section */}
            <div className="p-4 border-b">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    name="role"
                    value={filterParams.role}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Roles</option>
                    <option value="Admin">Admin</option>
                    <option value="Leader">Leader</option>
                    <option value="Member">Member</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Region</label>
                  <select
                    name="region"
                    value={filterParams.region}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Regions</option>
                    {regions.map((region, index) => (
                      <option key={index} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Campus</label>
                  <select
                    name="campus"
                    value={filterParams.campus}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Campuses</option>
                    {campuses.map((campus, index) => (
                      <option key={index} value={campus}>{campus}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="registrationStatus"
                    value={filterParams.registrationStatus}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
                >
                  Reset
                </button>
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                >
                  Apply Filters
                </button>
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
                        Email
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
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users && users.length > 0 ? (
                      users.map(user => (
                        <tr key={user._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            {user.memberCode && (
                              <div className="text-sm text-gray-500">ID: {user.memberCode}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.email}</div>
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
                        <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
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
              <UserForm />
            </div>
          </div>
        )}

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Gallery Management</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Upload and manage gallery images</p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <GalleryImageForm />
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
                    {typeof selectedEvent.createdBy === 'object' 
                      ? selectedEvent.createdBy.name || 'Unknown User'
                      : selectedEvent.createdBy}
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
                </div>
              </div>
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
                  // Handle edit event logic here
                  closeEventModal();
                  // You could set a different state to open an edit form
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Edit
              </button>
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
    <div className={`${bgColor} rounded-lg shadow overflow-hidden text-white`}>
      <div className="px-4 py-5 sm:p-6">
        <dt className="text-sm font-medium truncate">{title}</dt>
        <dd className="mt-1 text-3xl font-semibold">{value}</dd>
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
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    description: initialData.description || '',
    date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
    location: initialData.location || '',
    capacity: initialData.capacity || 0,
    regions: initialData.regions || [],
    campuses: initialData.campuses || [],
    image: initialData.image || '',
    imageFile: null // Add state for file upload
  });

  const [previewImage, setPreviewImage] = useState(initialData.image || null);

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
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
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
const UserForm = () => {

  const currentUserRole = useSelector((state) => state.auth.user?.role);

  console.log('Received Current User Role:', currentUserRole);

    const [formData, setFormData] = useState({
      name: '',
      email: '',
      password: '',
      role: 'Member', // Default role
      region: '',
      campus: '',
      newRegion: '', // For adding a new region
      newCampus: '' // For adding a new campus
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [regions, setRegions] = useState([]); // Fetched regions
    const [campuses, setCampuses] = useState([]); // Fetched campuses
  
    // Fetch regions and campuses from the backend
    useEffect(() => {
      const fetchRegionsAndCampuses = async () => {
        try {
          const response = await API.get('/api/users/regions-and-campuses');
          setRegions(response.data.regions || []);
          setCampuses(response.data.campuses || []);
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
        // Prepare payload
        const payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        };
  
        // Handle region and campus based on role
        if (formData.role === 'Member' || formData.role === 'Leader') {
          // For Leader with new region/campus
          if (formData.role === 'Leader') {
            payload.region = formData.newRegion || formData.region;
            payload.campus = formData.newCampus || formData.campus;
          } else {
            // For Member, must select existing region/campus
            payload.region = formData.region;
            payload.campus = formData.campus;
          }
        }
  
        // Choose the correct endpoint based on the role being created
        let endpoint;
        if (formData.role === 'Member' && currentUserRole === 'Leader') {
          // Leaders can only create members
          endpoint = '/api/users/members';
        } else {
          // Admins can create any role
          endpoint = '/api/users';
        }
  
        const response = await API.post(endpoint, payload);
  
        // Display success message and reset form
        setSuccess(`${formData.role} created successfully!${
          formData.role === 'Member' ? ' Registration status is Pending.' : ''
        }`);
        
        // Reset form after successful submission
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'Member',
          region: '',
          campus: '',
          newRegion: '',
          newCampus: ''
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
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
  
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
  
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
  
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
            <select 
              id="role" 
              name="role" 
              value={formData.role} 
              onChange={handleChange} 
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                <label htmlFor="region" className="block text-sm font-medium text-gray-700">
                  Region {formData.role === 'Member' && <span className="text-red-500">*</span>}
                </label>
                <select
                  id="region"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  required={formData.role === 'Member'} // Required for Members
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                )}
              </div>
  
              <div>
                <label htmlFor="campus" className="block text-sm font-medium text-gray-700">
                  Campus {formData.role === 'Member' && <span className="text-red-500">*</span>}
                </label>
                <select
                  id="campus"
                  name="campus"
                  value={formData.campus}
                  onChange={handleChange}
                  required={formData.role === 'Member'} // Required for Members
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                      className="mt-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
  
        {formData.role === 'Member' && (
          <div className="mt-4 text-sm text-gray-500 bg-gray-50 p-3 rounded">
            <p>Note: A member must be associated with a region and campus that has an existing Leader. 
            The registration status will be set to "Pending" until approved.</p>
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