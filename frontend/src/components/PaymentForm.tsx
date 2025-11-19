import { useState } from 'react';
import { apiClient } from '../services/api';

interface MonthlyFee {
  id: number;
  month: number;
  year: number;
  total_fee: number;
  amount_paid: number;
  amount_pending: number;
}

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  admission_number: string;
}

interface PaymentFormProps {
  monthlyFee: MonthlyFee;
  student: Student;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentForm({ monthlyFee, student, onClose, onSuccess }: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    amount: (monthlyFee.amount_pending / 100).toString(),
    payment_mode: 'cash',
    payment_date: new Date().toISOString().split('T')[0],
    transaction_id: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = parseFloat(formData.amount);
    const maxAmount = monthlyFee.amount_pending / 100;

    if (amount <= 0) {
      setError('Payment amount must be greater than zero');
      return;
    }

    if (amount > maxAmount) {
      setError(`Payment amount cannot exceed pending amount (Rs. ${maxAmount.toFixed(2)})`);
      return;
    }

    setLoading(true);

    try {
      const paymentData = {
        monthly_fee_id: monthlyFee.id,
        student_id: student.id,
        amount: amount,
        payment_mode: formData.payment_mode,
        payment_date: formData.payment_date,
        transaction_id: formData.transaction_id || undefined,
        notes: formData.notes || undefined,
      };

      await apiClient.createPayment(paymentData);
      onSuccess();
    } catch (err: any) {
      console.error('Failed to record payment:', err);
      setError(err.response?.data?.detail || 'Failed to record payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${(amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Record Payment</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {/* Student and Fee Info */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="font-medium text-blue-900 mb-2">Payment Details</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-blue-700">Student:</span>
              <span className="ml-2 font-semibold text-blue-900">
                {student.first_name} {student.last_name}
              </span>
            </div>
            <div>
              <span className="text-blue-700">Admission No:</span>
              <span className="ml-2 font-semibold text-blue-900">{student.admission_number}</span>
            </div>
            <div>
              <span className="text-blue-700">Fee Period:</span>
              <span className="ml-2 font-semibold text-blue-900">
                {getMonthName(monthlyFee.month)} {monthlyFee.year}
              </span>
            </div>
            <div>
              <span className="text-blue-700">Total Fee:</span>
              <span className="ml-2 font-semibold text-blue-900">
                {formatCurrency(monthlyFee.total_fee)}
              </span>
            </div>
            <div>
              <span className="text-blue-700">Already Paid:</span>
              <span className="ml-2 font-semibold text-green-600">
                {formatCurrency(monthlyFee.amount_paid)}
              </span>
            </div>
            <div>
              <span className="text-blue-700">Pending:</span>
              <span className="ml-2 font-semibold text-red-600">
                {formatCurrency(monthlyFee.amount_pending)}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Amount (Rs.) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="0.01"
                max={(monthlyFee.amount_pending / 100).toString()}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Maximum: Rs. {(monthlyFee.amount_pending / 100).toFixed(2)}
              </p>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="payment_date"
                value={formData.payment_date}
                onChange={handleChange}
                required
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Mode <span className="text-red-500">*</span>
              </label>
              <select
                name="payment_mode"
                value={formData.payment_mode}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="cash">Cash</option>
                <option value="online">Online Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
              </select>
            </div>

            {/* Transaction ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction ID / Cheque No
              </label>
              <input
                type="text"
                name="transaction_id"
                value={formData.transaction_id}
                onChange={handleChange}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Required for online/cheque/UPI payments
              </p>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Any additional notes about this payment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
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
              {loading ? 'Recording Payment...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
