import { useState } from 'react';
import { apiClient } from '../services/api';

interface FeeStructure {
  id: number;
  class_id: number;
  academic_year_id: number;
  tuition_fee: number;
  hostel_fee: number;
}

interface FeeStructureFormProps {
  feeStructure: FeeStructure | null;
  classes: any[];
  academicYears: any[];
  onClose: () => void;
}

export default function FeeStructureForm({
  feeStructure,
  classes,
  academicYears,
  onClose
}: FeeStructureFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    class_id: feeStructure?.class_id || '',
    academic_year_id: feeStructure?.academic_year_id || '',
    tuition_fee: feeStructure ? (feeStructure.tuition_fee / 100).toString() : '',
    hostel_fee: feeStructure ? (feeStructure.hostel_fee / 100).toString() : '0',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const submitData = {
        class_id: Number(formData.class_id),
        academic_year_id: Number(formData.academic_year_id),
        tuition_fee: parseFloat(formData.tuition_fee),
        hostel_fee: parseFloat(formData.hostel_fee),
      };

      if (feeStructure) {
        // For update, we only send tuition and hostel fees
        const updateData = {
          tuition_fee: submitData.tuition_fee,
          hostel_fee: submitData.hostel_fee,
        };
        await apiClient.updateFeeStructure(feeStructure.id, updateData);
      } else {
        await apiClient.createFeeStructure(submitData);
      }

      onClose();
    } catch (err: any) {
      console.error('Failed to save fee structure:', err);
      setError(
        err.response?.data?.detail ||
        'Failed to save fee structure. Please check all fields.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getTotalFee = () => {
    const tuition = parseFloat(formData.tuition_fee) || 0;
    const hostel = parseFloat(formData.hostel_fee) || 0;
    return (tuition + hostel).toFixed(2);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {feeStructure ? 'Edit Fee Structure' : 'Add New Fee Structure'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Class Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                name="class_id"
                value={formData.class_id}
                onChange={handleChange}
                required
                disabled={!!feeStructure}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.section}
                  </option>
                ))}
              </select>
              {feeStructure && (
                <p className="mt-1 text-xs text-gray-500">
                  Class cannot be changed for existing fee structure
                </p>
              )}
            </div>

            {/* Academic Year Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <select
                name="academic_year_id"
                value={formData.academic_year_id}
                onChange={handleChange}
                required
                disabled={!!feeStructure}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
              >
                <option value="">Select Academic Year</option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name} {year.is_current ? '(Current)' : ''}
                  </option>
                ))}
              </select>
              {feeStructure && (
                <p className="mt-1 text-xs text-gray-500">
                  Academic year cannot be changed for existing fee structure
                </p>
              )}
            </div>

            {/* Tuition Fee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tuition Fee (Rs. per month) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="tuition_fee"
                value={formData.tuition_fee}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="Enter amount in rupees"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter monthly tuition fee amount
              </p>
            </div>

            {/* Hostel Fee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hostel Fee (Rs. per month)
              </label>
              <input
                type="number"
                name="hostel_fee"
                value={formData.hostel_fee}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="Enter amount in rupees (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter hostel fee if applicable (leave 0 if not)
              </p>
            </div>

            {/* Total Fee Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-900">
                  Total Monthly Fee:
                </span>
                <span className="text-lg font-bold text-blue-900">
                  Rs. {getTotalFee()}
                </span>
              </div>
              <p className="mt-1 text-xs text-blue-700">
                This is the total monthly fee that will be charged to students in this class
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400"
            >
              {loading ? 'Saving...' : feeStructure ? 'Update Fee Structure' : 'Add Fee Structure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
