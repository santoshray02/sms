import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { CONCESSION_TYPES } from '../config/constants';
import { APP_CONFIG } from '../config/app';
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
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';

// Zod validation schema
const concessionSchema = z.object({
  student_id: z.coerce.number({
    required_error: 'Please select a student',
    invalid_type_error: 'Please select a student',
  }).positive(),
  concession_type: z.string().min(1, 'Please select a concession type'),
  percentage: z.coerce.number()
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot exceed 100')
    .optional()
    .or(z.literal('')),
  amount: z.coerce.number()
    .min(0, 'Cannot be negative')
    .optional()
    .or(z.literal('')),
  reason: z.string().optional(),
  valid_from: z.string().min(1, 'Valid from date is required'),
  valid_to: z.string().optional(),
  is_active: z.boolean().default(true),
});

type ConcessionFormData = z.infer<typeof concessionSchema>;

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
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ConcessionForm({ concession, isOpen, onClose, onSuccess }: ConcessionFormProps) {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const form = useForm<ConcessionFormData>({
    resolver: zodResolver(concessionSchema),
    defaultValues: concession ? {
      student_id: concession.student_id,
      concession_type: concession.concession_type,
      percentage: concession.percentage || '',
      amount: concession.amount ? concession.amount / 100 : '',
      reason: concession.reason || '',
      valid_from: concession.valid_from,
      valid_to: concession.valid_to || '',
      is_active: concession.is_active,
    } : {
      concession_type: 'Government Scholarship',
      valid_from: new Date().toISOString().split('T')[0],
      is_active: true,
      percentage: '',
      amount: '',
    },
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

  const onSubmit = async (data: ConcessionFormData) => {
    try {
      const submitData = {
        student_id: Number(data.student_id),
        concession_type: data.concession_type,
        percentage: Number(data.percentage) || 0,
        amount: data.amount ? Math.round(Number(data.amount) * 100) : 0,
        reason: data.reason || null,
        valid_from: data.valid_from,
        valid_to: data.valid_to || null,
        is_active: data.is_active,
        approved_by: user?.id || 1,
      };

      if (concession) {
        await apiClient.updateConcession(concession.id, submitData);
      } else {
        await apiClient.createConcession(submitData);
      }

      onSuccess?.();
      onClose();
      form.reset();
    } catch (err: any) {
      console.error('Failed to save concession:', err);
      form.setError('root', {
        type: 'manual',
        message: err.response?.data?.detail || 'Failed to save concession. Please check all fields.',
      });
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{concession ? 'Edit Concession' : 'Add New Concession'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Error Message */}
            {form.formState.errors.root && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {form.formState.errors.root.message}
              </div>
            )}

            {/* Student Selection */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Student Information</h4>

              <div>
                <Input
                  type="text"
                  placeholder="Search by name or admission number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-2"
                />
                <FormField
                  control={form.control}
                  name="student_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Student *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value?.toString()}
                        disabled={!!concession}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="-- Select Student --" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[200px]">
                          {filteredStudents.map((student) => (
                            <SelectItem key={student.id} value={student.id.toString()}>
                              {student.admission_number} - {student.first_name} {student.last_name}
                              (Class: {student.class_name || student.class_id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {concession && (
                        <FormDescription>
                          Student cannot be changed when editing
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Concession Details */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Concession Details</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="concession_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Concession Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CONCESSION_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Percentage Discount (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0-100"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Percentage off total fees
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fixed Amount ({APP_CONFIG.currency.symbol})</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Monthly amount"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Fixed monthly discount amount
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason / Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={3}
                            placeholder="Reason for concession (e.g., NMMSS Scholarship, Sibling in Class 6)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Validity Period */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Validity Period</h4>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="valid_from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid From *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valid_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid To (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Leave blank for no expiry
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Status */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Active (applies to fee calculations)</FormLabel>
                  </div>
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
                {form.formState.isSubmitting
                  ? 'Saving...'
                  : concession
                  ? 'Update Concession'
                  : 'Add Concession'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
