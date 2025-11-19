import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import Layout from '../components/Layout';

interface DashboardSummary {
  total_students?: number;
  active_students?: number;
  pending_fees?: number;
  collected_today?: number;
  total_fees?: number;
  total_collected?: number;
  total_pending?: number;
  collection_percentage?: number;
  paid_count?: number;
  pending_count?: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary>({
    total_students: 0,
    total_fees: 0,
    total_collected: 0,
    total_pending: 0,
    collection_percentage: 0,
    paid_count: 0,
    pending_count: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        // Try to fetch real data from API
        const data = await apiClient.getCollectionSummary();
        setSummary(data);
      } catch (error) {
        console.error('Failed to fetch summary:', error);
        // Keep using mock data
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const stats = [
    {
      name: 'Total Fees',
      value: `₹${summary.total_fees?.toLocaleString() || 0}`,
      color: 'text-gray-900',
      bgColor: 'bg-white',
    },
    {
      name: 'Collected',
      value: `₹${summary.total_collected?.toLocaleString() || 0}`,
      color: 'text-green-600',
      bgColor: 'bg-white',
    },
    {
      name: 'Pending',
      value: `₹${summary.total_pending?.toLocaleString() || 0}`,
      color: 'text-red-600',
      bgColor: 'bg-white',
    },
    {
      name: 'Collection %',
      value: `${summary.collection_percentage?.toFixed(1) || 0}%`,
      color: 'text-primary-600',
      bgColor: 'bg-white',
    },
  ];

  const studentStats = [
    {
      name: 'Total Students',
      value: summary.total_students || 0,
      color: 'text-gray-900',
    },
    {
      name: 'Paid',
      value: summary.paid_count || 0,
      color: 'text-green-600',
    },
    {
      name: 'Pending',
      value: summary.pending_count || 0,
      color: 'text-red-600',
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-lg text-gray-600">Loading dashboard...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here's what's happening with your school today.
          </p>
        </div>

        {/* Fee Collection Stats */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Fee Collection Overview
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.name}
                className={`${stat.bgColor} overflow-hidden shadow rounded-lg`}
              >
                <div className="p-5">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className={`mt-1 text-3xl font-semibold ${stat.color}`}>
                    {stat.value}
                  </dd>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Student Stats */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Student Statistics
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {studentStats.map((stat) => (
              <div
                key={stat.name}
                className="bg-white overflow-hidden shadow rounded-lg"
              >
                <div className="p-5">
                  <dt className="text-sm font-medium text-gray-500">
                    {stat.name}
                  </dt>
                  <dd className={`mt-1 text-2xl font-semibold ${stat.color}`}>
                    {stat.value}
                  </dd>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button className="bg-white p-6 shadow rounded-lg hover:shadow-md transition-shadow text-left">
              <div className="text-3xl mb-2">👨‍🎓</div>
              <h3 className="font-medium text-gray-900">Add Student</h3>
              <p className="text-sm text-gray-500 mt-1">
                Register a new student
              </p>
            </button>
            <button className="bg-white p-6 shadow rounded-lg hover:shadow-md transition-shadow text-left">
              <div className="text-3xl mb-2">💰</div>
              <h3 className="font-medium text-gray-900">Collect Fee</h3>
              <p className="text-sm text-gray-500 mt-1">
                Record fee payment
              </p>
            </button>
            <button className="bg-white p-6 shadow rounded-lg hover:shadow-md transition-shadow text-left">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-medium text-gray-900">View Reports</h3>
              <p className="text-sm text-gray-500 mt-1">
                Generate fee reports
              </p>
            </button>
            <button className="bg-white p-6 shadow rounded-lg hover:shadow-md transition-shadow text-left">
              <div className="text-3xl mb-2">📧</div>
              <h3 className="font-medium text-gray-900">Send Reminders</h3>
              <p className="text-sm text-gray-500 mt-1">
                SMS fee reminders
              </p>
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <div className="flex">
            <div className="flex-1">
              <p className="text-sm text-blue-700">
                <strong>Getting Started:</strong> Use the navigation menu above to
                manage students, fees, payments, and generate reports.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
