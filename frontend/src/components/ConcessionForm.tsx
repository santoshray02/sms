import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { CONCESSION_TYPES } from '../config/constants';
import { APP_CONFIG } from '../config/app';

interface Concession {
  id: number;
  student_id: number;
  concession_type: string;
  percentage: number;
  amount: number;
  reason?: string;
  approved_by?: number;
  valid_from: string;
  valid_to?: string;
  is_active: boolean;
}

interface ConcessionFormProps {
  concession: Concession | null;
  onClose: () => void;
}

export default function ConcessionForm({ concession, onClose }: ConcessionFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    student_id: concession?.student_id || '',
    concession_type: concession?.concession_type || 'Government Scholarship',
    percentage: concession?.percentage || 0,
    amount: concession?.amount ? concession.amount / 100 : 0, // Convert paise to rupees
    reason: concession?.reason || '',
    valid_from: concession?.valid_from || new Date().toISOString().split('T')[0],
    valid_to: concession?.valid_to || '',
    is_active: concession?.is_active !== undefined ? concession.is_active : true,
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await apiClient.getStudents({ page_size: 500, status: 'active' });
      setStudents(data.students || data.items || []);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Convert amount from rupees to paise
      const submitData = {
        ...formData,
        amount: Math.round(Number(formData.amount) * 100),
        percentage: Number(formData.percentage),
        student_id: Number(formData.student_id),
        approved_by: user?.id || 1,
        valid_to: formData.valid_to || null,
        reason: formData.reason || null,
      };

      if (concession) {
        await apiClient.updateConcession(concession.id, submitData);
      } else {
        await apiClient.createConcession(submitData);
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to save concession:', err);
      setError(err.response?.data?.detail || 'Failed to save concession');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const search = searchTerm.toLowerCase();
    return (
      student.admission_number.toLowerCase().includes(search) ||
      student.first_name.toLowerCase().includes(search) ||
      student.last_name.toLowerCase().includes(search)
    );
  });

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full my-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
              {concession ? 'Edit Concession' : 'Add New Concession'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 p-1"
              type="button"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-4 space-y-4 sm:space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Student Selection */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 text-sm sm:text-base">Student Information</h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Select Student <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Search by name or admission number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base mb-2"
              />
              <select
                required
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                size={5}
                disabled={!!concession}
              >
                <option value="">-- Select Student --</option>
                {filteredStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.admission_number} - {student.first_name} {student.last_name} (Class: {student.class_name || student.class_id})
                  </option>
                ))}
              </select>
              {concession && (
                <p className="mt-1 text-sm text-gray-500">Student cannot be changed when editing</p>
              )}
            </div>
          </div>

          {/* Concession Details */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 text-sm sm:text-base">Concession Details</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Concession Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.concession_type}
                  onChange={(e) => setFormData({ ...formData, concession_type: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                >
                  {CONCESSION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Percentage Discount (%)
                </label>
                <input
                  type="number"
                  value={formData.percentage}
                  onChange={(e) => setFormData({ ...formData, percentage: e.target.value as any })}
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  placeholder="0-100"
                  min="0"
                  max="100"
                />
                <p className="mt-1 text-xs text-gray-500">Percentage off total fees</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Fixed Amount ({APP_CONFIG.currency.symbol})
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value as any })}
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  placeholder="Monthly amount"
                  min="0"
                  step="0.01"
                />
                <p className="mt-1 text-xs text-gray-500">Fixed monthly discount amount</p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Reason / Notes
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  placeholder="Reason for concession (e.g., NMMSS Scholarship, Sibling in Class 6)"
                />
              </div>
            </div>
          </div>

          {/* Validity Period */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 text-sm sm:text-base">Validity Period</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Valid From <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Valid To (Optional)
                </label>
                <input
                  type="date"
                  value={formData.valid_to}
                  onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  min={formData.valid_from}
                />
                <p className="mt-1 text-xs text-gray-500">Leave blank for no expiry</p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Active (applies to fee calculations)
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : (concession ? 'Update Concession' : 'Add Concession')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
