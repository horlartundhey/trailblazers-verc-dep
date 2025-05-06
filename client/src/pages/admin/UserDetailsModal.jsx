import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import API from '../../utils/api';

const UserDetailsModal = ({ userId, isOpen, onClose, token }) => {
  const [user, setUser] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    month: format(new Date(), 'MM-yyyy'),
    paymentMethod: '',
    notes: ''
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
      // Use the API utility instead of direct axios calls
      const userResponse = await API.get(`/api/users/${userId}`);
      
      // Use the API utility for payments as well
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
    const { name, value } = e.target;
    setPaymentFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setFormError('');
    setSubmitSuccess(false);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!paymentFormData.amount || !paymentFormData.month || !paymentFormData.paymentMethod) {
      setFormError('Please fill all required fields');
      return;
    }
    
    try {
      const response = await API.post('/api/payments', {
        ...paymentFormData,
        userId: userId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSubmitSuccess(true);
        // Reset form
        setPaymentFormData({
          amount: '',
          month: format(new Date(), 'MM-yyyy'),
          paymentMethod: '',
          notes: ''
        });
        // Refresh payments data
        fetchUserDetails();
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      setFormError(error.response?.data?.message || 'Failed to record payment');
    }
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

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`${
                    activeTab === 'details'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm`}
                >
                  User Details
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`${
                    activeTab === 'payments'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm`}
                >
                  Payment History
                </button>
                <button
                  onClick={() => setActiveTab('addPayment')}
                  className={`${
                    activeTab === 'addPayment'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm`}
                >
                  Add Payment
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* User Details Tab */}
              {activeTab === 'details' && user && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-medium mb-3">Personal Information</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="font-medium">{user.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{user.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Member ID</p>
                        <p className="font-medium">{user.memberCode || 'Not assigned'}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium mb-3">Membership Information</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Role</p>
                        <p className="font-medium">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'Leader' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Region</p>
                        <p className="font-medium">{user.region || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Campus</p>
                        <p className="font-medium">{user.campus || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Registration Status</p>
                        <p className="font-medium">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.registrationStatus === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.registrationStatus || 'Pending'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment History Tab */}
              {activeTab === 'payments' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium">Payment History</h4>
                    <div className="text-sm text-gray-600">
                      Total Contributions: <span className="font-semibold">${payments.reduce((sum, payment) => sum + payment.amount, 0).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {payments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Recorded</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {payments.map((payment) => (
                            <tr key={payment._id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{payment.month}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">${payment.amount.toFixed(2)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{payment.paymentMethod}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {new Date(payment.createdAt).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-500">{payment.notes || 'N/A'}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No payment records found for this user.
                    </div>
                  )}
                </div>
              )}

              {/* Add Payment Tab */}
              {activeTab === 'addPayment' && (
                <div>
                  <h4 className="text-lg font-medium mb-4">Record New Payment</h4>
                  
                  {submitSuccess && (
                    <div className="mb-4 bg-green-50 p-4 rounded-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">Payment recorded successfully!</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {formError && (
                    <div className="mb-4 bg-red-50 p-4 rounded-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-red-800">{formError}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount ($) *</label>
                      <input
                        type="number"
                        name="amount"
                        value={paymentFormData.amount}
                        onChange={handlePaymentFormChange}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Month (MM-YYYY) *</label>
                      <input
                        type="text"
                        name="month"
                        value={paymentFormData.month}
                        onChange={handlePaymentFormChange}
                        placeholder="MM-YYYY"
                        pattern="\d{2}-\d{4}"
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Method *</label>
                      <select
                        name="paymentMethod"
                        value={paymentFormData.paymentMethod}
                        onChange={handlePaymentFormChange}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      >
                        <option value="">Select payment method</option>
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Mobile Money">Mobile Money</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea
                        name="notes"
                        value={paymentFormData.notes}
                        onChange={handlePaymentFormChange}
                        rows="3"
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      ></textarea>
                    </div>
                    
                    <div className="pt-4">
                      <button
                        type="submit"
                        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Record Payment
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserDetailsModal;