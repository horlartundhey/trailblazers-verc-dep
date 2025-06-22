import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import API from '../../utils/api';
import PaymentHistory from '../PaymentHistory';

const PaymentDashboard = ({ region }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMembers: 0,
    paidThisMonth: 0,
    currencies: {}
  });

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        // Fetch payments for the leader's region
        const response = await API.get(`/api/payments/region/${region}`);
        const paymentsData = response.data.data;
        setPayments(paymentsData);

        // Calculate stats
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const paidThisMonth = new Set(
          paymentsData
            .filter(payment => {
              const paymentDate = new Date(payment.date);
              return paymentDate.getMonth() === currentMonth && 
                     paymentDate.getFullYear() === currentYear;
            })
            .map(payment => payment.userId)
        ).size;

        // Calculate totals by currency
        const currencies = paymentsData.reduce((acc, payment) => {
          if (!acc[payment.currency]) {
            acc[payment.currency] = 0;
          }
          acc[payment.currency] += payment.amount;
          return acc;
        }, {});

        setStats({
          totalMembers: response.data.totalMembers || 0,
          paidThisMonth,
          currencies
        });
      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        setLoading(false);
      }
    };

    if (region) {
      fetchPayments();
    }
  }, [region]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-indigo-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-indigo-800">Total Members</h3>
          <p className="mt-2 text-2xl font-bold text-indigo-600">{stats.totalMembers}</p>
        </div>
        
        <div className="bg-emerald-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-emerald-800">Paid This Month</h3>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{stats.paidThisMonth}</p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-800">Payment Rate</h3>
          <p className="mt-2 text-2xl font-bold text-purple-600">
            {stats.totalMembers ? 
              `${Math.round((stats.paidThisMonth / stats.totalMembers) * 100)}%` : 
              '0%'}
          </p>
        </div>
      </div>

      {/* Currency Totals */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Total Contributions by Currency</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(stats.currencies).map(([currency, amount]) => (
            <div key={currency} className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600">{currency} Total</h4>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {currency === 'NGN' ? '₦' : '$'}
                {amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Payment History</h3>
        <PaymentHistory payments={payments} />
      </div>
    </div>
  );
};

export default PaymentDashboard;
