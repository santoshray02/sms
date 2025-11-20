import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { apiClient } from '../services/api';
import ConcessionForm from '../components/ConcessionForm';
import { CONCESSION_TYPES, getConcessionTypeColor } from '../config/constants';
import { formatCurrency, formatDate } from '../config/app';

interface Concession {
  id: number;
  student_id: number;
  student_name?: string;
  concession_type: string;
  percentage: number;
  amount: number;
  reason?: string;
  approved_by?: number;
  approved_by_name?: string;
  valid_from: string;
  valid_to?: string;
  is_active: boolean;
  created_at: string;
}

export default function Concessions() {
  const [concessions, setConcessions] = useState<Concession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingConcession, setEditingConcession] = useState<Concession | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<boolean | ''>('');

  useEffect(() => {
    fetchConcessions();
  }, [typeFilter, activeFilter]);

  const fetchConcessions = async () => {
    try {
      setLoading(true);
      const params: any = { page_size: 100 };
      if (typeFilter) params.concession_type = typeFilter;
      if (activeFilter !== '') params.is_active = activeFilter;

      const data = await apiClient.getConcessions(params);
      setConcessions(data.concessions || []);
    } catch (error) {
      console.error('Failed to fetch concessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingConcession(null);
    setShowForm(true);
  };

  const handleEdit = (concession: Concession) => {
    setEditingConcession(concession);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this concession?')) return;

    try {
      await apiClient.deleteConcession(id);
      fetchConcessions();
      alert('Concession deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete concession:', error);
      alert(error.response?.data?.detail || 'Failed to delete concession');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingConcession(null);
    fetchConcessions();
  };

  const filteredConcessions = concessions.filter((concession) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      concession.student_name?.toLowerCase().includes(searchLower) ||
      concession.concession_type.toLowerCase().includes(searchLower) ||
      concession.reason?.toLowerCase().includes(searchLower) || false
    );
  });


  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Fee Concessions</h1>
            <p className="mt-1 text-sm text-gray-500">Manage scholarships and fee waivers</p>
          </div>
          <button
            onClick={handleAdd}
            className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Concession
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <input
                type="text"
                placeholder="Search by student, type, or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
              />
            </div>
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
              >
                <option value="">All Types</option>
                {CONCESSION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={activeFilter === '' ? '' : activeFilter ? 'true' : 'false'}
                onChange={(e) => setActiveFilter(e.target.value === '' ? '' : e.target.value === 'true')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Concessions List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 sm:p-12 text-center text-gray-500">Loading...</div>
          ) : filteredConcessions.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-gray-500">
              {searchTerm || typeFilter || activeFilter !== ''
                ? 'No concessions found matching your filters.'
                : 'No concessions yet. Click "Add Concession" to get started.'}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Benefit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valid Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredConcessions.map((concession) => (
                      <tr key={concession.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {concession.student_name || `Student #${concession.student_id}`}
                          </div>
                          {concession.reason && (
                            <div className="text-sm text-gray-500">{concession.reason}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getConcessionTypeColor(concession.concession_type)}`}>
                            {concession.concession_type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {concession.percentage > 0 && <div>{concession.percentage}% off</div>}
                            {concession.amount > 0 && <div>{formatCurrency(concession.amount)}/month</div>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div>From: {formatDate(concession.valid_from)}</div>
                          {concession.valid_to && <div>To: {formatDate(concession.valid_to)}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            concession.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {concession.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEdit(concession)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(concession.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden divide-y divide-gray-200">
                {filteredConcessions.map((concession) => (
                  <div key={concession.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-medium text-gray-900">
                          {concession.student_name || `Student #${concession.student_id}`}
                        </h3>
                        <span className={`inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-medium ${getConcessionTypeColor(concession.concession_type)}`}>
                          {concession.concession_type}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        concession.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {concession.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {concession.reason && (
                      <div className="text-sm text-gray-600">{concession.reason}</div>
                    )}

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-900 font-medium">
                        <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {concession.percentage > 0 && <span>{concession.percentage}% discount</span>}
                        {concession.amount > 0 && <span>{formatCurrency(concession.amount)}/month</span>}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(concession.valid_from)}
                        {concession.valid_to && ` - ${formatDate(concession.valid_to)}`}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        onClick={() => handleEdit(concession)}
                        className="flex-1 sm:flex-none px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(concession.id)}
                        className="flex-1 sm:flex-none px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Total Count */}
        {!loading && (
          <div className="text-sm text-gray-500 text-center sm:text-right px-2">
            Total: {filteredConcessions.length} concession{filteredConcessions.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Concession Form Modal */}
      {showForm && (
        <ConcessionForm
          concession={editingConcession}
          onClose={handleFormClose}
        />
      )}
    </Layout>
  );
}
