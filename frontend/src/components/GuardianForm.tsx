import { useState } from 'react';
import { apiClient } from '../services/api';

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
}

interface GuardianFormProps {
  guardian: Guardian | null;
  onClose: () => void;
}

export default function GuardianForm({ guardian, onClose }: GuardianFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: guardian?.full_name || '',
    relation: guardian?.relation || 'Father',
    phone: guardian?.phone || '',
    alternate_phone: guardian?.alternate_phone || '',
    email: guardian?.email || '',
    address: guardian?.address || '',
    occupation: guardian?.occupation || '',
    annual_income: guardian?.annual_income ? guardian.annual_income / 100 : '', // Convert paise to rupees
    education: guardian?.education || '',
    aadhaar_number: guardian?.aadhaar_number || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Convert annual_income from rupees to integer (paise for consistency)
      const submitData = {
        ...formData,
        annual_income: formData.annual_income ? Number(formData.annual_income) * 100 : null,
        alternate_phone: formData.alternate_phone || null,
        email: formData.email || null,
        address: formData.address || null,
        occupation: formData.occupation || null,
        education: formData.education || null,
        aadhaar_number: formData.aadhaar_number || null,
      };

      if (guardian) {
        await apiClient.updateGuardian(guardian.id, submitData);
      } else {
        await apiClient.createGuardian(submitData);
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to save guardian:', err);
      setError(err.response?.data?.detail || 'Failed to save guardian');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full my-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
              {guardian ? 'Edit Guardian' : 'Add New Guardian'}
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

          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 text-sm sm:text-base">Basic Information</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Relation <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.relation}
                  onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Guardian">Guardian</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  placeholder="10-digit mobile number"
                  pattern="[0-9]{10,15}"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Alternate Phone
                </label>
                <input
                  type="tel"
                  value={formData.alternate_phone}
                  onChange={(e) => setFormData({ ...formData, alternate_phone: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  placeholder="Optional"
                  pattern="[0-9]{10,15}"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                placeholder="Complete address"
              />
            </div>
          </div>

          {/* Professional & Financial Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 text-sm sm:text-base">Professional & Financial Information</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Occupation
                </label>
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  placeholder="Job/Business"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Annual Income (₹)
                </label>
                <input
                  type="number"
                  value={formData.annual_income}
                  onChange={(e) => setFormData({ ...formData, annual_income: e.target.value as any })}
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  placeholder="For scholarship eligibility"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Education
                </label>
                <input
                  type="text"
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  placeholder="Highest qualification"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Aadhaar Number
                </label>
                <input
                  type="text"
                  value={formData.aadhaar_number}
                  onChange={(e) => setFormData({ ...formData, aadhaar_number: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  placeholder="12-digit Aadhaar"
                  pattern="[0-9]{12}"
                  maxLength={12}
                />
              </div>
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
              {loading ? 'Saving...' : (guardian ? 'Update Guardian' : 'Add Guardian')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
