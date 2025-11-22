import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { apiClient } from '../services/api';

interface CollectionSummary {
  total_expected: number;
  total_collected: number;
  total_pending: number;
  collection_percentage: number;
}

interface Defaulter {
  student_id: number;
  student_name: string;
  admission_number: string;
  class_name: string;
  section?: string;
  total_pending: number;
  overdue_count: number;
  parent_phone: string;
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'collections' | 'defaulters' | 'classwise'>('collections');
  const [loading, setLoading] = useState(false);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | ''>('');

  // Collection Summary State
  const [collectionSummary, setCollectionSummary] = useState<CollectionSummary | null>(null);

  // Defaulters State
  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      if (activeTab === 'collections') {
        fetchCollectionSummary();
      } else if (activeTab === 'defaulters') {
        fetchDefaulters();
      }
    }
  }, [activeTab, selectedYear]);

  const fetchAcademicYears = async () => {
    try {
      const data = await apiClient.getAcademicYears();
      setAcademicYears(data);

      // Set current year as default
      if (data.length > 0) {
        const currentYear = data.find((year: any) => year.is_current);
        if (currentYear) {
          setSelectedYear(currentYear.id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch academic years:', error);
    }
  };

  const fetchCollectionSummary = async () => {
    if (!selectedYear) return;

    setLoading(true);
    try {
      const data = await apiClient.getCollectionSummary({ academic_year_id: selectedYear });
      setCollectionSummary(data);
    } catch (error) {
      console.error('Failed to fetch collection summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDefaulters = async () => {
    if (!selectedYear) return;

    setLoading(true);
    try {
      const data = await apiClient.getDefaulters({ academic_year_id: selectedYear });
      setDefaulters(data);
    } catch (error) {
      console.error('Failed to fetch defaulters:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'Rs. 0.00';
    }
    return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Generate detailed reports and analytics
          </p>
        </div>

        {/* Academic Year Filter */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Academic Year</option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name} {year.is_current ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('collections')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'collections'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Collection Summary
              </button>
              <button
                onClick={() => setActiveTab('defaulters')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'defaulters'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Defaulters
              </button>
              <button
                onClick={() => setActiveTab('classwise')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'classwise'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Class-wise Report
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {!selectedYear ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-gray-500">Please select an academic year to view reports</p>
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <div className="text-gray-600">Loading report data...</div>
              </div>
            ) : (
              <>
                {/* Collection Summary Tab */}
                {activeTab === 'collections' && collectionSummary && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-blue-700 text-sm font-medium mb-1">Total Expected</div>
                        <div className="text-2xl font-bold text-blue-900">
                          {formatCurrency(collectionSummary.total_expected)}
                        </div>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-green-700 text-sm font-medium mb-1">Total Collected</div>
                        <div className="text-2xl font-bold text-green-900">
                          {formatCurrency(collectionSummary.total_collected)}
                        </div>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="text-red-700 text-sm font-medium mb-1">Total Pending</div>
                        <div className="text-2xl font-bold text-red-900">
                          {formatCurrency(collectionSummary.total_pending)}
                        </div>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="text-purple-700 text-sm font-medium mb-1">Collection %</div>
                        <div className="text-2xl font-bold text-purple-900">
                          {(collectionSummary.collection_percentage || 0).toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Collection Progress</span>
                        <span>{(collectionSummary.collection_percentage || 0).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(collectionSummary.collection_percentage || 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Defaulters Tab */}
                {activeTab === 'defaulters' && (
                  <div>
                    {defaulters.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-4">✓</div>
                        <p className="text-gray-500">No defaulters found. All students are up to date!</p>
                      </div>
                    ) : (
                      <>
                        <div className="mb-4">
                          <div className="text-sm text-gray-600">
                            Total Defaulters: <strong>{defaulters.length}</strong>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Admission No
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Student Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Class
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  Section
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                  Pending Amount
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                  Overdue Months
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Contact
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {defaulters.map((defaulter, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {defaulter.admission_number}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {defaulter.student_name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {defaulter.class_name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    {defaulter.section ? (
                                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-800 font-semibold text-sm">
                                        {defaulter.section}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 text-sm">-</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right font-medium">
                                    {formatCurrency(defaulter.total_pending)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                    {defaulter.overdue_count}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {defaulter.parent_phone}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Class-wise Tab */}
                {activeTab === 'classwise' && (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">📊</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Class-wise Report
                    </h3>
                    <p className="text-gray-500">
                      Class-wise fee collection report will be available here
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
