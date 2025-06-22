import React from 'react';
import { format } from 'date-fns';

const currencySymbols = {
  NGN: '₦',
  USD: '$'
};

const formatAmount = (amount, currency) => {
  return `${currencySymbols[currency] || ''}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const PaymentHistory = ({ payments }) => {
  // Group payments by month for the breakdown
  const paymentsByMonth = payments.reduce((acc, payment) => {
    const monthYear = format(new Date(payment.date), 'MMMM yyyy');
    if (!acc[monthYear]) {
      acc[monthYear] = {
        total: 0,
        payments: [],
        currencies: {}
      };
    }
    acc[monthYear].payments.push(payment);
    acc[monthYear].currencies[payment.currency] = (acc[monthYear].currencies[payment.currency] || 0) + payment.amount;
    return acc;
  }, {});

  // Calculate totals by currency
  const totalsByCurrency = payments.reduce((acc, payment) => {
    acc[payment.currency] = (acc[payment.currency] || 0) + payment.amount;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Contributions */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800">Total Contributions</h3>
          <div className="mt-2 space-y-1">
            {Object.entries(totalsByCurrency).map(([currency, amount]) => (
              <div key={currency} className="text-2xl font-bold text-blue-600">
                {formatAmount(amount, currency)}
              </div>
            ))}
          </div>
        </div>

        {/* Payments Count */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-800">Payments Count</h3>
          <div className="text-2xl font-bold text-green-600">{payments.length}</div>
        </div>

        {/* Last Payment */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-800">Last Payment</h3>
          <div className="text-2xl font-bold text-purple-600">
            {payments.length > 0
              ? format(new Date(payments[0].date), 'dd/MM/yyyy')
              : 'No payments'}
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Monthly Breakdown</h3>
        <div className="space-y-4">
          {Object.entries(paymentsByMonth).map(([month, data]) => (
            <div key={month} className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900">{month}</h4>
              <div className="mt-2 space-y-1">
                {Object.entries(data.currencies).map(([currency, amount]) => (
                  <div key={currency} className="text-green-600">
                    {formatAmount(amount, currency)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Details Table */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recorded By</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(payment.date), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatAmount(payment.amount, payment.currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {payment.paymentMethod}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {payment.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.recordedBy?.name || 'Admin User'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
