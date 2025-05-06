import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../redux/slices/authSlice';
import API from '../../utils/api';


const StatCard = ({ title, value, bgColor }) => (
  <div className={`${bgColor} rounded-lg shadow overflow-hidden`}>
    <div className="px-4 py-5 sm:p-6">
      <h3 className="text-xl font-bold text-white">{value}</h3>
      <p className="text-sm text-white opacity-80">{title}</p>
    </div>
  </div>
);

const ActionButton = ({ title, description, onClick }) => (
  <button
    onClick={onClick}
    className="p-4 border rounded-lg hover:bg-gray-50 transition text-left"
  >
    <h4 className="font-medium text-gray-900">{title}</h4>
    <p className="text-sm text-gray-500">{description}</p>
  </button>
);

const UserDetailsModal = ({ userId, isOpen, onClose }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await API.get(`/api/users/${userId}`);
        setUser(response.data.data);
      } catch (error) {
        console.error('Error fetching user details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && userId) {
      fetchUserData();
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b">
          <h3 className="text-lg font-medium text-gray-900">User Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {loading ? (
          <div className="p-4 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : user ? (
          <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Member Code</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.memberCode || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Registration Status</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.registrationStatus}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Region</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.region}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Campus</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.campus}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(user.createdAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500">User not found</div>
        )}
        
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


const LeaderDashboard = () => {
  const [stats, setStats] = useState({
    totalMembers: 0,
    pendingMembers: 0,
    completedMembers: 0,
    totalEvents: 0,
    totalPayments: 0
  });

  
  
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterParams, setFilterParams] = useState({
    registrationStatus: ''
  });

  const [eventFormData, setEventFormData] = useState({
    name: '',
    description: '',
    date: '',
    location: '',
    capacity: '',
    image: null
  });
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [eventAction, setEventAction] = useState('create'); // 'create' or 'edit'


  const [payments, setPayments] = useState([]);
const [paymentStats, setPaymentStats] = useState({
  totalContributions: 0,
  monthlyBreakdown: {}
});

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);


  const fetchPayments = async () => {
    try {
      const response = await API.get('/api/payments/me');
      setPayments(response.data.data || []);
      
      // Calculate stats from the response
      const total = response.data.totalContributions || 0;
      const breakdown = response.data.monthlyBreakdown || {};
      
      setPaymentStats({
        totalContributions: total,
        monthlyBreakdown: breakdown
      });
      
      // Update dashboard stats if needed
      setStats(prev => ({
        ...prev,
        totalPayments: total
      }));
    } catch (error) {
      console.error('Error fetching payments:', error);
      setErrorMessage('Failed to load payment history');
    }
  };
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch members for the leader's region and campus
        const membersResponse = await API.get(
          `/api/users/region/${user.region}/campus/${user.campus}`
        );
        
        const membersData = membersResponse.data.data || [];
        setUsers(membersData);
        
        // Fetch events for the region and campus
        const eventsResponse = await API.get('/api/events', {
          params: { region: user.region, campus: user.campus }
        });
        const eventsData = eventsResponse.data.data || [];
        setEvents(eventsData);

        // Fetch payment data
      const paymentsResponse = await API.get('/api/payments/me');
      const paymentsData = paymentsResponse.data.data || [];
      const totalContributions = paymentsResponse.data.totalContributions || 0;
      
      setPayments(paymentsData);
      setPaymentStats({
        totalContributions,
        monthlyBreakdown: paymentsResponse.data.monthlyBreakdown || {}
      });
        
        // Calculate dashboard statistics
        const totalMembers = membersData.length;
        const pendingMembers = membersData.filter(
          member => member.registrationStatus === 'Pending'
        ).length;
        const completedMembers = membersData.filter(
          member => member.registrationStatus === 'Completed'
        ).length;
        const totalEvents = eventsData.length;
               
        
        setStats({
          totalMembers,
          pendingMembers,
          completedMembers,
          totalEvents,
          totalPayments: totalContributions 
        });
        
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user.region, user.campus, user]);
  
  const handleLogout = () => {
      dispatch(logout());
    };
  
  const viewUserDetails = (userId) => {
    setSelectedUserId(userId);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUserId(null);
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterParams(prev => ({ ...prev, [name]: value }));
  };
  
  const resetFilters = () => {
    setFilterParams({ registrationStatus: '' });
  };

  
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    region: user?.region || '',
    campus: user?.campus || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }
  
    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');
  
      const memberData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        region: user.region,
        campus: user.campus
      };
  
      const response = await API.post('/api/users/members', memberData);
      
      setSuccessMessage('Member created successfully!');
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        region: user?.region || '',
        campus: user?.campus || ''
      });
      
      // Optionally refresh members list
      // fetchMembers();
      
    } catch (error) {
      console.error('Error creating member:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to create member');
    } finally {
      setLoading(false);
    }
  };


  const applyFilters = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = {
        role: 'Member', // Leaders can only see members
        ...filterParams
      };
      
      const response = await API.get('/api/users/filter', { params });
      setUsers(response.data.data || []);
    } catch (err) {
      setError('Failed to filter users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  // Add these functions inside your component
const fetchEvents = async () => {
  try {
    const response = await API.get('/api/events', {
      params: { region: user.region, campus: user.campus }
    });
    setEvents(response.data.data || []);
    // Update stats with the new event count
    setStats(prev => ({
      ...prev,
      totalEvents: response.data.data?.length || 0
    }));
  } catch (error) {
    console.error('Error fetching events:', error);
    setErrorMessage('Failed to load events');
  }
};

const handleEventSubmit = async (e) => {
  e.preventDefault();
  try {
    setLoading(true);
    setErrorMessage('');
    
    const eventData = {
      ...eventFormData,
      regions: [user.region],
      campuses: [user.campus]
    };
    
    if (eventAction === 'create') {
      await API.post('/api/events', eventData);
      setSuccessMessage('Event created successfully!');
    } else {
      await API.put(`/api/events/${selectedEventId}`, eventData);
      setSuccessMessage('Event updated successfully!');
    }
    
    setEventFormData({
      name: '',
      description: '',
      date: '',
      location: '',
      capacity: '',
      image: null
    });
    setIsEventModalOpen(false);
    fetchEvents();
  } catch (error) {
    setErrorMessage(error.response?.data?.message || 
      `Failed to ${eventAction === 'create' ? 'create' : 'update'} event`);
  } finally {
    setLoading(false);
  }
};

const handleEditEvent = (event) => {
  setEventFormData({
    name: event.name,
    description: event.description,
    date: event.date.split('T')[0], // Format date for datetime-local input
    location: event.location,
    capacity: event.capacity,
    image: event.image || null
  });
  setSelectedEventId(event._id);
  setEventAction('edit');
  setIsEventModalOpen(true);
};

const deleteEvent = async (eventId) => {
  if (!window.confirm('Are you sure you want to delete this event?')) return;
  
  try {
    setLoading(true);
    await API.delete(`/api/events/${eventId}`);
    setSuccessMessage('Event deleted successfully');
    fetchEvents();
  } catch (error) {
    setErrorMessage('Failed to delete event');
  } finally {
    setLoading(false);
  }
};


  // Helper functions for date handling
const parseAndFormatMonth = (monthStr) => {
  // Check if monthStr contains year-month format (like 2023-01)
  if (typeof monthStr === 'string' && /^\d{4}-\d{1,2}$/.test(monthStr)) {
    const [year, month] = monthStr.split('-');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = parseInt(month, 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${monthNames[monthIndex]} ${year}`;
    }
  }
  
  // Try to parse as date object
  try {
    const date = new Date(monthStr);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
    }
  } catch (e) {
    console.error('Date parsing error:', e);
  }
  
  // If all else fails, return the month string or a default
  return monthStr || 'Unknown Date';
};

const formatSafeDate = (dateStr) => {
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString();
    }
    return 'Invalid Date';
  } catch (e) {
    console.error('Date formatting error:', e);
    return 'Invalid Date';
  }
};

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Leader Dashboard</h1>
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
                activeTab === 'members' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } font-medium`}
              onClick={() => setActiveTab('members')}
            >
              Members
            </button>
            <button
              className={`py-4 px-1 border-b-2 ${
                activeTab === 'createMember' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } font-medium`}
              onClick={() => setActiveTab('createMember')}
            >
              Create Member
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
            <button
              className={`py-4 px-1 border-b-2 ${
                activeTab === 'payments' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } font-medium`}
              onClick={() => setActiveTab('payments')}
            >
              My Payments
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
        
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}
        
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <span className="block sm:inline">{errorMessage}</span>
          </div>
        )}
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            {/* Region and Campus info */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
              <div className="px-4 py-5 sm:px-6 bg-gray-50">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Your Assignment</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded p-4">
                  <h4 className="font-medium text-gray-700">Region</h4>
                  <p className="text-lg font-bold">{user?.region || 'Not assigned'}</p>
                </div>
                <div className="border rounded p-4">
                  <h4 className="font-medium text-gray-700">Campus</h4>
                  <p className="text-lg font-bold">{user?.campus || 'Not assigned'}</p>
                </div>
              </div>
            </div>
            
            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard title="Total Members" value={stats.totalMembers} bgColor="bg-blue-500" />
              <StatCard title="Pending Members" value={stats.pendingMembers} bgColor="bg-yellow-500" />
              <StatCard title="Completed Members" value={stats.completedMembers} bgColor="bg-green-500" />
              <StatCard title="Total Events" value={stats.totalEvents} bgColor="bg-indigo-500" />
            </div>
            
            {/* Quick Actions */}
            <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-5 sm:px-6 bg-gray-50">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ActionButton 
                    title="Manage Members" 
                    description="View and manage members in your campus" 
                    onClick={() => setActiveTab('members')} 
                  />
                  <ActionButton 
                    title="Create Member" 
                    description="Add new member to your campus" 
                    onClick={() => setActiveTab('createMember')} 
                  />
                  <ActionButton 
                    title="Pending Members" 
                    description="View pending registrations" 
                    onClick={() => {
                      setFilterParams({...filterParams, registrationStatus: 'Pending'});
                      setActiveTab('members');
                    }} 
                  />
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Member Management</h3>
              <button
                onClick={() => setActiveTab('createMember')}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
              >
                Add Member
              </button>
            </div>
            
            {/* Filter Section */}
            <div className="p-4 border-b">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Registration Status</label>
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
            
            {/* Members Table */}
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
                        Member Code
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
                      users.map(member => (
                        <tr key={member._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{member.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{member.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{member.memberCode || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {member.registrationStatus && (
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                member.registrationStatus === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {member.registrationStatus}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => viewUserDetails(member._id)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                          No members found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
        
        {/* Create Member Tab */}
        {activeTab === 'createMember' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Create New Member</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add a new member to your region and campus
              </p>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name Field */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>

                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>

                  {/* Password Field */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                      minLength="6"
                    />
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>

                  {/* Region Field (read-only, based on leader's region) */}
                  <div>
                    <label htmlFor="region" className="block text-sm font-medium text-gray-700">
                      Region
                    </label>
                    <input
                      type="text"
                      id="region"
                      name="region"
                      value={user?.region || ''}
                      readOnly
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  {/* Campus Field (read-only, based on leader's campus) */}
                  <div>
                    <label htmlFor="campus" className="block text-sm font-medium text-gray-700">
                      Campus
                    </label>
                    <input
                      type="text"
                      id="campus"
                      name="campus"
                      value={user?.campus || ''}
                      readOnly
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('members')}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Create Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Events Tab */}
        
    {activeTab === 'events' && (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Campus Events</h3>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setEventFormData({
                  name: '',
                  description: '',
                  date: '',
                  location: '',
                  capacity: '',
                  image: null
                });
                setEventAction('create');
                setIsEventModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
            >
              Create Event
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-6">
              {events.map(event => (
                <div key={event._id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {event.image && (
                    <div className="h-48 bg-gray-200 overflow-hidden">
                      <img 
                        src={`${import.meta.env.VITE_API_URL}${event.image}`} 
                        alt={event.name}
                        className="h-full object-contain"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-lg">{event.name}</h4>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(event.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {event.location}
                        </div>
                        <p className="mt-2 text-gray-600">{event.description}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            event.registeredMembers?.filter(m => m.status === 'Confirmed').length >= event.capacity 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {event.registeredMembers?.filter(m => m.status === 'Confirmed').length || 0}/{event.capacity} attendees
                          </span>
                          {event.registeredMembers?.filter(m => m.status === 'Waitlisted').length > 0 && (
                            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                              {event.registeredMembers.filter(m => m.status === 'Waitlisted').length} waitlisted
                            </span>
                          )}
                        </div>
                        {/* <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditEvent(event)}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteEvent(event._id)}
                            className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div> */}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No events</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new event.</p>
              <div className="mt-6">
                <button
                  onClick={() => {
                    setEventFormData({
                      name: '',
                      description: '',
                      date: '',
                      location: '',
                      capacity: '',
                      image: null
                    });
                    setEventAction('create');
                    setIsEventModalOpen(true);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Event
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Event Modal */}
    {isEventModalOpen && (
      <div className="fixed z-10 inset-0 overflow-y-auto">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                {eventAction === 'create' ? 'Create New Event' : 'Edit Event'}
              </h3>
              <form onSubmit={handleEventSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="event-name" className="block text-sm font-medium text-gray-700">Event Name</label>
                    <input
                      type="text"
                      id="event-name"
                      name="name"
                      value={eventFormData.name}
                      onChange={(e) => setEventFormData({...eventFormData, name: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="event-description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      id="event-description"
                      name="description"
                      value={eventFormData.description}
                      onChange={(e) => setEventFormData({...eventFormData, description: e.target.value})}
                      rows="3"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    ></textarea>
                  </div>
                  <div>
                    <label htmlFor="event-date" className="block text-sm font-medium text-gray-700">Date & Time</label>
                    <input
                      type="datetime-local"
                      id="event-date"
                      name="date"
                      value={eventFormData.date}
                      onChange={(e) => setEventFormData({...eventFormData, date: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="event-location" className="block text-sm font-medium text-gray-700">Location</label>
                    <input
                      type="text"
                      id="event-location"
                      name="location"
                      value={eventFormData.location}
                      onChange={(e) => setEventFormData({...eventFormData, location: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="event-capacity" className="block text-sm font-medium text-gray-700">Capacity</label>
                    <input
                      type="number"
                      id="event-capacity"
                      name="capacity"
                      value={eventFormData.capacity}
                      onChange={(e) => setEventFormData({...eventFormData, capacity: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                      min="1"
                    />
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : eventAction === 'create' ? 'Create Event' : 'Update Event'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEventModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    )}

{activeTab === 'payments' && (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <div className="px-4 py-5 sm:px-6 bg-gray-50">
      <h3 className="text-lg font-medium leading-6 text-gray-900">My Payment History</h3>
      <p className="mt-1 text-sm text-gray-500">
        Your contribution records and history
      </p>
    </div>
    
    <div className="p-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800">Total Contributions</h4>
          <p className="mt-1 text-2xl font-bold text-blue-900">
            ${paymentStats.totalContributions.toLocaleString()}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-green-800">Payments Count</h4>
          <p className="mt-1 text-2xl font-bold text-green-900">
            {payments.length}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-purple-800">Last Payment</h4>
          <p className="mt-1 text-2xl font-bold text-purple-900">
            {payments.length > 0 ? 
              parseAndFormatMonth(payments[0].month) : 
              'N/A'}
          </p>
        </div>
      </div>
      
      {/* Monthly Breakdown */}
      <h4 className="text-lg font-medium mb-4">Monthly Breakdown</h4>
      {Object.keys(paymentStats.monthlyBreakdown).length > 0 ? (
        <div className="bg-gray-50 rounded-lg p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(paymentStats.monthlyBreakdown)
              .map(([month, amount]) => (
                <div key={month} className="bg-white p-4 rounded shadow">
                  <h5 className="font-medium text-gray-700">
                    {parseAndFormatMonth(month)}
                  </h5>
                  <p className="text-green-600 font-bold mt-1">
                    ${amount.toLocaleString()}
                  </p>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-500 py-4">No payment records available</p>
      )}
      
      {/* Detailed Payments Table */}
      <h4 className="text-lg font-medium mb-4">Payment Details</h4>
      {payments.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recorded By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Recorded</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map(payment => (
                <tr key={payment._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {parseAndFormatMonth(payment.month)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-green-600 font-medium">
                    ${payment.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payment.recordedBy?.name || 'System'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatSafeDate(payment.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
          <p className="mt-1 text-sm text-gray-500">Your payment records will appear here once available.</p>
        </div>
      )}
    </div>
  </div>
)}


        
        {/* User Details Modal */}
        {isModalOpen && selectedUserId && (
          <UserDetailsModal 
            userId={selectedUserId} 
            isOpen={isModalOpen} 
            onClose={closeModal} 
          />
        )}
      </main>
    </div>
  );
};

export default LeaderDashboard;