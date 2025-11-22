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

// Zod validation schema
const guardianSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  relation: z.enum(['Father', 'Mother', 'Guardian'], {
    required_error: 'Please select a relation',
  }),
  phone: z.string()
    .regex(/^[0-9]{10,15}$/, 'Must be 10-15 digits')
    .min(1, 'Phone number is required'),
  alternate_phone: z.string()
    .regex(/^[0-9]{10,15}$/, 'Must be 10-15 digits')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  occupation: z.string().optional(),
  annual_income: z.coerce.number()
    .min(0, 'Cannot be negative')
    .optional()
    .or(z.literal('')),
  education: z.string().optional(),
  aadhaar_number: z.string()
    .regex(/^(\d{12})?$/, 'Must be exactly 12 digits')
    .optional()
    .or(z.literal('')),
});

type GuardianFormData = z.infer<typeof guardianSchema>;

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
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function GuardianForm({ guardian, isOpen, onClose, onSuccess }: GuardianFormProps) {
  const form = useForm<GuardianFormData>({
    resolver: zodResolver(guardianSchema),
    defaultValues: guardian ? {
      full_name: guardian.full_name,
      relation: guardian.relation as any,
      phone: guardian.phone,
      alternate_phone: guardian.alternate_phone || '',
      email: guardian.email || '',
      address: guardian.address || '',
      occupation: guardian.occupation || '',
      annual_income: guardian.annual_income ? guardian.annual_income / 100 : '',
      education: guardian.education || '',
      aadhaar_number: guardian.aadhaar_number || '',
    } : {
      relation: 'Father',
    },
  });

  const onSubmit = async (data: GuardianFormData) => {
    try {
      const submitData = {
        full_name: data.full_name,
        relation: data.relation,
        phone: data.phone,
        alternate_phone: data.alternate_phone || null,
        email: data.email || null,
        address: data.address || null,
        occupation: data.occupation || null,
        annual_income: data.annual_income ? Number(data.annual_income) * 100 : null,
        education: data.education || null,
        aadhaar_number: data.aadhaar_number || null,
      };

      if (guardian) {
        await apiClient.updateGuardian(guardian.id, submitData);
      } else {
        await apiClient.createGuardian(submitData);
      }

      onSuccess?.();
      onClose();
      form.reset();
    } catch (err: any) {
      console.error('Failed to save guardian:', err);
      form.setError('root', {
        type: 'manual',
        message: err.response?.data?.detail || 'Failed to save guardian. Please check all fields.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{guardian ? 'Edit Guardian' : 'Add New Guardian'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Error Message */}
            {form.formState.errors.root && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {form.formState.errors.root.message}
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Basic Information</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="relation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relation *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Father">Father</SelectItem>
                          <SelectItem value="Mother">Mother</SelectItem>
                          <SelectItem value="Guardian">Guardian</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="10-digit mobile number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="alternate_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alternate Phone</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea rows={2} placeholder="Complete address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Professional & Financial Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Professional & Financial Information</h4>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Occupation</FormLabel>
                      <FormControl>
                        <Input placeholder="Job/Business" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="annual_income"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Annual Income (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="For scholarship eligibility"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="education"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Education</FormLabel>
                      <FormControl>
                        <Input placeholder="Highest qualification" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="aadhaar_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aadhaar Number</FormLabel>
                      <FormControl>
                        <Input placeholder="12-digit Aadhaar" maxLength={12} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

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
                  : guardian
                  ? 'Update Guardian'
                  : 'Add Guardian'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
