import { useEffect, useState } from 'react';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
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
const studentSchema = z.object({
  // Basic Information
  admission_number: z.string().min(1, 'Admission number is required'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['Male', 'Female', 'Other'], {
    required_error: 'Please select a gender',
  }),
  class_id: z.coerce.number({
    required_error: 'Please select a class',
    invalid_type_error: 'Please select a class',
  }).positive(),
  academic_year_id: z.coerce.number({
    required_error: 'Please select an academic year',
    invalid_type_error: 'Please select an academic year',
  }).positive(),
  status: z.enum(['active', 'inactive', 'graduated']).optional(),

  // Guardian Information
  guardian_id: z.coerce.number().optional().or(z.literal('')),
  parent_name: z.string().optional(),
  parent_phone: z.string().optional(),
  parent_email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),

  // Government Compliance
  category: z.string().optional(),
  caste: z.string().optional(),
  religion: z.string().optional(),
  caste_certificate_number: z.string().optional(),
  income_certificate_number: z.string().optional(),
  bpl_card_number: z.string().optional(),
  aadhaar_number: z.string()
    .regex(/^(\d{12})?$/, 'Must be exactly 12 digits')
    .optional()
    .or(z.literal('')),
  blood_group: z.string().optional(),

  // Scholarship & Concession
  scholarship_type: z.string().optional(),
  scholarship_amount: z.coerce.number().min(0, 'Cannot be negative').optional().or(z.literal('')),
  concession_percentage: z.coerce.number().min(0, 'Cannot be negative').max(100, 'Cannot exceed 100').optional().or(z.literal('')),
  concession_reason: z.string().optional(),

  // Board Exam
  board_registration_number: z.string().optional(),
  roll_number: z.string().optional(),

  // Performance
  average_marks: z.coerce.number().min(0).max(100, 'Cannot exceed 100').optional().or(z.literal('')),
  attendance_percentage: z.coerce.number().min(0).max(100, 'Cannot exceed 100').optional().or(z.literal('')),

  // Fee Configuration
  transport_route_id: z.coerce.number().optional().or(z.literal('')),
  has_hostel: z.boolean().default(false),
  photo_url: z.string().optional(),
}).refine(
  (data) => {
    // If no guardian_id, require parent_name and parent_phone
    if (!data.guardian_id) {
      return !!data.parent_name && !!data.parent_phone;
    }
    return true;
  },
  {
    message: 'Parent name and phone are required when not linking to a guardian',
    path: ['parent_name'],
  }
);

type StudentFormData = z.infer<typeof studentSchema>;

interface Student {
  id: number;
  admission_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  class_id: number;
  academic_year_id?: number;
  guardian_id?: number;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  address?: string;
  category?: string;
  caste?: string;
  religion?: string;
  caste_certificate_number?: string;
  income_certificate_number?: string;
  bpl_card_number?: string;
  aadhaar_number?: string;
  blood_group?: string;
  photo_url?: string;
  scholarship_type?: string;
  scholarship_amount?: number;
  concession_percentage?: number;
  concession_reason?: string;
  board_registration_number?: string;
  roll_number?: string;
  average_marks?: number;
  attendance_percentage?: number;
  has_hostel?: boolean;
  transport_route_id?: number;
  status: string;
}

interface StudentFormProps {
  student: Student | null;
  classes: any[];
  onClose: () => void;
}

export default function StudentFormEnhanced({ student, classes, onClose }: StudentFormProps) {
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [transportRoutes, setTransportRoutes] = useState<any[]>([]);
  const [guardians, setGuardians] = useState<any[]>([]);

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: student ? {
      admission_number: student.admission_number,
      first_name: student.first_name,
      last_name: student.last_name,
      date_of_birth: student.date_of_birth,
      gender: student.gender as any,
      class_id: student.class_id,
      academic_year_id: student.academic_year_id,
      status: student.status as any,
      guardian_id: student.guardian_id || '',
      parent_name: student.parent_name || '',
      parent_phone: student.parent_phone || '',
      parent_email: student.parent_email || '',
      address: student.address || '',
      category: student.category || '',
      caste: student.caste || '',
      religion: student.religion || '',
      caste_certificate_number: student.caste_certificate_number || '',
      income_certificate_number: student.income_certificate_number || '',
      bpl_card_number: student.bpl_card_number || '',
      aadhaar_number: student.aadhaar_number || '',
      blood_group: student.blood_group || '',
      photo_url: student.photo_url || '',
      scholarship_type: student.scholarship_type || '',
      scholarship_amount: student.scholarship_amount ? student.scholarship_amount / 100 : '',
      concession_percentage: student.concession_percentage || '',
      concession_reason: student.concession_reason || '',
      board_registration_number: student.board_registration_number || '',
      roll_number: student.roll_number || '',
      average_marks: student.average_marks || '',
      attendance_percentage: student.attendance_percentage || '',
      transport_route_id: student.transport_route_id || '',
      has_hostel: student.has_hostel || false,
    } : {
      gender: 'Male',
      has_hostel: false,
      concession_percentage: '',
    },
  });

  const guardianId = form.watch('guardian_id');

  useEffect(() => {
    fetchAcademicYears();
    fetchTransportRoutes();
    fetchGuardians();
  }, []);

  const fetchAcademicYears = async () => {
    try {
      const data = await apiClient.getAcademicYears();
      setAcademicYears(data);
      if (!student && data.length > 0) {
        const currentYear = data.find((year: any) => year.is_current);
        if (currentYear) {
          form.setValue('academic_year_id', currentYear.id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch academic years:', err);
    }
  };

  const fetchTransportRoutes = async () => {
    try {
      const data = await apiClient.getTransportRoutes();
      setTransportRoutes(data);
    } catch (err) {
      console.error('Failed to fetch transport routes:', err);
    }
  };

  const fetchGuardians = async () => {
    try {
      const data = await apiClient.getGuardians({ page_size: 100 });
      setGuardians(data.guardians || []);
    } catch (err) {
      console.error('Failed to fetch guardians:', err);
    }
  };

  const onSubmit = async (data: StudentFormData) => {
    try {
      const submitData: any = {
        admission_number: data.admission_number,
        first_name: data.first_name,
        last_name: data.last_name,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        class_id: Number(data.class_id),
        academic_year_id: Number(data.academic_year_id),
        has_hostel: data.has_hostel,
        concession_percentage: Number(data.concession_percentage) || 0,
      };

      // Guardian or legacy parent
      if (data.guardian_id) {
        submitData.guardian_id = Number(data.guardian_id);
      } else {
        if (data.parent_name) submitData.parent_name = data.parent_name;
        if (data.parent_phone) submitData.parent_phone = data.parent_phone;
      }

      // Optional fields
      if (data.parent_email) submitData.parent_email = data.parent_email;
      if (data.address) submitData.address = data.address;
      if (data.transport_route_id) submitData.transport_route_id = Number(data.transport_route_id);

      // Government fields
      if (data.category) submitData.category = data.category;
      if (data.caste) submitData.caste = data.caste;
      if (data.religion) submitData.religion = data.religion;
      if (data.caste_certificate_number) submitData.caste_certificate_number = data.caste_certificate_number;
      if (data.income_certificate_number) submitData.income_certificate_number = data.income_certificate_number;
      if (data.bpl_card_number) submitData.bpl_card_number = data.bpl_card_number;
      if (data.aadhaar_number) submitData.aadhaar_number = data.aadhaar_number;

      // Additional
      if (data.blood_group) submitData.blood_group = data.blood_group;
      if (data.photo_url) submitData.photo_url = data.photo_url;

      // Scholarship
      if (data.scholarship_type) submitData.scholarship_type = data.scholarship_type;
      if (data.scholarship_amount) submitData.scholarship_amount = Number(data.scholarship_amount) * 100;
      if (data.concession_reason) submitData.concession_reason = data.concession_reason;

      // Board
      if (data.board_registration_number) submitData.board_registration_number = data.board_registration_number;
      if (data.roll_number) submitData.roll_number = data.roll_number;

      // Performance
      if (data.average_marks) submitData.average_marks = Number(data.average_marks);
      if (data.attendance_percentage) submitData.attendance_percentage = Number(data.attendance_percentage);

      if (student) submitData.status = data.status;

      if (student) {
        await apiClient.updateStudent(student.id, submitData);
      } else {
        await apiClient.createStudent(submitData);
      }

      onClose();
    } catch (err: any) {
      console.error('Failed to save student:', err);
      form.setError('root', {
        type: 'manual',
        message: err.response?.data?.detail || 'Failed to save student. Please check all fields.',
      });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{student ? 'Edit Student' : 'Add New Student'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Error Message */}
            {form.formState.errors.root && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {form.formState.errors.root.message}
              </div>
            )}

            <Accordion type="multiple" defaultValue={['basic']} className="w-full">
              {/* Basic Information */}
              <AccordionItem value="basic">
                <AccordionTrigger className="text-base font-semibold">
                  📋 Basic Information
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="admission_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admission Number *</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!!student} />
                          </FormControl>
                          {!!student && (
                            <FormDescription>Cannot be changed</FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="academic_year_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Academic Year *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select year" />
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="date_of_birth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="class_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select class" />
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {student && (
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="graduated">Graduated</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Guardian Information */}
              <AccordionItem value="guardian">
                <AccordionTrigger className="text-base font-semibold">
                  👨‍👩‍👧‍👦 Guardian Information
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="guardian_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link to Guardian</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="No Guardian (Use fields below)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">No Guardian</SelectItem>
                            {guardians.map((guardian) => (
                              <SelectItem key={guardian.id} value={guardian.id.toString()}>
                                {guardian.full_name} - {guardian.phone} ({guardian.relation})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Recommended for siblings
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name="parent_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Parent/Guardian Name {!guardianId && '*'}
                            </FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!!guardianId} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="parent_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone {!guardianId && '*'}</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="10-15 digits" {...field} disabled={!!guardianId} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="parent_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
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
                              <Textarea rows={2} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Government Compliance */}
              <AccordionItem value="government">
                <AccordionTrigger className="text-base font-semibold">
                  🏛️ Government Compliance (RTE/CBSE)
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="General">General</SelectItem>
                              <SelectItem value="SC">SC (Scheduled Caste)</SelectItem>
                              <SelectItem value="ST">ST (Scheduled Tribe)</SelectItem>
                              <SelectItem value="OBC">OBC (Other Backward Class)</SelectItem>
                              <SelectItem value="EWS">EWS (Economically Weaker Section)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="religion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Religion</FormLabel>
                          <FormControl>
                            <Input placeholder="Hindu/Muslim/Christian/etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="caste"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Caste</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="caste_certificate_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Caste Certificate No.</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="income_certificate_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Income Certificate No.</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bpl_card_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>BPL Card No.</FormLabel>
                          <FormControl>
                            <Input placeholder="Below Poverty Line" {...field} />
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

                    <FormField
                      control={form.control}
                      name="blood_group"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Blood Group</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select blood group" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="A+">A+</SelectItem>
                              <SelectItem value="A-">A-</SelectItem>
                              <SelectItem value="B+">B+</SelectItem>
                              <SelectItem value="B-">B-</SelectItem>
                              <SelectItem value="AB+">AB+</SelectItem>
                              <SelectItem value="AB-">AB-</SelectItem>
                              <SelectItem value="O+">O+</SelectItem>
                              <SelectItem value="O-">O-</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Scholarship & Concession */}
              <AccordionItem value="scholarship">
                <AccordionTrigger className="text-base font-semibold">
                  💰 Scholarship & Concession
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="scholarship_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Scholarship Type</FormLabel>
                          <FormControl>
                            <Input placeholder="NMMSS/NMMS/Post-Matric/etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="scholarship_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Scholarship Amount (₹/month)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min="0" placeholder="Monthly amount" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="concession_percentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Concession (%)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" max="100" placeholder="0-100" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="concession_reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Concession Reason</FormLabel>
                          <FormControl>
                            <Input placeholder="Merit/Sibling/Financial" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Board Exam */}
              <AccordionItem value="board">
                <AccordionTrigger className="text-base font-semibold">
                  📝 Board Exam Information (Class 10/12)
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="board_registration_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Board Registration No.</FormLabel>
                          <FormControl>
                            <Input placeholder="CBSE Registration Number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="roll_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Roll Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Class Roll Number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Performance Tracking */}
              <AccordionItem value="performance">
                <AccordionTrigger className="text-base font-semibold">
                  📊 Performance Tracking
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="average_marks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Average Marks (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min="0" max="100" placeholder="0-100" {...field} />
                          </FormControl>
                          <FormDescription>
                            Used for merit-based section assignment
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="attendance_percentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Attendance (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min="0" max="100" placeholder="0-100" {...field} />
                          </FormControl>
                          <FormDescription>
                            Current attendance percentage
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Fee Configuration */}
              <AccordionItem value="fee">
                <AccordionTrigger className="text-base font-semibold">
                  🏫 Fee Configuration
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="transport_route_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transport Route</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="No Transport" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">No Transport</SelectItem>
                              {transportRoutes.map((route) => (
                                <SelectItem key={route.id} value={route.id.toString()}>
                                  {route.name} - ₹{(route.monthly_fee / 100).toFixed(0)}/month
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="has_hostel"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-8">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Hostel Facility</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

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
                  : student
                  ? 'Update Student'
                  : 'Add Student'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
