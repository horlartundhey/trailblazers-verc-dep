import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, getCurrentUser, updateUser } from '../../redux/slices/authSlice';
import API from '../../utils/api';
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
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.phone || 'Not provided'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Member Code</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.memberCode || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Registration Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.registrationStatus === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.registrationStatus || 'Pending'}
                  </span>
                </dd>
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


const Dashboard = () => {
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

  // Gallery state
  const [galleries, setGalleries] = useState([]);
  const [galleryPage, setGalleryPage] = useState(1);
  const [selectedGallery, setSelectedGallery] = useState(null);
  const [galleryImageIndex, setGalleryImageIndex] = useState(0);
  const galleryItemsPerPage = 6;

  // Assigned members state
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [assignedMembersLoading, setAssignedMembersLoading] = useState(false);

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
  totalsByCurrency: {},
  totalsByMonth: {},
  totalsByMonthAndCurrency: {}
});

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [eventRegistrationStatus, setEventRegistrationStatus] = useState({});

  
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const [showProfile, setShowProfile] = useState(false);

  const fetchPayments = async () => {
    try {      const response = await API.get('/api/payments/me');
      const sortedPayments = (response.data.data || []).sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setPayments(sortedPayments);
      
      // Process payments by currency
      const totalsByCurrency = {};
      const totalsByMonth = {};
      const totalsByMonthAndCurrency = {};
      
      // Month names for consistent formatting
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      (response.data.data || []).forEach(payment => {
        const currency = payment.currency || 'USD';
        const paymentDate = new Date(payment.date);
        const month = monthNames[paymentDate.getMonth()];
        
        // Update totals by currency
        totalsByCurrency[currency] = (totalsByCurrency[currency] || 0) + payment.amount;
        
        // Update totals by month
        totalsByMonth[month] = (totalsByMonth[month] || 0) + payment.amount;
        
        // Update totals by month and currency
        if (!totalsByMonthAndCurrency[month]) {
          totalsByMonthAndCurrency[month] = {};
        }
        totalsByMonthAndCurrency[month][currency] = 
          (totalsByMonthAndCurrency[month][currency] || 0) + payment.amount;
      });
      
      setPaymentStats({
        totalsByCurrency,
        totalsByMonth,
        totalsByMonthAndCurrency
      });
      
      // Update dashboard stats
      const totalPayments = Object.values(totalsByCurrency).reduce((sum, val) => sum + val, 0);
      setStats(prev => ({
        ...prev,
        totalPayments
      }));
    } catch (error) {
      console.error('Error fetching payments:', error);
      setErrorMessage('Failed to load payment history');
    }
  };// Memoize the fetch function to prevent recreating it on every render
  const fetchDashboardData = React.useCallback(async () => {
    if (!user?.region || !user?.campus || !user?._id) return;
    
    try {
      setLoading(true);
      
      const [membersResponse, eventsResponse, paymentsResponse] = await Promise.all([
        API.get(`/api/users/region/${user.region}/campus/${user.campus}`),
        API.get('/api/events', {
          params: { region: user.region, campus: user.campus }
        }),
        API.get('/api/payments/me')
      ]);
      
      const membersData = membersResponse.data.data || [];
      const eventsData = eventsResponse.data.data || [];
      const paymentsData = paymentsResponse.data.data || [];
      
      // Process payments by currency
      const totalsByCurrency = {};
      const totalsByMonth = {};
      const totalsByMonthAndCurrency = {};
      
      // Month names for consistent formatting
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      paymentsData.forEach(payment => {
        const currency = payment.currency || 'USD';
        const paymentDate = new Date(payment.date);
        const month = monthNames[paymentDate.getMonth()];
        
        // Update totals by currency
        totalsByCurrency[currency] = (totalsByCurrency[currency] || 0) + payment.amount;
        
        // Update totals by month
        if (month) {
          totalsByMonth[month] = (totalsByMonth[month] || 0) + payment.amount;
        }
        
        // Update totals by month and currency
        if (month) {
          if (!totalsByMonthAndCurrency[month]) {
            totalsByMonthAndCurrency[month] = {};
          }
          totalsByMonthAndCurrency[month][currency] = 
            (totalsByMonthAndCurrency[month][currency] || 0) + payment.amount;
        }
      });
      
      // Update all state in one batch
      setUsers(membersData);
      setEvents(eventsData);
      setPayments(paymentsData);
      setPaymentStats({
        totalsByCurrency,
        totalsByMonth,
        totalsByMonthAndCurrency
      });
      
      // Calculate total payments from all currencies
      const totalPayments = Object.values(totalsByCurrency).reduce((sum, val) => sum + val, 0);
      
      setStats({
        totalMembers: membersData.length,
        pendingMembers: membersData.filter(
          member => member.registrationStatus === 'Pending'
        ).length,
        completedMembers: membersData.filter(
          member => member.registrationStatus === 'Completed'
        ).length,
        totalEvents: eventsData.length,
        totalPayments 
      });
      
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?._id, user?.region, user?.campus]);
  
  // Effect to fetch dashboard data initially and when user data changes
  useEffect(() => {
    if (user?._id && user?.region && user?.campus) {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, user?.region, user?.campus]);

  // Fetch galleries
  useEffect(() => {
    if (user?._id) {
      API.get('/api/gallery/member/programs')
        .then(res => setGalleries(res.data.data || []))
        .catch(err => console.error('Failed to fetch galleries:', err));
    }
  }, [user?._id]);

  // Fetch assigned members when tab is active
  useEffect(() => {
    if (activeTab === 'assignedMembers' && user?._id) {
      setAssignedMembersLoading(true);
      API.get('/api/users/assigned-members')
        .then(res => setAssignedMembers(res.data.data || []))
        .catch(err => console.error('Failed to fetch assigned members:', err))
        .finally(() => setAssignedMembersLoading(false));
    }
  }, [activeTab, user?._id]);
  
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
    phone: '',
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
        phone: formData.phone,
        password: formData.password,
        region: user.region,
        campus: user.campus
      };
  
      const response = await API.post('/api/users/members', memberData);
      
      setSuccessMessage('Member created successfully!');
      setFormData({
        name: '',
        email: '',
        phone: '',
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

// Event registration handler for leaders
const handleEventRegister = async (eventId) => {
  try {
    setEventRegistrationStatus(prev => ({
      ...prev,
      [eventId]: { loading: true }
    }));

    const response = await API.post(`/api/events/${eventId}/register`);
    
    if (response.data.success) {
      setEventRegistrationStatus(prev => ({
        ...prev,
        [eventId]: { 
          success: true, 
          message: response.data.data.message || 'Successfully registered!' 
        }
      }));
      setSuccessMessage('Successfully registered for event!');
      // Refresh events to update registration status
      await fetchEvents();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setEventRegistrationStatus(prev => ({
          ...prev,
          [eventId]: null
        }));
      }, 3000);
    }
  } catch (err) {
    console.error('Registration error:', err);
    const errorMsg = err.response?.data?.message || 'Failed to register for event';
    setEventRegistrationStatus(prev => ({
      ...prev,
      [eventId]: { 
        error: true, 
        message: errorMsg
      }
    }));
    setErrorMessage(errorMsg);
    
    // Clear error message after 5 seconds
    setTimeout(() => {
      setEventRegistrationStatus(prev => ({
        ...prev,
        [eventId]: null
      }));
      setErrorMessage('');
    }, 5000);
  }
};

// Check if user is registered for an event
const isUserRegistered = (event) => {
  return event.registeredMembers?.some(
    m => m.memberId === user?._id
  );
};

// Get user's registration status for an event
const getUserRegistrationStatus = (event) => {
  const registration = event.registeredMembers?.find(
    m => m.memberId === user?._id
  );
  return registration?.status || null;
};


  // Helper functions for date handling
const parseAndFormatMonth = (monthStr) => {
  if (!monthStr) return 'No date provided';

  // First try to parse as YYYY-MM format
  if (typeof monthStr === 'string' && /^\d{4}-\d{1,2}$/.test(monthStr)) {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { 
      month: 'long',
      year: 'numeric'
    });
  }
  
  // Then try to parse as a full date string
  try {
    const date = new Date(monthStr);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', { 
        month: 'long',
        year: 'numeric'
      });
    }
  } catch (e) {
    console.error('Date parsing error:', e);
  }
  
  // If parsing fails, try to extract year and month from string format
  const dateMatch = monthStr.match(/(\d{4})[/-](\d{1,2})/);
  if (dateMatch) {
    const [, year, month] = dateMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', { 
        month: 'long',
        year: 'numeric'
      });
    }
  }
  
  return 'Invalid date format';
};

const formatSafeDate = (dateStr) => {
  if (!dateStr) return 'No date provided';
  
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return 'Invalid date format';
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date format';
  }
};

const formatPaymentMonth = (monthStr) => {
  if (!monthStr) return 'No date provided';

  try {
    // Extract year and month from payment month string (expected format: YYYY-MM)
    const match = monthStr.match(/^(\d{4})-(\d{2})$/);
    if (match) {
      const [, year, month] = match;
      const date = new Date(year, parseInt(month) - 1);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });
    }

    // If not in YYYY-MM format, try parsing as regular date
    const date = new Date(monthStr);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });
    }

    return monthStr; // Return original if parsing fails
  } catch (error) {
    console.error('Month formatting error:', error);
    return monthStr;
  }
};

const formatCurrencyAmount = (amount, currency) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  } catch (e) {
    // Fallback if the currency code is not supported
    return `${currency} ${amount.toLocaleString()}`;
  }
};// Effect to refresh user data when profile modal is closed  // ProfileManagement refresh has been moved to the onClose handler in the JSX

  return (    <div className="min-h-screen bg-gray-100">      {/* Profile Management Modal */}
      {showProfile && (
        <ProfileManagement 
          isOpen={showProfile}
          onClose={() => {
            setShowProfile(false);
            // Wait for modal animation to complete before refreshing
            setTimeout(() => {
              dispatch(getCurrentUser());
            }, 300);
          }}
        />
      )}{/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 w-full sm:w-auto">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Leader Dashboard</h1>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-indigo-100 text-indigo-800">
                  {user?.region}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800">
                  {user?.campus}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-6 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="flex flex-col items-end">
                  <span className="text-xs sm:text-sm font-medium text-gray-900">{user?.name}</span>
                  <span className="text-xs text-gray-500">{user?.position || 'Leader'}</span>
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setShowProfile(true)}
                    className="flex items-center justify-center"
                  >
                    {user?.profilePicture && getProfileImageUrl(user.profilePicture) ? (
                      <>
                        <img
                          src={getProfileImageUrl(user.profilePicture)}
                          alt="Profile"
                          className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover border-2 border-indigo-500"
                          onError={(e) => {
                            console.error('Failed to load profile image:', getProfileImageUrl(user.profilePicture));
                            console.log('User object:', user);
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            // Show fallback
                            const fallback = e.target.nextElementSibling;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-indigo-100 items-center justify-center border-2 border-indigo-500" style={{ display: 'none' }}>
                          <span className="text-base sm:text-lg font-medium text-indigo-600">
                            {user?.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-indigo-500">
                        <span className="text-base sm:text-lg font-medium text-indigo-600">
                          {user?.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-green-400 border-2 border-white"></div>
                  </button>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
        {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 sm:gap-4 -mb-px">
            <button
              className={`px-4 sm:px-6 py-3 sm:py-4 inline-flex items-center whitespace-nowrap text-sm sm:text-base font-medium ${
                activeTab === 'dashboard'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
              } transition-colors duration-200 ease-in-out focus:outline-none`}
              onClick={() => setActiveTab('dashboard')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </button>
            <button
              className={`px-4 sm:px-6 py-3 sm:py-4 inline-flex items-center whitespace-nowrap text-sm sm:text-base font-medium ${
                activeTab === 'members'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
              } transition-colors duration-200 ease-in-out focus:outline-none`}
              onClick={() => setActiveTab('members')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Members
            </button>
            <button
              className={`px-4 sm:px-6 py-3 sm:py-4 inline-flex items-center whitespace-nowrap text-sm sm:text-base font-medium ${
                activeTab === 'events'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
              } transition-colors duration-200 ease-in-out focus:outline-none`}
              onClick={() => setActiveTab('events')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Events
            </button>
            <button
              className={`px-4 sm:px-6 py-3 sm:py-4 inline-flex items-center whitespace-nowrap text-sm sm:text-base font-medium ${
                activeTab === 'payments'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
              } transition-colors duration-200 ease-in-out focus:outline-none`}
              onClick={() => setActiveTab('payments')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Partnership
            </button>
            <button
              className={`px-4 sm:px-6 py-3 sm:py-4 inline-flex items-center whitespace-nowrap text-sm sm:text-base font-medium ${
                activeTab === 'gallery'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
              } transition-colors duration-200 ease-in-out focus:outline-none`}
              onClick={() => setActiveTab('gallery')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Gallery
            </button>
            <button
              className={`px-4 sm:px-6 py-3 sm:py-4 inline-flex items-center whitespace-nowrap text-sm sm:text-base font-medium ${
                activeTab === 'assignedMembers'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
              } transition-colors duration-200 ease-in-out focus:outline-none`}
              onClick={() => setActiveTab('assignedMembers')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Assigned Members
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
              <StatCard title="Pending Registration" value={stats.pendingMembers} bgColor="bg-yellow-500" />
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
                    title="Manage Profile" 
                    description="Update your position, trainings, and profile picture" 
                    onClick={() => setShowProfile(true)} 
                  />                  <ActionButton 
                    title="Pending Registration" 
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
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Member Management</h3>
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
                        <tr 
                          key={member._id}
                          onClick={() => viewUserDetails(member._id)}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{member.name}</div>
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
                              onClick={(e) => {
                                e.stopPropagation();
                                viewUserDetails(member._id);
                              }}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
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
        
        {/* Events Tab */}
        
    {activeTab === 'events' && (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Campus Events</h3>
          <div className="flex space-x-3">
            {/* <button
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
            </button> */}
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
                        src={event.image.startsWith('http://') || event.image.startsWith('https://') ? event.image : `${import.meta.env.VITE_API_URL}${event.image}`} 
                        alt={event.name}
                        className="h-full object-contain"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
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
                      <div className="flex flex-col items-end ml-4">
                        <div className="flex flex-col space-y-2 mb-2">
                          <span className={`px-2 py-1 text-xs rounded-full text-center ${
                            event.registeredMembers?.filter(m => m.status === 'Confirmed').length >= event.capacity 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {event.registeredMembers?.filter(m => m.status === 'Confirmed').length || 0}/{event.capacity} attendees
                          </span>
                          {event.registeredMembers?.filter(m => m.status === 'Waitlisted').length > 0 && (
                            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full text-center">
                              {event.registeredMembers.filter(m => m.status === 'Waitlisted').length} waitlisted
                            </span>
                          )}
                          
                          {/* Registration Status or Button */}
                          {isUserRegistered(event) ? (
                            <span className={`px-3 py-1 text-xs font-medium rounded-full text-center ${
                              getUserRegistrationStatus(event) === 'Confirmed' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {getUserRegistrationStatus(event) === 'Confirmed' ? '✓ Registered' : 'Waitlisted'}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleEventRegister(event._id)}
                              disabled={eventRegistrationStatus[event._id]?.loading}
                              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                eventRegistrationStatus[event._id]?.loading
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
                              }`}
                            >
                              {eventRegistrationStatus[event._id]?.loading ? 'Registering...' : 'Register'}
                            </button>
                          )}
                          
                          {/* Registration Status Messages */}
                          {eventRegistrationStatus[event._id]?.success && (
                            <span className="text-xs text-green-600 mt-1">
                              {eventRegistrationStatus[event._id].message}
                            </span>
                          )}
                          {eventRegistrationStatus[event._id]?.error && (
                            <span className="text-xs text-red-600 mt-1">
                              {eventRegistrationStatus[event._id].message}
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
        View your payments and contributions by currency
      </p>
    </div>
    
    {loading ? (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    ) : (
      <div className="p-6">
        {/* Summary Stats by Currency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {/* Currency-based totals */}
          {Object.entries(paymentStats.totalsByCurrency || {}).map(([currency, total]) => (
            <div key={currency} className="bg-blue-50 p-4 rounded-lg hover:shadow-md transition-shadow duration-200" title={`Total payments in ${currency}`}>
              <h4 className="text-sm font-medium text-blue-800">Total in {currency}</h4>              <p className="mt-1 text-2xl font-bold text-blue-900">
                {formatCurrencyAmount(total, currency)}
              </p>
            </div>
          ))}
          {/* Payment count */}
          <div className="bg-green-50 p-4 rounded-lg hover:shadow-md transition-shadow duration-200" title="Total number of payments made">
            <h4 className="text-sm font-medium text-green-800">Payments Count</h4>
            <p className="mt-1 text-2xl font-bold text-green-900">
              {payments.length}
            </p>
          </div>          {/* Last payment */}
          <div className="bg-purple-50 p-4 rounded-lg hover:shadow-md transition-shadow duration-200" title="Most recent payment details">
            <h4 className="text-sm font-medium text-purple-800">Last Payment</h4>
            {payments.length > 0 ? (
              <>
                <p className="mt-1 text-2xl font-bold text-purple-900">
                  {formatCurrencyAmount(payments[0].amount, payments[0].currency)}
                </p>
                <p className="mt-1 text-sm text-purple-700">
                  {formatSafeDate(payments[0].createdAt)}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  via {payments[0].paymentMethod || 'N/A'}
                </p>
              </>
            ) : (
              <p className="mt-1 text-xl text-purple-900">No payments yet</p>
            )}
          </div>
        </div>
        
        {/* Monthly Breakdown */}
        <h4 className="text-lg font-medium mb-4">Monthly Breakdown</h4>
        {Object.keys(paymentStats.totalsByMonthAndCurrency || {}).length > 0 ? (
          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(paymentStats.totalsByMonthAndCurrency)
                .sort((a, b) => new Date(b[0]) - new Date(a[0]))
                .map(([month, currencyTotals]) => (
                  <div key={month} className="bg-white p-4 rounded shadow hover:shadow-md transition-shadow duration-200">
                    <h5 className="font-medium text-gray-700 mb-2">
                      {parseAndFormatMonth(month)}
                    </h5>
                    {Object.entries(currencyTotals).map(([currency, amount]) => (                      <p key={currency} className="text-green-600 font-bold">
                        {formatCurrencyAmount(amount, currency)}
                      </p>
                    ))}
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
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Description</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Recorded By</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">              {payments.map(payment => (
                <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {payment.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.paymentMethod || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell" title={payment.description || 'No description'}>
                      {payment.description || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                      {payment.recordedBy?.name || 'System'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
    )}
  </div>
)}

    {/* Gallery Tab */}
    {activeTab === 'gallery' && (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Gallery</h3>
        <p className="text-sm text-gray-500 mb-6">Browse photos from our programs and events</p>

        {selectedGallery ? (
          <div>
            <button
              onClick={() => { setSelectedGallery(null); setGalleryImageIndex(0); }}
              className="mb-4 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
            >
              ← Back to Albums
            </button>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">{selectedGallery.programTitle}</h4>
            <div className="mb-4 flex flex-wrap gap-4 text-sm text-gray-500">
              {selectedGallery.programDate && (
                <span>{new Date(selectedGallery.programDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              )}
              {!selectedGallery.isPublic && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">Private</span>
              )}
            </div>

            {selectedGallery.images?.length > 0 && (
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <div className="relative" style={{height: 'clamp(280px, 55vh, 600px)'}}>
                  <img
                    src={selectedGallery.images[galleryImageIndex]?.src}
                    alt={selectedGallery.images[galleryImageIndex]?.caption || `Photo ${galleryImageIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                  {selectedGallery.images[galleryImageIndex]?.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-sm p-3">
                      {selectedGallery.images[galleryImageIndex].caption}
                    </div>
                  )}
                  {selectedGallery.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setGalleryImageIndex(i => i === 0 ? selectedGallery.images.length - 1 : i - 1)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg text-xl font-bold"
                      >&#8249;</button>
                      <button
                        onClick={() => setGalleryImageIndex(i => i === selectedGallery.images.length - 1 ? 0 : i + 1)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg text-xl font-bold"
                      >&#8250;</button>
                    </>
                  )}
                  <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    {galleryImageIndex + 1} / {selectedGallery.images.length}
                  </div>
                </div>
                {selectedGallery.images.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto bg-gray-200">
                    {selectedGallery.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setGalleryImageIndex(idx)}
                        className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${idx === galleryImageIndex ? 'border-indigo-600 shadow' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={img.src} alt={`thumb ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            {galleries.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No gallery albums available yet.</div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {galleries
                    .slice((galleryPage - 1) * galleryItemsPerPage, galleryPage * galleryItemsPerPage)
                    .map((gallery) => (
                      <div
                        key={gallery._id}
                        onClick={() => { setSelectedGallery(gallery); setGalleryImageIndex(0); }}
                        className="group cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="relative aspect-video bg-gray-100 overflow-hidden">
                          {gallery.thumbnailImage ? (
                            <img
                              src={gallery.thumbnailImage}
                              alt={gallery.programTitle}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          {!gallery.isPublic && (
                            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-white">Private</span>
                          )}
                        </div>
                        <div className="px-3 py-2 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{gallery.programTitle}</p>
                            <p className="text-xs text-gray-500">
                              {gallery.programDate ? new Date(gallery.programDate).toLocaleDateString() : '—'}
                              {' · '}{gallery.images?.length || 0} photo{gallery.images?.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))}
                </div>
                {galleries.length > galleryItemsPerPage && (
                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Page {galleryPage} of {Math.ceil(galleries.length / galleryItemsPerPage)}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setGalleryPage(p => Math.max(1, p - 1))}
                        disabled={galleryPage === 1}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
                      >Previous</button>
                      <button
                        onClick={() => setGalleryPage(p => Math.min(Math.ceil(galleries.length / galleryItemsPerPage), p + 1))}
                        disabled={galleryPage >= Math.ceil(galleries.length / galleryItemsPerPage)}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
                      >Next</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    )}


    {/* Assigned Members Tab */}
    {activeTab === 'assignedMembers' && (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Assigned Members</h3>
        <p className="text-sm text-gray-500 mb-6">Members that have been assigned to you by the admin</p>

        {assignedMembersLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : assignedMembers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            No members have been assigned to you yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Campus</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignedMembers.map(member => (
                  <tr key={member._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                      {member.memberCode && <div className="text-xs text-gray-500">ID: {member.memberCode}</div>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{member.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">{member.phone || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{member.campus || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        member.registrationStatus === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {member.registrationStatus || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

        {/* Profile Management Modal */}
        <ProfileManagement 
          isOpen={showProfile}
          onClose={() => setShowProfile(false)}
        />
      </main>
    </div>
  );
};

export default Dashboard;