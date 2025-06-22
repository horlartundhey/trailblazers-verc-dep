import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

const PaymentForm = ({ onSubmit, initialData = {} }) => {
  const [paymentData, setPaymentData] = useState({
    amount: initialData.amount || '',
    currency: initialData.currency || 'NGN',
    date: initialData.date || new Date().toISOString().split('T')[0],
    description: initialData.description || '',
    paymentMethod: initialData.paymentMethod || 'transfer',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(paymentData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Amount</label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <select
            name="currency"
            value={paymentData.currency}
            onChange={handleChange}
            className="rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="NGN">₦ (NGN)</option>
            <option value="USD">$ (USD)</option>
          </select>
          <input
            type="number"
            name="amount"
            value={paymentData.amount}
            onChange={handleChange}
            placeholder="0.00"
            className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
            required
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Payment Method</label>
        <div className="mt-1">
          <select
            name="paymentMethod"
            value={paymentData.paymentMethod}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
            required
          >
            <option value="transfer">Bank Transfer</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Payment Date</label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <input
            type="date"
            name="date"
            value={paymentData.date}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-300 pl-10 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <div className="mt-1">
          <textarea
            name="description"
            value={paymentData.description}
            onChange={handleChange}
            rows="3"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Payment description..."
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Submit Payment
      </button>
    </form>
  );
};

export default PaymentForm;
