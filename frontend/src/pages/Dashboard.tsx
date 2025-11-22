import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import Layout from '../components/Layout';
import { StudentsIcon, PaymentsIcon, ConcessionsIcon, ReportsIcon } from '../components/Icons';
import { COLORS, ELEVATION, BORDER_RADIUS, TRANSITIONS } from '../config/design-system';

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
  total_guardians?: number;
  active_concessions?: number;
  students_with_sections?: number;
  section_coverage_percentage?: number;
  unique_sections?: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary>({
    total_students: 0,
    total_fees: 0,
    total_collected: 0,
    total_pending: 0,
    collection_percentage: 0,
    paid_count: 0,
    pending_count: 0,
    total_guardians: 0,
    active_concessions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        // Fetch fee collection summary
        const collectionData = await apiClient.getCollectionSummary();

        // Fetch guardian count
        const guardianData = await apiClient.getGuardians({ page_size: 1, is_active: true });
        const guardianCount = guardianData.total || guardianData.guardians?.length || 0;

        // Fetch active concessions count
        const concessionData = await apiClient.getActiveConcessions({ page_size: 1 });
        const concessionCount = concessionData.total || concessionData.concessions?.length || 0;

        // Fetch batch management stats (uses SQL aggregation for performance)
        const batchStats = await apiClient.getBatchStatistics();

        setSummary({
          ...collectionData,
          total_guardians: guardianCount,
          active_concessions: concessionCount,
          students_with_sections: batchStats.students_with_sections,
          section_coverage_percentage: batchStats.section_coverage_percentage,
          unique_sections: batchStats.unique_sections,
        });
      } catch (error) {
        console.error('Failed to fetch summary:', error);
        // Keep using default data
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '₹0';
    }
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const stats = [
    {
      name: 'Total Fees',
      value: formatCurrency(summary.total_fees),
      color: 'text-gray-900',
      bgColor: 'bg-white',
    },
    {
      name: 'Collected',
      value: formatCurrency(summary.total_collected),
      color: 'text-green-600',
      bgColor: 'bg-white',
    },
    {
      name: 'Pending',
      value: formatCurrency(summary.total_pending),
      color: 'text-red-600',
      bgColor: 'bg-white',
    },
    {
      name: 'Collection %',
      value: `${(summary.collection_percentage || 0).toFixed(1)}%`,
      color: 'text-primary-600',
      bgColor: 'bg-white',
    },
  ];

  const studentStats = [
    {
      name: 'Total Students',
      value: summary.total_students || 0,
      color: COLORS.gray[900],
      icon: <StudentsIcon size={24} color={COLORS.gray[600]} />,
    },
    {
      name: 'Paid',
      value: summary.paid_count || 0,
      color: COLORS.success[600],
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.success[600]} strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    {
      name: 'Pending',
      value: summary.pending_count || 0,
      color: COLORS.danger[600],
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.danger[600]} strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
  ];

  const additionalStats = [
    {
      name: 'Total Guardians',
      value: summary.total_guardians || 0,
      color: COLORS.primary[600],
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary[600]} strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      description: 'Registered families',
    },
    {
      name: 'Active Concessions',
      value: summary.active_concessions || 0,
      color: '#9333EA',
      icon: <ConcessionsIcon size={32} color="#9333EA" />,
      description: 'Scholarships & waivers',
    },
    {
      name: 'Section Assignment',
      value: `${(summary.section_coverage_percentage || 0).toFixed(0)}%`,
      color: COLORS.info[600],
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={COLORS.info[600]} strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
      description: `${summary.students_with_sections || 0} students in ${summary.unique_sections || 0} sections`,
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

        {/* Additional Stats */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Additional Information
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {additionalStats.map((stat) => (
              <div
                key={stat.name}
                className="bg-white overflow-hidden shadow rounded-lg"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="text-3xl mr-3">{stat.icon}</div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        {stat.name}
                      </dt>
                      <dd className={`mt-1 text-2xl font-semibold ${stat.color}`}>
                        {stat.value}
                      </dd>
                      <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                    </div>
                  </div>
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
            <button
              onClick={() => navigate('/students')}
              className="bg-white p-6 rounded-lg hover:shadow-lg transition-all text-left"
              style={{
                boxShadow: ELEVATION.base,
                borderRadius: BORDER_RADIUS.lg,
                transition: `all ${TRANSITIONS.base}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = ELEVATION.lg;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = ELEVATION.base;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div className="mb-3">
                <StudentsIcon size={32} color={COLORS.primary[500]} />
              </div>
              <h3 className="font-medium text-gray-900">Manage Students</h3>
              <p className="text-sm text-gray-500 mt-1">
                View and register students
              </p>
            </button>
            <button
              onClick={() => navigate('/payments')}
              className="bg-white p-6 rounded-lg hover:shadow-lg transition-all text-left"
              style={{
                boxShadow: ELEVATION.base,
                borderRadius: BORDER_RADIUS.lg,
                transition: `all ${TRANSITIONS.base}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = ELEVATION.lg;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = ELEVATION.base;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div className="mb-3">
                <PaymentsIcon size={32} color={COLORS.success[500]} />
              </div>
              <h3 className="font-medium text-gray-900">Collect Fee</h3>
              <p className="text-sm text-gray-500 mt-1">
                Record fee payment
              </p>
            </button>
            <button
              onClick={() => navigate('/concessions')}
              className="bg-white p-6 rounded-lg hover:shadow-lg transition-all text-left"
              style={{
                boxShadow: ELEVATION.base,
                borderRadius: BORDER_RADIUS.lg,
                transition: `all ${TRANSITIONS.base}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = ELEVATION.lg;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = ELEVATION.base;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div className="mb-3">
                <ConcessionsIcon size={32} color="#9333EA" />
              </div>
              <h3 className="font-medium text-gray-900">Concessions</h3>
              <p className="text-sm text-gray-500 mt-1">
                Manage scholarships
              </p>
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="bg-white p-6 rounded-lg hover:shadow-lg transition-all text-left"
              style={{
                boxShadow: ELEVATION.base,
                borderRadius: BORDER_RADIUS.lg,
                transition: `all ${TRANSITIONS.base}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = ELEVATION.lg;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = ELEVATION.base;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div className="mb-3">
                <ReportsIcon size={32} color={COLORS.info[500]} />
              </div>
              <h3 className="font-medium text-gray-900">View Reports</h3>
              <p className="text-sm text-gray-500 mt-1">
                Generate fee reports
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
