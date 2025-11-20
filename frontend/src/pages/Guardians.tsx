import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { apiClient } from '../services/api';
import GuardianForm from '../components/GuardianForm';

interface Guardian {
  id: number;
  full_name: string;
  relation: string;
  phone: string;
  alternate_phone?: string;
  email?: string;
  address?: string;
  occupation?: string;
  annual_income?: number;
  education?: string;
  aadhaar_number?: string;
  is_active: boolean;
  created_at: string;
}

export default function Guardians() {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuardian, setSelectedGuardian] = useState<number | null>(null);
  const [guardianStudents, setGuardianStudents] = useState<any>(null);

  useEffect(() => {
    fetchGuardians();
  }, []);

  const fetchGuardians = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getGuardians({ page_size: 100 });
      setGuardians(data.guardians || []);
    } catch (error) {
      console.error('Failed to fetch guardians:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGuardianStudents = async (guardianId: number) => {
    try {
      const data = await apiClient.getGuardianStudents(guardianId);
      setGuardianStudents(data);
      setSelectedGuardian(guardianId);
    } catch (error) {
      console.error('Failed to fetch guardian students:', error);
    }
  };

  const handleAdd = () => {
    setEditingGuardian(null);
    setShowForm(true);
  };

  const handleEdit = (guardian: Guardian) => {
    setEditingGuardian(guardian);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this guardian? This will fail if the guardian has active students.')) return;

    try {
      await apiClient.deleteGuardian(id);
      fetchGuardians();
      alert('Guardian deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete guardian:', error);
      alert(error.response?.data?.detail || 'Failed to delete guardian');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingGuardian(null);
    fetchGuardians();
  };

  const filteredGuardians = guardians.filter((guardian) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      guardian.full_name.toLowerCase().includes(searchLower) ||
      guardian.phone.includes(searchTerm) ||
      (guardian.email?.toLowerCase().includes(searchLower) || false)
    );
  });

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Guardians</h1>
            <p className="mt-1 text-sm text-gray-500">Manage parent/guardian information</p>
          </div>
          <button
            onClick={handleAdd}
            className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Guardian
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
              />
            </div>
          </div>
        </div>

        {/* Guardians List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 sm:p-12 text-center text-gray-500">Loading...</div>
          ) : filteredGuardians.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-gray-500">
              {searchTerm ? 'No guardians found matching your search.' : 'No guardians yet. Click "Add Guardian" to get started.'}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Guardian Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Other Info
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredGuardians.map((guardian) => (
                      <tr key={guardian.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{guardian.full_name}</div>
                              <div className="text-sm text-gray-500">{guardian.relation}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{guardian.phone}</div>
                          {guardian.email && <div className="text-sm text-gray-500">{guardian.email}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{guardian.occupation || '-'}</div>
                          {guardian.annual_income && (
                            <div className="text-sm text-gray-500">₹{(guardian.annual_income / 100000).toFixed(1)}L/year</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => fetchGuardianStudents(guardian.id)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View Students
                          </button>
                          <button
                            onClick={() => handleEdit(guardian)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(guardian.id)}
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
                {filteredGuardians.map((guardian) => (
                  <div key={guardian.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                          <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-base font-medium text-gray-900">{guardian.full_name}</h3>
                          <p className="text-sm text-gray-500">{guardian.relation}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {guardian.phone}
                      </div>
                      {guardian.email && (
                        <div className="flex items-center text-gray-600">
                          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {guardian.email}
                        </div>
                      )}
                      {guardian.occupation && (
                        <div className="flex items-center text-gray-600">
                          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {guardian.occupation}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        onClick={() => fetchGuardianStudents(guardian.id)}
                        className="flex-1 sm:flex-none px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                      >
                        View Students
                      </button>
                      <button
                        onClick={() => handleEdit(guardian)}
                        className="flex-1 sm:flex-none px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(guardian.id)}
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
            Total: {filteredGuardians.length} guardian{filteredGuardians.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Guardian Form Modal */}
      {showForm && (
        <GuardianForm
          guardian={editingGuardian}
          onClose={handleFormClose}
        />
      )}

      {/* Guardian Students Modal */}
      {selectedGuardian && guardianStudents && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Students of {guardianStudents.guardian.full_name}
                </h3>
                <button
                  onClick={() => {
                    setSelectedGuardian(null);
                    setGuardianStudents(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="px-4 sm:px-6 py-4">
              {guardianStudents.students.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No students linked to this guardian yet.</p>
              ) : (
                <div className="space-y-3">
                  {guardianStudents.students.map((student: any) => (
                    <div key={student.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {student.first_name} {student.last_name}
                          </h4>
                          <p className="text-sm text-gray-500">Admission: {student.admission_number}</p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          student.status === 'active' ? 'bg-green-100 text-green-800' :
                          student.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {student.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 text-sm text-gray-500">
                Total Students: {guardianStudents.total_students}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
