import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { register } from '../redux/slices/authSlice';

const RegisterMember = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    region: '',
    campus: '',
  });
  const [regions, setRegions] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRegionsAndCampuses = async () => {
      try {
        const response = await API.get('/api/users/regions-and-campuses');
        setRegions(response.data.regions || []);
        setCampuses(response.data.campuses || []);
      } catch (err) {
        setError('Failed to fetch regions and campuses.');
        console.error('Fetch regions and campuses error:', err);
      }
    };
    fetchRegionsAndCampuses();
  }, []);

  const validateForm = () => {
    const errors = {};

    if (!formData.name || formData.name.length < 2 || formData.name.length > 50) {
      errors.name = 'Name must be between 2 and 50 characters.';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
      errors.name = 'Name can only contain letters and spaces.';
    }

    if (!formData.email) {
      errors.email = 'Email is required.';
    }

    if (!formData.password || formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    } else if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one number, and one special character (!@#$%^&*).';
    }

    if (!formData.region) {
      errors.region = 'Region is required.';
    } else if (!regions.includes(formData.region)) {
      errors.region = 'Invalid region selected.';
    }

    if (!formData.campus) {
      errors.campus = 'Campus is required.';
    } else if (!campuses.includes(formData.campus)) {
      errors.campus = 'Invalid campus selected.';
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
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      await dispatch(register(formData)).unwrap();
      setSuccess('Registration successful! Redirecting to login page...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(
        typeof err === 'string'
          ? err
          : err.message || 'Registration failed. Please try again.'
      );
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-8 bg-gray-50">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-gray-900">Member Registration</h2>
          <p className="mt-2 text-sm text-gray-500">Join Trailblazer as a member</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-800 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-100 text-green-800 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm">
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="name">
              Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded ${
                formErrors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Your full name"
              required
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded ${
                formErrors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="your@email.com"
              required
            />
            {formErrors.email && (
              <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded ${
                formErrors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="At least 8 characters"
              required
            />
            {formErrors.password && (
              <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="region">
              Region
            </label>
            <select
              name="region"
              id="region"
              value={formData.region}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded ${
                formErrors.region ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Select a region</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
            {formErrors.region && (
              <p className="mt-1 text-sm text-red-600">{formErrors.region}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="campus">
              Campus
            </label>
            <select
              name="campus"
              id="campus"
              value={formData.campus}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded ${
                formErrors.campus ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Select a campus</option>
              {campuses.map((campus) => (
                <option key={campus} value={campus}>
                  {campus}
                </option>
              ))}
            </select>
            {formErrors.campus && (
              <p className="mt-1 text-sm text-red-600">{formErrors.campus}</p>
            )}
          </div>

          <div className="mb-4 p-4 bg-blue-50 rounded text-sm text-blue-800">
            <p>
              By registering, you will be connected with leaders in your region and campus.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg font-medium text-white transition duration-200 ${
              loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </section>
  );
};

export default RegisterMember;