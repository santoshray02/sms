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
import { Button } from './ui/button';
import { Card } from './ui/card';

// Zod validation schema
const feeStructureSchema = z.object({
  class_id: z.coerce.number({
    required_error: 'Please select a class',
    invalid_type_error: 'Please select a class',
  }).int().positive(),
  academic_year_id: z.coerce.number({
    required_error: 'Please select an academic year',
    invalid_type_error: 'Please select an academic year',
  }).int().positive(),
  tuition_fee: z.coerce.number({
    required_error: 'Tuition fee is required',
    invalid_type_error: 'Must be a valid number',
  }).min(0, 'Tuition fee cannot be negative').multipleOf(0.01, 'Maximum 2 decimal places'),
  hostel_fee: z.coerce.number({
    invalid_type_error: 'Must be a valid number',
  }).min(0, 'Hostel fee cannot be negative').multipleOf(0.01, 'Maximum 2 decimal places').default(0),
});

type FeeStructureFormData = z.infer<typeof feeStructureSchema>;

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
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function FeeStructureForm({
  feeStructure,
  classes,
  academicYears,
  isOpen,
  onClose,
  onSuccess,
}: FeeStructureFormProps) {
  const isEditMode = !!feeStructure;

  const form = useForm<FeeStructureFormData>({
    resolver: zodResolver(feeStructureSchema),
    defaultValues: feeStructure
      ? {
          class_id: feeStructure.class_id,
          academic_year_id: feeStructure.academic_year_id,
          tuition_fee: feeStructure.tuition_fee,
          hostel_fee: feeStructure.hostel_fee,
        }
      : {
          hostel_fee: 0,
        },
  });

  // Watch fees for total calculation
  const tuitionFee = form.watch('tuition_fee', 0);
  const hostelFee = form.watch('hostel_fee', 0);
  const totalFee = ((tuitionFee || 0) + (hostelFee || 0)).toFixed(2);

  const onSubmit = async (data: FeeStructureFormData) => {
    try {
      if (isEditMode) {
        await apiClient.updateFeeStructure(feeStructure.id, {
          tuition_fee: data.tuition_fee,
          hostel_fee: data.hostel_fee,
        });
      } else {
        await apiClient.createFeeStructure(data);
      }
      onSuccess?.();
      onClose();
      form.reset();
    } catch (err: any) {
      console.error('Failed to save fee structure:', err);
      form.setError('root', {
        type: 'manual',
        message:
          err.response?.data?.detail || 'Failed to save fee structure. Please check all fields.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Fee Structure' : 'Add New Fee Structure'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Error Message */}
            {form.formState.errors.root && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {form.formState.errors.root.message}
              </div>
            )}

            {/* Class Selection */}
            <FormField
              control={form.control}
              name="class_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value?.toString()}
                    disabled={isEditMode}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id.toString()}>
                          {cls.name} {cls.section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isEditMode && (
                    <FormDescription>
                      Class cannot be changed for existing fee structure
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Academic Year Selection */}
            <FormField
              control={form.control}
              name="academic_year_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Academic Year *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value?.toString()}
                    disabled={isEditMode}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select academic year" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {academicYears.map((year) => (
                        <SelectItem key={year.id} value={year.id.toString()}>
                          {year.name} {year.is_current ? '(Current)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isEditMode && (
                    <FormDescription>
                      Academic year cannot be changed for existing fee structure
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tuition Fee */}
            <FormField
              control={form.control}
              name="tuition_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tuition Fee (₹ per month) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter amount in rupees"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter monthly tuition fee amount
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hostel Fee */}
            <FormField
              control={form.control}
              name="hostel_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hostel Fee (₹ per month)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter amount in rupees (optional)"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter hostel fee if applicable (leave 0 if not)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Total Fee Display */}
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Monthly Fee:</span>
                <span className="text-2xl font-bold text-primary">₹{totalFee}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                This is the total monthly fee that will be charged to students in this class
              </p>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={form.formState.isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? 'Saving...'
                  : isEditMode
                  ? 'Update Fee Structure'
                  : 'Add Fee Structure'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
