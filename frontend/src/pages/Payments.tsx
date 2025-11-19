import { useState } from 'react';
import Layout from '../components/Layout';
import { apiClient } from '../services/api';
import PaymentForm from '../components/PaymentForm';

interface Student {
  id: number;
  admission_number: string;
  first_name: string;
  last_name: string;
  class_id: number;
  class_name?: string;
  parent_phone: string;
}

interface MonthlyFee {
  id: number;
  student_id: number;
  month: number;
  year: number;
  total_fee: number;
  amount_paid: number;
  amount_pending: number;
  status: string;
  due_date: string;
}

export default function Payments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [monthlyFees, setMonthlyFees] = useState<MonthlyFee[]>([]);
  const [selectedFee, setSelectedFee] = useState<MonthlyFee | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingFees, setLoadingFees] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setSearching(true);
    try {
      const data = await apiClient.getStudents({ search: searchTerm });
      setStudents(data.items || data);
    } catch (error) {
      console.error('Failed to search students:', error);
      alert('Failed to search students');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectStudent = async (student: Student) => {
    setSelectedStudent(student);
    setStudents([]);
    setSearchTerm('');
    await fetchStudentFees(student.id);
  };

  const fetchStudentFees = async (studentId: number) => {
    setLoadingFees(true);
    try {
      const data = await apiClient.getMonthlyFees({ student_id: studentId });
      // Sort by year and month descending
      const sorted = data.sort((a: MonthlyFee, b: MonthlyFee) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
      setMonthlyFees(sorted);
    } catch (error) {
      console.error('Failed to fetch student fees:', error);
    } finally {
      setLoadingFees(false);
    }
  };

  const handleMakePayment = (fee: MonthlyFee) => {
    setSelectedFee(fee);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setSelectedFee(null);
    if (selectedStudent) {
      fetchStudentFees(selectedStudent.id);
    }
  };

  const handleClearStudent = () => {
    setSelectedStudent(null);
    setMonthlyFees([]);
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${(amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-blue-100 text-blue-800',
      overdue: 'bg-red-100 text-red-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Collection</h1>
          <p className="mt-1 text-sm text-gray-500">
            Search for students and record fee payments
          </p>
        </div>

        {/* Student Search */}
        {!selectedStudent && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Search Student</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter admission number, name, or phone..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Search Results */}
            {students.length > 0 && (
              <div className="mt-4 border border-gray-200 rounded-md">
                <div className="max-h-96 overflow-y-auto">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => handleSelectStudent(student)}
                      className="p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900">
                            {student.first_name} {student.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Admission: {student.admission_number} | Class: {student.class_name || student.class_id} | Phone: {student.parent_phone}
                          </div>
                        </div>
                        <button className="text-primary-600 hover:text-primary-800">
                          Select →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Selected Student Fee Details */}
        {selectedStudent && (
          <>
            {/* Student Info Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    {selectedStudent.first_name} {selectedStudent.last_name}
                  </h2>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <div>Admission Number: <span className="font-medium">{selectedStudent.admission_number}</span></div>
                    <div>Class: <span className="font-medium">{selectedStudent.class_name || selectedStudent.class_id}</span></div>
                    <div>Contact: <span className="font-medium">{selectedStudent.parent_phone}</span></div>
                  </div>
                </div>
                <button
                  onClick={handleClearStudent}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Change Student
                </button>
              </div>
            </div>

            {/* Monthly Fees Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Fee Details</h3>
              </div>

              {loadingFees ? (
                <div className="text-center py-12">
                  <div className="text-gray-600">Loading fees...</div>
                </div>
              ) : monthlyFees.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-gray-500">No fee records found for this student</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Period
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Total Fee
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Paid
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Pending
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Due Date
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {monthlyFees.map((fee) => (
                        <tr key={fee.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {getMonthName(fee.month)} {fee.year}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatCurrency(fee.total_fee)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">
                            {formatCurrency(fee.amount_paid)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right font-medium">
                            {formatCurrency(fee.amount_pending)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(fee.status)}`}>
                              {fee.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(fee.due_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {fee.amount_pending > 0 && (
                              <button
                                onClick={() => handleMakePayment(fee)}
                                className="text-primary-600 hover:text-primary-900"
                              >
                                Make Payment
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Summary */}
              {monthlyFees.length > 0 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Fees:</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {formatCurrency(monthlyFees.reduce((sum, f) => sum + f.total_fee, 0))}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Paid:</span>
                      <span className="ml-2 font-semibold text-green-600">
                        {formatCurrency(monthlyFees.reduce((sum, f) => sum + f.amount_paid, 0))}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Pending:</span>
                      <span className="ml-2 font-semibold text-red-600">
                        {formatCurrency(monthlyFees.reduce((sum, f) => sum + f.amount_pending, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && selectedFee && selectedStudent && (
        <PaymentForm
          monthlyFee={selectedFee}
          student={selectedStudent}
          onClose={() => setShowPaymentForm(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </Layout>
  );
}
