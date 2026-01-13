import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import API from '../utils/api';

const InterestForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    location: '',
    church: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();

  const validateForm = () => {
    const errors = {};

    if (!formData.name || formData.name.length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }

    if (!formData.phone || formData.phone.length < 10) {
      errors.phone = 'Valid phone number is required.';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format.';
    }

    if (formData.age && (isNaN(formData.age) || formData.age < 1 || formData.age > 120)) {
      errors.age = 'Age must be between 1 and 120.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await API.post('/api/interest', formData);

      if (response.data.success) {
        setSuccess(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          age: '',
          location: '',
          church: '',
          reason: '',
        });
        
        // Redirect to home after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit interest form. Please try again.');
      console.error('Interest form error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <BackButton />
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6">
            <div className="bg-indigo-600 px-6 py-8 text-center">
              <h2 className="text-3xl font-bold text-white">Join Trailblazers Nation</h2>
              <p className="mt-2 text-indigo-100">
                This is the first step to show your interest in joining our community
              </p>
            </div>

            {error && (
              <div className="mx-6 mt-6 p-4 bg-red-100 text-red-800 rounded">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mx-6 mt-6 p-4 bg-green-100 text-green-800 rounded">
                <p className="font-semibold">Thank you for your interest!</p>
                <p className="mt-1">We will review your submission and get back to you soon.</p>
                <p className="mt-2 text-sm">Redirecting to home page...</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="px-6 py-8 space-y-6">
              {/* Name - Required */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="name">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Your full name"
                  required
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>

              {/* Phone - Required */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="phone">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    formErrors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+1 (555) 000-0000"
                  required
                />
                {formErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                )}
              </div>

              {/* Email - Optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
                  Email Address <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    formErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="your@email.com"
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>

              {/* Age - Optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="age">
                  Age <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <input
                  type="number"
                  name="age"
                  id="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    formErrors.age ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Your age"
                  min="1"
                  max="120"
                />
                {formErrors.age && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.age}</p>
                )}
              </div>

              {/* Location - Optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="location">
                  Location <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="location"
                  id="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="City, State/Province"
                />
              </div>

              {/* Church - Optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="church">
                  Church Name <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="church"
                  id="church"
                  value={formData.church}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Your church"
                />
              </div>

              {/* Reason - Optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="reason">
                  Why do you want to join Trailblazers Nation? <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <textarea
                  name="reason"
                  id="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Tell us why you're interested..."
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || success}
                  className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                    loading || success
                      ? 'bg-indigo-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {loading ? 'Submitting...' : success ? 'Submitted!' : 'Submit Interest Form'}
                </button>
              </div>

              <p className="text-sm text-gray-600 text-center">
                Note: This is not an account registration. An admin will review your submission and contact you.
              </p>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default InterestForm;
