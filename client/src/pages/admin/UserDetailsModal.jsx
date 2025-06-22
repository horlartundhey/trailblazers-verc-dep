import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import API from '../../utils/api';

const UserDetailsModal = ({ userId, isOpen, onClose, token }) => {  const [user, setUser] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    currency: 'NGN',
    date: new Date().toISOString().split('T')[0],
    description: '',
    paymentMethod: ''
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
    if (!paymentFormData.amount || !paymentFormData.date) {
      setFormError('Please fill in the amount and date');
      return;
    }

    if (!paymentFormData.paymentMethod) {
      setFormError('Please select a payment method');
      return;
    }

    if (isNaN(parseFloat(paymentFormData.amount)) || parseFloat(paymentFormData.amount) <= 0) {
      setFormError('Please enter a valid amount');
      return;
    }
    
    try {
      const paymentData = {
        userId,
        amount: parseFloat(paymentFormData.amount),
        currency: paymentFormData.currency || 'NGN',
        date: new Date(paymentFormData.date).toISOString(),
        paymentMethod: paymentFormData.paymentMethod.toLowerCase(),
        description: paymentFormData.description || ''
      };

      const response = await API.post('/api/payments', paymentData);
      if (response.data.success) {
        setSubmitSuccess(true);
        // Reset form with default values
        setPaymentFormData({
          amount: '',
          currency: 'NGN',
          date: new Date().toISOString().split('T')[0],
          description: '',
          paymentMethod: ''
        });
        setFormError('');
        // Refresh payments data
        fetchUserDetails();
        // Reset to first page when new payment is added
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      setFormError(error.response?.data?.message || 'Failed to record payment');
    }
  };

  const formatAmount = (amount, currency) => {
    return currency === 'USD' 
      ? `$${amount.toFixed(2)}` 
      : `₦${amount.toLocaleString()}`;
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
                  <p className="text-sm font-medium text-gray-500">Role</p>
                  <p className="mt-1">{user.role}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Member Code</p>
                  <p className="mt-1">{user.memberCode || 'Not assigned'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Region</p>
                  <p className="mt-1">{user.region}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Campus</p>
                  <p className="mt-1">{user.campus}</p>
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                {/* Payment Form */}
                <form onSubmit={handlePaymentSubmit} className="mb-8 bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium mb-4">Record New Payment</h4>
                  
                  {formError && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                      {formError}
                    </div>
                  )}
                  
                  {submitSuccess && (
                    <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
                      Payment recorded successfully!
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
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
                      <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Payment Method<span className="text-red-500">*</span>
                      </label>
                      <select
                        name="paymentMethod"
                        value={paymentFormData.paymentMethod}
                        onChange={handlePaymentFormChange}
                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                          !paymentFormData.paymentMethod ? 'border-red-300' : 'border-gray-300'
                        }`}
                        required
                      >
                        <option value="">Select a payment method</option>
                        <option value="cash">Cash</option>
                        <option value="transfer">Bank Transfer</option>
                        <option value="card">Card Payment</option>
                      </select>
                      {!paymentFormData.paymentMethod && (
                        <p className="mt-1 text-sm text-red-600">Payment method is required</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        name="description"
                        value={paymentFormData.description}
                        onChange={handlePaymentFormChange}
                        rows="3"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Optional payment notes..."
                      />
                    </div>

                    <div>
                      <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Record Payment
                      </button>
                    </div>
                  </div>
                </form>                {/* Payment History */}
                <div>
                  <h4 className="text-lg font-medium mb-4">Payment History</h4>
                  <div className="bg-white max-h-[240px] overflow-y-auto pr-2">
                    {payments.length === 0 ? (
                      <p className="py-4 text-center text-gray-500">No payments recorded yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {payments.map((payment) => (
                          <div key={payment._id} className="border-b border-gray-100 pb-2 last:border-b-0">
                            <p className="font-medium">
                              {formatAmount(payment.amount, payment.currency)}
                            </p>
                            <div className="flex justify-between items-center text-sm text-gray-500 mt-0.5">
                              <span>{format(new Date(payment.date), 'MMM dd, yyyy')}</span>
                              <span>Method: {payment.paymentMethod?.charAt(0).toUpperCase() + payment.paymentMethod?.slice(1)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
