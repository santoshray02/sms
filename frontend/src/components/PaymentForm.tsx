import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '../services/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Card } from './ui/card';

// Zod validation schema
const paymentSchema = z.object({
  amount: z.coerce.number({
    required_error: 'Payment amount is required',
    invalid_type_error: 'Must be a valid number',
  }).positive('Amount must be greater than zero').multipleOf(0.01, 'Maximum 2 decimal places'),
  payment_mode: z.enum(['cash', 'online', 'cheque', 'upi', 'card'], {
    required_error: 'Please select a payment mode',
  }),
  payment_date: z.string().min(1, 'Payment date is required'),
  transaction_id: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    // Require transaction_id for non-cash payments
    if (['online', 'cheque', 'upi', 'card'].includes(data.payment_mode)) {
      return !!data.transaction_id && data.transaction_id.trim().length > 0;
    }
    return true;
  },
  {
    message: 'Transaction ID is required for this payment mode',
    path: ['transaction_id'],
  }
);

type PaymentFormData = z.infer<typeof paymentSchema>;

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
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentForm({
  monthlyFee,
  student,
  isOpen,
  onClose,
  onSuccess,
}: PaymentFormProps) {
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: monthlyFee.amount_pending,
      payment_mode: 'cash',
      payment_date: new Date().toISOString().split('T')[0],
      transaction_id: '',
      notes: '',
    },
  });

  const paymentMode = form.watch('payment_mode');
  const amount = form.watch('amount', 0);

  const onSubmit = async (data: PaymentFormData) => {
    // Additional validation: amount cannot exceed pending amount
    if (data.amount > monthlyFee.amount_pending) {
      form.setError('amount', {
        type: 'manual',
        message: `Amount cannot exceed pending amount (₹${monthlyFee.amount_pending.toFixed(2)})`,
      });
      return;
    }

    try {
      const paymentData = {
        monthly_fee_id: monthlyFee.id,
        student_id: student.id,
        amount: data.amount,
        payment_mode: data.payment_mode,
        payment_date: data.payment_date,
        transaction_id: data.transaction_id || undefined,
        notes: data.notes || undefined,
      };

      await apiClient.createPayment(paymentData);
      onSuccess();
      onClose();
      form.reset();
    } catch (err: any) {
      console.error('Failed to record payment:', err);
      form.setError('root', {
        type: 'manual',
        message: err.response?.data?.detail || 'Failed to record payment. Please try again.',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return months[month - 1];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        {/* Student and Fee Info Card */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h4 className="text-sm font-semibold text-blue-900 mb-3">Payment Details</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-blue-700">Student:</span>
              <span className="ml-2 font-semibold text-blue-900">
                {student.first_name} {student.last_name}
              </span>
            </div>
            <div>
              <span className="text-blue-700">Admission No:</span>
              <span className="ml-2 font-semibold text-blue-900">
                {student.admission_number}
              </span>
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
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Error Message */}
            {form.formState.errors.root && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {form.formState.errors.root.message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Payment Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Amount (₹) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter amount"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum: ₹{monthlyFee.amount_pending.toFixed(2)}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Date */}
              <FormField
                control={form.control}
                name="payment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        max={new Date().toISOString().split('T')[0]}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Cannot be a future date
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Mode */}
              <FormField
                control={form.control}
                name="payment_mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Mode *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="online">Online Transfer</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Transaction ID */}
              <FormField
                control={form.control}
                name="transaction_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Transaction ID / Cheque No {paymentMode !== 'cash' && '*'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder={paymentMode === 'cash' ? 'Optional' : 'Required for this payment mode'}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Required for online/cheque/UPI/card payments
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes (Full Width) */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Any additional notes about this payment..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional additional information
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Recording...' : 'Record Payment'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
