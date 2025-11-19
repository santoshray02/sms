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
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);
  const [academicYearFilter, setAcademicYearFilter] = useState<number | ''>('');
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    fetchAcademicYears();
    fetchClasses();
    fetchFeeStructures();
  }, [academicYearFilter]);

  const fetchAcademicYears = async () => {
    try {
      const data = await apiClient.getAcademicYears();
      setAcademicYears(data);

      // Set current academic year as default filter
      if (!academicYearFilter && data.length > 0) {
        const currentYear = data.find((year: any) => year.is_current);
        if (currentYear) {
          setAcademicYearFilter(currentYear.id);
        }
      }
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
    return `Rs. ${(amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fee Structure Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Configure fee structures for each class and academic year
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            + Add Fee Structure
          </button>
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
    </Layout>
  );
}
