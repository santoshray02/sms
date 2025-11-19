import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await apiClient.getCollectionSummary();
        setSummary(data);
      } catch (error) {
        console.error('Failed to fetch summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                School Management System
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.full_name} ({user?.role})
              </span>
              <button
                onClick={() => apiClient.logout()}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Fee Collection Dashboard
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Fees
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                      ₹{summary?.total_fees?.toLocaleString() || 0}
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Collected
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-green-600">
                      ₹{summary?.total_collected?.toLocaleString() || 0}
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-red-600">
                      ₹{summary?.total_pending?.toLocaleString() || 0}
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Collection %
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-primary-600">
                      {summary?.collection_percentage?.toFixed(1) || 0}%
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <dt className="text-sm font-medium text-gray-500">Total Students</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {summary?.total_students || 0}
                </dd>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <dt className="text-sm font-medium text-gray-500">Paid</dt>
                <dd className="mt-1 text-2xl font-semibold text-green-600">
                  {summary?.paid_count || 0}
                </dd>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <dt className="text-sm font-medium text-gray-500">Pending</dt>
                <dd className="mt-1 text-2xl font-semibold text-red-600">
                  {summary?.pending_count || 0}
                </dd>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-1">
                  <p className="text-sm text-blue-700">
                    <strong>Quick Links:</strong> Use the menu to navigate to Students,
                    Fee Management, Payments, or Reports sections.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
