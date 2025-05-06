import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import API from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { getFullImagePath } from '../../utils/imageUtils';

// StatCard Component
const StatCard = ({ title, value, bgColor }) => (
  <div className={`${bgColor} rounded-xl shadow-lg overflow-hidden transform transition hover:scale-105`}>
    <div className="px-6 py-5">
      <h3 className="text-2xl font-bold text-white">{value}</h3>
      <p className="text-sm text-white opacity-90">{title}</p>
    </div>
  </div>
);

// ProfilePictureUpload Component
const ProfilePictureUpload = ({ profile, onUpdate }) => {
  const [previewImage, setPreviewImage] = useState(getFullImagePath(profile?.profilePicture) || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { user } = useSelector(state => state.auth);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!fileInputRef.current.files[0]) return;
    
    const file = fileInputRef.current.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('File is too large. Please select an image less than 5MB.');
      return;
    }
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      console.log('Uploading file:', file.name, 'Size:', (file.size / 1024).toFixed(2), 'KB');
      
      const response = await API.patch('/api/users/me/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
  
      if (response.data.success) {
        console.log('Upload successful:', response.data);
        onUpdate(response.data.data);
        setPreviewImage(getFullImagePath(response.data.data.profilePicture));
      }
    } catch (error) {
      console.error('Upload error:', error.response?.data || error.message);
      if (error.response?.data?.error === 'File too large') {
        alert('The image file is too large. Please select an image less than 5MB.');
      } else {
        alert('Failed to upload image: ' + (error.response?.data?.message || 'Unknown error'));
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <img
          src={previewImage || '/default-profile.png'}
          alt="Profile Preview"
          className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
        />
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
          </div>
        )}
      </div>
      
      <div className="flex flex-col space-y-3 w-full">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          className="hidden"
          id="profilePictureInput"
        />
        <label
          htmlFor="profilePictureInput"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-center cursor-pointer hover:bg-gray-200 transition duration-200"
        >
          Choose Image
        </label>
        <button
          onClick={handleUpload}
          disabled={!previewImage || previewImage === getFullImagePath(profile?.profilePicture) || uploading}
          className={`px-4 py-2 rounded-lg text-white font-medium ${
            (!previewImage || previewImage === getFullImagePath(profile?.profilePicture) || uploading)
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
          } transition duration-200`}
        >
          {uploading ? 'Uploading...' : 'Save Picture'}
        </button>
      </div>
    </div>
  );
};

// ProfileForm Component
const ProfileForm = ({ profile, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await API.patch('/api/users/me', formData);
      onUpdate(response.data.data);
    } catch (error) {
      console.error('Update error:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3"
          disabled
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Phone</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3"
        />
        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

// EventCard Component
const EventCard = ({ event, onRegister, userId }) => {
  const isUserRegistered = event.registeredMembers?.some(
    m => m.memberId && m.memberId.toString() === userId.toString()
  );

  const userRegistration = event.registeredMembers?.find(
    m => m.memberId && m.memberId.toString() === userId.toString()
  );

  const getRegistrationStatusText = () => {
    if (!isUserRegistered) return "Register";
    if (userRegistration.status === "Confirmed") return "Confirmed";
    if (userRegistration.status === "Waitlisted") return "Waitlisted";
    return "Registered";
  };

  return (
    <div className="border border-gray-200 rounded-xl shadow-sm p-6 bg-white hover:shadow-md transition duration-200">
      <div className="flex flex-col space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
          <p className="text-sm text-gray-500">
            {new Date(event.date).toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          <p className="text-sm text-gray-600">{event.location}</p>
          <p className="mt-2 text-gray-700">{event.description}</p>
        </div>
        <div className="flex items-center justify-between">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            event.registeredMembers?.filter(m => m.status === 'Confirmed').length >= event.capacity
              ? 'bg-red-100 text-red-800'
              : 'bg-green-100 text-green-800'
          }`}>
            {event.registeredMembers?.filter(m => m.status === 'Confirmed').length || 0}/{event.capacity} spots
          </span>
          <button
            onClick={() => onRegister(event._id)}
            className={`px-4 py-2 rounded-lg font-medium text-white transition duration-200 ${
              isUserRegistered 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            } ${isUserRegistered ? 'cursor-not-allowed' : ''}`}
            disabled={isUserRegistered}
          >
            {getRegistrationStatusText()}
          </button>
        </div>
      </div>
    </div>
  );
};

// MemberDashboard Component
const MemberDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentStats, setPaymentStats] = useState({
    totalContributions: 0,
    monthlyBreakdown: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await API.get('/api/auth/me');
        setProfile(response.data.data);
      } catch (error) {
        setError('Failed to load profile');
        console.error(error);
      }
    };

    const fetchEvents = async () => {
      try {
        const response = await API.get('/api/events', {
          params: { region: user?.region, campus: user?.campus },
        });
        console.log('Fetched events response:', response.data); // Debug log
        if (response.data.success && Array.isArray(response.data.data)) {
          const fetchedEvents = response.data.data;
          console.log('Events after fetch:', fetchedEvents); // Debug log
          // Log upcoming events
          const upcomingEvents = fetchedEvents.filter(event => new Date(event.date) > new Date());
          console.log('Upcoming events:', upcomingEvents); // Debug log
          setEvents(fetchedEvents);
        } else {
          throw new Error('Invalid events data format');
        }
      } catch (error) {
        console.error('Fetch events error:', error);
        setError('Failed to load events');
        setEvents([]); // Ensure events is an array on error
      }
    };

    const fetchPayments = async () => {
      try {
        const response = await API.get('/api/payments/me');
        setPayments(response.data.data || []);
        const total = response.data.totalContributions || 0;
        const breakdown = response.data.monthlyBreakdown || {};
        setPaymentStats({
          totalContributions: total,
          monthlyBreakdown: breakdown
        });
      } catch (error) {
        console.error('Error fetching payments:', error);
      }
    };

    if (user) {
      Promise.all([fetchProfile(), fetchEvents(), fetchPayments()])
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleRegisterForEvent = async (eventId) => {
    try {
      setLoading(true);
      const response = await API.post(`/api/events/${eventId}/register`);
      console.log('Register event response:', response.data); // Debug log
      setSuccessMessage('Successfully registered for event!');
      const eventsResponse = await API.get('/api/events', {
        params: { region: user?.region, campus: user?.campus },
      });
      if (eventsResponse.data.success && Array.isArray(eventsResponse.data.data)) {
        setEvents(eventsResponse.data.data);
      } else {
        setEvents([]);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to register for event');
      console.error('Register event error:', error);
    } finally {
      setLoading(false);
    }
  };
  const parseAndFormatMonth = (monthStr) => {
    if (typeof monthStr === 'string' && /^\d{4}-\d{1,2}$/.test(monthStr)) {
      const [year, month] = monthStr.split('-');
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
      const monthIndex = parseInt(month, 10) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        return `${monthNames[monthIndex]} ${year}`;
      }
    }
    try {
      const date = new Date(monthStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
      }
    } catch (e) {
      console.error('Date parsing error:', e);
    }
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

  const handleProfileUpdate = (updatedProfile) => {
    setProfile(updatedProfile);
    setSuccessMessage('Profile updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-indigo-600 to-indigo-800 shadow-lg fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h2 className="text-2xl font-bold text-white">Trailblazer</h2>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                className={`text-sm font-medium ${
                  activeTab === 'dashboard' ? 'text-white border-b-2 border-white' : 'text-indigo-100 hover:text-white'
                } py-4 transition duration-200`}
                onClick={() => setActiveTab('dashboard')}
              >
                Dashboard
              </button>
              <button
                className={`text-sm font-medium ${
                  activeTab === 'events' ? 'text-white border-b-2 border-white' : 'text-indigo-100 hover:text-white'
                } py-4 transition duration-200`}
                onClick={() => setActiveTab('events')}
              >
                Events
              </button>
              <button
                className={`text-sm font-medium ${
                  activeTab === 'payments' ? 'text-white border-b-2 border-white' : 'text-indigo-100 hover:text-white'
                } py-4 transition duration-200`}
                onClick={() => setActiveTab('payments')}
              >
                My Payments
              </button>
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 text-white hover:text-indigo-100 focus:outline-none"
              >
                <img
                  src={getFullImagePath(profile?.profilePicture)}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover border-2 border-white"
                  onError={(e) => { e.target.src = '/default-profile.png'; }}
                />
                <span className="text-sm font-medium hidden md:inline">{user?.name}</span>
                <svg className="w-4 h-4 md:ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                  <button
                    onClick={() => { setActiveTab('dashboard'); setIsDropdownOpen(false); }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => { handleLogout(); setIsDropdownOpen(false); }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-white hover:text-indigo-100 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-indigo-700">
            <div className="px-4 pt-2 pb-3 space-y-1">
              <button
                className={`block w-full text-left px-3 py-2 text-sm font-medium ${
                  activeTab === 'dashboard' ? 'text-white bg-indigo-800' : 'text-indigo-100 hover:text-white hover:bg-indigo-600'
                } rounded-lg`}
                onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
              >
                Dashboard
              </button>
              <button
                className={`block w-full text-left px-3 py-2 text-sm font-medium ${
                  activeTab === 'events' ? 'text-white bg-indigo-800' : 'text-indigo-100 hover:text-white hover:bg-indigo-600'
                } rounded-lg`}
                onClick={() => { setActiveTab('events'); setIsMobileMenuOpen(false); }}
              >
                Events
              </button>
              <button
                className={`block w-full text-left px-3 py-2 text-sm font-medium ${
                  activeTab === 'payments' ? 'text-white bg-indigo-800' : 'text-indigo-100 hover:text-white hover:bg-indigo-600'
                } rounded-lg`}
                onClick={() => { setActiveTab('payments'); setIsMobileMenuOpen(false); }}
              >
                My Payments
              </button>
              <button
                className="block w-full text-left px-3 py-2 text-sm font-medium text-red-200 hover:text-white hover:bg-red-600 rounded-lg"
                onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="pt-16"> {/* Padding to account for fixed navbar */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6" role="alert">
              <span>{error}</span>
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg mb-6" role="alert">
              <span>{successMessage}</span>
            </div>
          )}
          
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && profile && (
            <div className="space-y-8">
              {/* Profile Section */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">My Profile</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Profile Picture and Upload */}
                  <div className="flex flex-col items-center space-y-4">
                    {/* <img
                      src={getFullImagePath(profile?.profilePicture)}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                      onError={(e) => {
                        console.error('Image failed to load:', getFullImagePath(profile?.profilePicture));
                        e.target.src = '/default-profile.png';
                      }}
                    /> */}
                    <ProfilePictureUpload profile={profile} onUpdate={handleProfileUpdate} />
                  </div>
                  {/* Profile Details */}
                  <div className="lg:col-span-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-600">Name</h4>
                        <p className="mt-1 text-gray-900">{profile.name}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-600">Email</h4>
                        <p className="mt-1 text-gray-900">{profile.email}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-600">Member Code</h4>
                        <p className="mt-1 text-gray-900">{profile.memberCode || 'Not assigned'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-600">Registration Status</h4>
                        <p className="mt-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            profile.registrationStatus === 'Completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {profile.registrationStatus}
                          </span>
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-600">Region</h4>
                        <p className="mt-1 text-gray-900">{profile.region}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-600">Campus</h4>
                        <p className="mt-1 text-gray-900">{profile.campus}</p>
                      </div>
                    </div>
                    <div className="mt-6">
                      <ProfileForm profile={profile} onUpdate={handleProfileUpdate} />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard 
                  title="Total Contributions" 
                  value={`N${paymentStats.totalContributions.toLocaleString()}`} 
                  bgColor="bg-indigo-600" 
                />
                <StatCard 
                  title="Upcoming Events" 
                  value={events.filter(e => new Date(e.date) > new Date()).length} 
                  bgColor="bg-green-600" 
                />
                <StatCard 
                  title="Registered Events" 
                  value={events.filter(e => 
                    e.registeredMembers?.some(m => m.member && user && m.member.toString() === user._id)
                  ).length} 
                  bgColor="bg-blue-600" 
                />
              </div>
            </div>
          )}
          
          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="space-y-8">
              {/* Upcoming Events */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Events</h3>
                <p className="text-sm text-gray-500 mb-6">Events happening in your region and campus</p>
                <div className="space-y-4">
                  {events.length > 0 ? (
                    events
                      .filter(event => new Date(event.date) > new Date())
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map(event => (
                        <EventCard 
                          key={event._id} 
                          event={event} 
                          onRegister={handleRegisterForEvent}
                          userId={user?._id}
                        />
                      ))
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming events</h3>
                      <p className="mt-1 text-sm text-gray-500">Check back later for new events in your area.</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Past Events */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Past Events</h3>
                <div className="space-y-4">
                  {events.length > 0 ? (
                    events
                      .filter(event => new Date(event.date) <= new Date())
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map(event => (
                        <div key={event._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition duration-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">{event.name}</h4>
                              <p className="text-sm text-gray-500 mt-1">
                                {new Date(event.date).toLocaleDateString()} at {event.location}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              event.registeredMembers?.some(m => m.member && user && m.member.toString() === user._id)
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {event.registeredMembers?.some(m => m.member && user && m.member.toString() === user._id)
                                ? 'Attended'
                                : 'Not Attended'}
                            </span>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No past events found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )};
          {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">My Payment History</h3>
                <p className="text-sm text-gray-500 mb-6">Your contribution records and history</p>
                
                {/* Summary Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-indigo-800">Total Contributions</h4>
                    <p className="mt-1 text-2xl font-bold text-indigo-900">
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
                      {payments.length > 0 ? parseAndFormatMonth(payments[0].month) : 'N/A'}
                    </p>
                  </div>
                </div>
                
                {/* Monthly Breakdown */}
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Monthly Breakdown</h4>
                {Object.keys(paymentStats.monthlyBreakdown).length > 0 ? (
                  <div className="bg-gray-50 rounded-lg p-4 mb-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(paymentStats.monthlyBreakdown)
                        .map(([month, amount]) => (
                          <div key={month} className="bg-white p-4 rounded-lg shadow-sm">
                            <h5 className="text-sm font-medium text-gray-700">
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
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h4>
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
                          <tr key={payment._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {parseAndFormatMonth(payment.month)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                              ${payment.amount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
          </main>
        </div>
      </div>
    );
};

export default MemberDashboard;