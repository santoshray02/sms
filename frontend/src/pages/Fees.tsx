import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { apiClient } from '../services/api';
import FeeStructureForm from '../components/FeeStructureForm';

interface FeeStructure {
  id: number;
  class_id: number;
  class_name?: string;
  academic_year_id: number;
  academic_year_name?: string;
  tuition_fee: number;
  hostel_fee: number;
  created_at: string;
}

export default function Fees() {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);
  const [academicYearFilter, setAcademicYearFilter] = useState<number | ''>('');
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load academic years and classes first (in parallel)
        const [yearsData, classesData] = await Promise.all([
          apiClient.getAcademicYears(),
          apiClient.getClasses()
        ]);

        setAcademicYears(yearsData);
        setClasses(classesData);

        // Set current academic year as default filter
        if (!academicYearFilter && yearsData.length > 0) {
          const currentYear = yearsData.find((year: any) => year.is_current);
          if (currentYear) {
            setAcademicYearFilter(currentYear.id);
            return; // Will trigger another useEffect with the filter
          }
        }

        // Load fee structures with the loaded data
        const params: any = {};
        if (academicYearFilter) params.academic_year_id = academicYearFilter;
        const feesData = await apiClient.getFeeStructures(params);

        // Enrich with class and academic year names using the fresh data
        const enrichedData = feesData.map((fee: FeeStructure) => {
          const classInfo = classesData.find(c => c.id === fee.class_id);
          const yearInfo = yearsData.find(y => y.id === fee.academic_year_id);
          return {
            ...fee,
            class_name: classInfo ? `${classInfo.name} ${classInfo.section}` : `Class ${fee.class_id}`,
            academic_year_name: yearInfo ? yearInfo.name : `Year ${fee.academic_year_id}`,
          };
        });

        setFeeStructures(enrichedData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [academicYearFilter]);

  const fetchAcademicYears = async () => {
    try {
      const data = await apiClient.getAcademicYears();
      setAcademicYears(data);
    } catch (error) {
      console.error('Failed to fetch academic years:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const data = await apiClient.getClasses();
      setClasses(data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const fetchFeeStructures = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (academicYearFilter) params.academic_year_id = academicYearFilter;

      const data = await apiClient.getFeeStructures(params);

      // Enrich with class and academic year names
      const enrichedData = data.map((fee: FeeStructure) => {
        const classInfo = classes.find(c => c.id === fee.class_id);
        const yearInfo = academicYears.find(y => y.id === fee.academic_year_id);
        return {
          ...fee,
          class_name: classInfo ? `${classInfo.name} ${classInfo.section}` : `Class ${fee.class_id}`,
          academic_year_name: yearInfo ? yearInfo.name : `Year ${fee.academic_year_id}`,
        };
      });

      setFeeStructures(enrichedData);
    } catch (error) {
      console.error('Failed to fetch fee structures:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingFee(null);
    setShowForm(true);
  };

  const handleEdit = (fee: FeeStructure) => {
    setEditingFee(fee);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingFee(null);
    fetchFeeStructures();
  };

  const formatCurrency = (amount: number) => {
    // Backend already returns amount in rupees (not paise), so no conversion needed
    return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fee Structure Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Configure fee structures for each class and academic year
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowGenerateModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium"
            >
              📅 Generate Monthly Fees
            </button>
            <button
              onClick={handleAdd}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 text-sm font-medium"
            >
              + Add Fee Structure
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Academic Year
              </label>
              <select
                value={academicYearFilter}
                onChange={(e) => setAcademicYearFilter(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Academic Years</option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name} {year.is_current ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                Total Fee Structures: <strong>{feeStructures.length}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Fee Structures Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600">Loading fee structures...</div>
            </div>
          ) : feeStructures.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Fee Structures Found</h3>
              <p className="text-gray-500 mb-4">Get started by adding fee structures for your classes</p>
              <button
                onClick={handleAdd}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
              >
                + Add First Fee Structure
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Academic Year
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Tuition Fee
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Hostel Fee
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Total Monthly Fee
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {feeStructures.map((fee) => (
                    <tr key={fee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {fee.class_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {fee.academic_year_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(fee.tuition_fee)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(fee.hostel_fee)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(fee.tuition_fee + fee.hostel_fee)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(fee)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Card */}
        {feeStructures.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Fee Structure Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Classes Configured:</span>
                <span className="ml-2 font-semibold text-blue-900">
                  {new Set(feeStructures.map(f => f.class_id)).size}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Average Monthly Fee:</span>
                <span className="ml-2 font-semibold text-blue-900">
                  {formatCurrency(
                    feeStructures.reduce((sum, f) => sum + f.tuition_fee + f.hostel_fee, 0) /
                    feeStructures.length
                  )}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Total Structures:</span>
                <span className="ml-2 font-semibold text-blue-900">{feeStructures.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fee Structure Form Modal */}
      {showForm && (
        <FeeStructureForm
          feeStructure={editingFee}
          classes={classes}
          academicYears={academicYears}
          onClose={handleFormClose}
        />
      )}

      {/* Fee Generation Modal */}
      {showGenerateModal && (
        <FeeGenerationModal
          academicYears={academicYears}
          onClose={() => setShowGenerateModal(false)}
        />
      )}
    </Layout>
  );
}

// Fee Generation Modal Component
interface FeeGenerationModalProps {
  academicYears: any[];
  onClose: () => void;
}

function FeeGenerationModal({ academicYears, onClose }: FeeGenerationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const currentDate = new Date();
  const [formData, setFormData] = useState({
    academic_year_id: academicYears.find((y: any) => y.is_current)?.id || '',
    month: currentDate.getMonth() + 1, // 1-12
    year: currentDate.getFullYear(),
    due_day: 10,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await apiClient.generateMonthlyFees({
        academic_year_id: Number(formData.academic_year_id),
        month: Number(formData.month),
        year: Number(formData.year),
        due_day: Number(formData.due_day),
      });

      setSuccess(result.message || `Successfully generated ${result.total_generated} monthly fee records`);
    } catch (err: any) {
      console.error('Failed to generate monthly fees:', err);
      setError(err.response?.data?.detail || 'Failed to generate monthly fees');
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
              Generate Monthly Fees
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
        <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-medium mb-1">What does this do?</p>
            <p>
              This will generate monthly fee records for all active students in the selected academic year and month.
              Each student will get a fee record based on their class fee structure, with applicable concessions applied automatically.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.academic_year_id}
                onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })}
                className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                disabled={loading || !!success}
              >
                <option value="">-- Select Academic Year --</option>
                {academicYears.map((year: any) => (
                  <option key={year.id} value={year.id}>
                    {year.name} {year.is_current ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Month <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  disabled={loading || !!success}
                >
                  {monthNames.map((month, index) => (
                    <option key={index} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  min="2000"
                  max="2100"
                  disabled={loading || !!success}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Due Day of Month <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                value={formData.due_day}
                onChange={(e) => setFormData({ ...formData, due_day: Number(e.target.value) })}
                className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                min="1"
                max="31"
                disabled={loading || !!success}
              />
              <p className="mt-1 text-xs text-gray-500">
                Day of the month when fees are due (e.g., 10 for {formData.year}-{String(formData.month).padStart(2, '0')}-10)
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              {success ? 'Close' : 'Cancel'}
            </button>
            {!success && (
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Generating...' : 'Generate Fees'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
