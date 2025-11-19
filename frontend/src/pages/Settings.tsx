import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { apiClient } from '../services/api';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'academic' | 'classes' | 'transport'>('academic');
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [transportRoutes, setTransportRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'academic') {
      fetchAcademicYears();
    } else if (activeTab === 'classes') {
      fetchClasses();
    } else if (activeTab === 'transport') {
      fetchTransportRoutes();
    }
  }, [activeTab]);

  const fetchAcademicYears = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getAcademicYears();
      setAcademicYears(data);
    } catch (error) {
      console.error('Failed to fetch academic years:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getClasses();
      setClasses(data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransportRoutes = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getTransportRoutes();
      setTransportRoutes(data);
    } catch (error) {
      console.error('Failed to fetch transport routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${(amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage academic years, classes, and transport routes
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('academic')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'academic'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Academic Years
              </button>
              <button
                onClick={() => setActiveTab('classes')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'classes'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Classes
              </button>
              <button
                onClick={() => setActiveTab('transport')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'transport'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Transport Routes
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="text-gray-600">Loading...</div>
              </div>
            ) : (
              <>
                {/* Academic Years Tab */}
                {activeTab === 'academic' && (
                  <div>
                    {academicYears.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-4">📅</div>
                        <p className="text-gray-500">No academic years found</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Academic Year
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Start Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                End Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {academicYears.map((year) => (
                              <tr key={year.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {year.name}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(year.start_date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(year.end_date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {year.is_current ? (
                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                      Current
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                      Inactive
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Classes Tab */}
                {activeTab === 'classes' && (
                  <div>
                    {classes.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-4">🏫</div>
                        <p className="text-gray-500">No classes found</p>
                      </div>
                    ) : (
                      <>
                        <div className="mb-4">
                          <div className="text-sm text-gray-600">
                            Total Classes: <strong>{classes.length}</strong>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {classes.map((cls) => (
                            <div
                              key={cls.id}
                              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <h3 className="text-lg font-medium text-gray-900">
                                {cls.name} {cls.section}
                              </h3>
                              <div className="mt-2 text-sm text-gray-600">
                                <div>Display Order: {cls.display_order}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Transport Routes Tab */}
                {activeTab === 'transport' && (
                  <div>
                    {transportRoutes.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-4">🚌</div>
                        <p className="text-gray-500">No transport routes found</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Route Name
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                Distance (km)
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                Monthly Fee
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {transportRoutes.map((route) => (
                              <tr key={route.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {route.name}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                  {route.distance_km}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                                  {formatCurrency(route.monthly_fee)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Information</h3>
          <p className="text-sm text-blue-700">
            This page displays the current academic configuration. To add or modify these settings,
            please use the backend admin interface or API endpoints directly.
          </p>
        </div>
      </div>
    </Layout>
  );
}
