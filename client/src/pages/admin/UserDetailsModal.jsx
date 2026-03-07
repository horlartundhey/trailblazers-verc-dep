import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, X, ZoomIn } from 'lucide-react';
import API from '../../utils/api';
import AdminUserActions from '../../components/AdminUserActions';

const UserDetailsModal = ({ userId, isOpen, onClose, token, onUserUpdate }) => {  const [user, setUser] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [paymentTab, setPaymentTab] = useState('record'); // 'record' or 'history'
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    currency: 'NGN',
    date: new Date().toISOString().split('T')[0],
    description: '',
    paymentMethod: '',
    proofOfPayment: null
  });
  const [formError, setFormError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails();
    }
  }, [isOpen, userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const userResponse = await API.get(`/api/users/${userId}`);
      const paymentsResponse = await API.get(`/api/payments/user/${userId}`);
      
      setUser(userResponse.data.data);
      setPayments(paymentsResponse.data.data);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentFormChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'proofOfPayment' && files && files[0]) {
      setPaymentFormData(prev => ({
        ...prev,
        proofOfPayment: files[0]
      }));
    } else {
      setPaymentFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    setFormError('');
    setSubmitSuccess(false);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setFormError('');
    setSubmitSuccess(false);
    
    // Comprehensive validation
    if (!paymentFormData.amount || !paymentFormData.date) {
      setFormError('Please fill in the amount and date');
      return;
    }

    if (!paymentFormData.paymentMethod || paymentFormData.paymentMethod.trim() === '') {
      setFormError('Please select a payment method');
      return;
    }

    const amount = parseFloat(paymentFormData.amount);
    if (isNaN(amount) || amount <= 0) {
      setFormError('Please enter a valid amount greater than 0');
      return;
    }

    // Validate date is not in future
    const selectedDate = new Date(paymentFormData.date);
    const today = new Date();
    if (selectedDate > today) {
      setFormError('Payment date cannot be in the future');
      return;
    }
    
    try {
      // Use FormData for file upload
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('amount', amount);
      formData.append('currency', paymentFormData.currency || 'NGN');
      formData.append('date', new Date(paymentFormData.date).toISOString());
      formData.append('paymentMethod', paymentFormData.paymentMethod.toLowerCase().trim());
      formData.append('description', paymentFormData.description?.trim() || '');
      
      // Append file if present
      if (paymentFormData.proofOfPayment) {
        formData.append('proofOfPayment', paymentFormData.proofOfPayment);
      }

      const response = await API.post('/api/payments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setSubmitSuccess(true);
        setFormError(''); // Ensure error is cleared
        
        // Reset form with default values
        setPaymentFormData({
          amount: '',
          currency: 'NGN',
          date: new Date().toISOString().split('T')[0],
          description: '',
          paymentMethod: '',
          proofOfPayment: null
        });
        
        // Refresh payments data
        await fetchUserDetails();
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      setSubmitSuccess(false); // Clear any success message
      
      // Extract specific error message from response
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.[0]?.msg || 
                          'Failed to record payment. Please try again.';
      setFormError(errorMessage);
    }
  };

  const formatAmount = (amount, currency) => {
    return currency === 'USD' 
      ? `$${amount.toFixed(2)}` 
      : `₦${amount.toLocaleString()}`;
  };

  const getFullImageUrl = (path) => {
    if (!path) return '';
    // If it's already a full URL, return as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    // Otherwise, prepend the API base URL (use same as API instance)
    const baseURL = 'https://trailblazers-verc-server.vercel.app';
    // const baseURL = 'http://localhost:5000'; // For local development
    return `${baseURL}${path.startsWith('/') ? path : '/' + path}`;
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="relative bg-white rounded-lg shadow-xl mx-auto w-full max-w-4xl">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="text-xl font-medium text-gray-900">
            {loading ? 'Loading user details...' : `${user?.name} (${user?.memberCode || 'No ID'})`}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('details')}
                className={`${
                  activeTab === 'details'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                User Details
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`${
                  activeTab === 'payments'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Payments
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'details' && user && (
              <div>
                {/* Profile Picture */}
                {user.profilePicture && (
                  <div className="flex justify-center mb-6">
                    <img
                      src={user.profilePicture}
                      alt={`${user.name}'s profile`}
                      className="h-32 w-32 rounded-full object-cover border-4 border-indigo-100"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="mt-1">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="mt-1">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="mt-1">{user.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Role</p>
                    <p className="mt-1">{user.role}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Member Code</p>
                    <p className="mt-1">{user.memberCode || 'Not assigned'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Region</p>
                    <p className="mt-1">{user.region || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Campus</p>
                    <p className="mt-1">{user.campus || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Registration Status</p>
                    <p className="mt-1">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.registrationStatus === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.registrationStatus || 'Pending'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Admin Actions Component */}
                <AdminUserActions 
                  user={user} 
                  onUpdate={() => {
                    fetchUserDetails();
                    if (onUserUpdate) onUserUpdate();
                  }}
                  onClose={onClose}
                />
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                {/* Payment Sub-Tabs */}
                <div className="border-b border-gray-200 mb-6">
                  <nav className="-mb-px flex space-x-8" aria-label="Payment Tabs">
                    <button
                      onClick={() => setPaymentTab('record')}
                      className={`${
                        paymentTab === 'record'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                    >
                      Record Payment
                    </button>
                    <button
                      onClick={() => setPaymentTab('history')}
                      className={`${
                        paymentTab === 'history'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                    >
                      Payment History
                      {payments.length > 0 && (
                        <span className="ml-2 bg-indigo-100 text-indigo-600 py-0.5 px-2 rounded-full text-xs">
                          {payments.length}
                        </span>
                      )}
                    </button>
                  </nav>
                </div>

                {/* Record Payment Tab */}
                {paymentTab === 'record' && (
                  <form onSubmit={handlePaymentSubmit} className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="text-lg font-medium mb-4">Record New Payment</h4>
                    
                    {formError && (
                      <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                        {formError}
                      </div>
                    )}
                    
                    {submitSuccess && (
                      <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">✓ Payment recorded successfully!</span>
                          <button
                            type="button"
                            onClick={() => setSubmitSuccess(false)}
                            className="text-green-700 hover:text-green-900 text-xl leading-none"
                          >
                            ×
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPaymentTab('history')}
                          className="text-sm text-green-800 hover:text-green-900 underline"
                        >
                          View Payment History →
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount*</label>
                        <div className="flex rounded-md shadow-sm">
                          <select
                            name="currency"
                            value={paymentFormData.currency}
                            onChange={handlePaymentFormChange}
                            className="rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="NGN">₦ (NGN)</option>
                            <option value="USD">$ (USD)</option>
                          </select>
                          <input
                            type="number"
                            name="amount"
                            value={paymentFormData.amount}
                            onChange={handlePaymentFormChange}
                            placeholder="0.00"
                            className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date*</label>
                        <div className="relative rounded-md shadow-sm">
                          <input
                            type="date"
                            name="date"
                            value={paymentFormData.date}
                            onChange={handlePaymentFormChange}
                            className="block w-full rounded-md border-gray-300 pl-10 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                          />
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Payment Method*
                        </label>
                        <select
                          name="paymentMethod"
                          value={paymentFormData.paymentMethod}
                          onChange={handlePaymentFormChange}
                          className="block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300"
                          required
                        >
                          <option value="">Select a payment method</option>
                          <option value="cash">Cash</option>
                          <option value="transfer">Bank Transfer</option>
                          <option value="card">Card Payment</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          name="description"
                          value={paymentFormData.description}
                          onChange={handlePaymentFormChange}
                          rows="3"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Optional payment notes..."
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Proof of Payment</label>
                        <input
                          type="file"
                          name="proofOfPayment"
                          onChange={handlePaymentFormChange}
                          accept="image/*,.pdf"
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-medium
                            file:bg-indigo-50 file:text-indigo-700
                            hover:file:bg-indigo-100"
                        />
                        <p className="mt-1 text-sm text-gray-500">Upload receipt or proof (image or PDF, max 5MB)</p>
                      </div>

                      <div className="col-span-2">
                        <button
                          type="submit"
                          className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium"
                        >
                          Record Payment
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Payment History Tab */}
                {paymentTab === 'history' && (
                  <div>
                    {/* Balance Summary */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg mb-6">
                      <h4 className="text-sm font-medium text-gray-600 mb-2">Total Balance</h4>
                      {payments.length === 0 ? (
                        <p className="text-2xl font-bold text-gray-400">No payments yet</p>
                      ) : (
                        <div className="space-y-1">
                          {Object.entries(
                            payments.reduce((acc, payment) => {
                              const currency = payment.currency || 'NGN';
                              acc[currency] = (acc[currency] || 0) + (payment.amount || 0);
                              return acc;
                            }, {})
                          ).map(([currency, total]) => (
                            <p key={currency} className="text-3xl font-bold text-indigo-600">
                              {formatAmount(total, currency)}
                            </p>
                          ))}
                          {user?.expectedMonthlyPayment && (
                            <p className="text-sm text-gray-600 mt-2">
                              Expected Monthly: {formatAmount(user.expectedMonthlyPayment, user.currency || 'NGN')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Payment Table */}
                    <div className="overflow-x-auto">
                      {payments.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                          <p className="text-gray-500">No payment history available.</p>
                          <button
                            type="button"
                            onClick={() => setPaymentTab('record')}
                            className="mt-3 text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                          >
                            Record First Payment →
                          </button>
                        </div>
                      ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Method
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Description
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Recorded By
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Proof
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {payments.map((payment) => {
                              const amount = payment.amount || 0;
                              const currency = payment.currency || 'NGN';
                              const paymentDate = payment.date ? new Date(payment.date) : new Date();
                              const paymentMethod = payment.paymentMethod || 'N/A';
                              const description = payment.description || '-';
                              const recordedBy = payment.recordedBy?.name || 'System';
                              const proofOfPayment = payment.proofOfPayment;
                              
                              return (
                                <tr key={payment._id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                    {format(paymentDate, 'MMM dd, yyyy')}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {formatAmount(amount, currency)}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                      {paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                                    {description}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                    {recordedBy}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    {proofOfPayment ? (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          setSelectedProof(getFullImageUrl(proofOfPayment));
                                          setProofModalOpen(true);
                                        }}
                                        className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                      >
                                        <ZoomIn className="h-4 w-4" />
                                        View
                                      </button>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Proof of Payment Modal */}
      {proofModalOpen && selectedProof && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center p-4"
          onClick={() => {
            setProofModalOpen(false);
            setSelectedProof(null);
          }}
        >
          <div 
            className="relative bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Proof of Payment</h3>
              <button
                onClick={() => {
                  setProofModalOpen(false);
                  setSelectedProof(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-gray-50 min-h-[400px]">
              {selectedProof.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={selectedProof}
                  className="w-full h-[70vh] border-0"
                  title="Payment Proof PDF"
                />
              ) : (
                <img
                  src={selectedProof}
                  alt="Payment Proof"
                  className="max-w-full max-h-[70vh] h-auto object-contain rounded shadow-lg"
                  onError={(e) => {
                    console.error('Failed to load image:', selectedProof);
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
              )}
            </div>
            <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-2">
              <a
                href={selectedProof}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Open in New Tab
              </a>
              <button
                onClick={() => {
                  setProofModalOpen(false);
                  setSelectedProof(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetailsModal;
