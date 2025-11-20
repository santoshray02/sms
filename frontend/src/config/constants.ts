/**
 * Application Constants
 * Centralized configuration for dropdowns, types, and static values
 */

// Concession Types
export const CONCESSION_TYPES = [
  { value: 'Government Scholarship', label: 'Government Scholarship', color: 'green' },
  { value: 'Sibling Discount', label: 'Sibling Discount', color: 'blue' },
  { value: 'Merit Award', label: 'Merit Award', color: 'purple' },
  { value: 'Financial Hardship', label: 'Financial Hardship', color: 'yellow' },
  { value: 'Staff Child', label: 'Staff Child', color: 'indigo' },
  { value: 'Other', label: 'Other', color: 'gray' },
] as const;

// Payment Modes
export const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'card', label: 'Debit/Credit Card' },
  { value: 'online', label: 'Online Payment' },
] as const;

// SMS Providers
export const SMS_PROVIDERS = [
  { value: 'msg91', label: 'MSG91' },
  { value: 'textlocal', label: 'TextLocal' },
  { value: 'twilio', label: 'Twilio' },
  { value: 'fast2sms', label: 'Fast2SMS' },
  { value: 'gupshup', label: 'Gupshup' },
] as const;

// Student Categories (RTE Act)
export const STUDENT_CATEGORIES = [
  { value: 'General', label: 'General' },
  { value: 'SC', label: 'SC (Scheduled Caste)' },
  { value: 'ST', label: 'ST (Scheduled Tribe)' },
  { value: 'OBC', label: 'OBC (Other Backward Class)' },
  { value: 'EWS', label: 'EWS (Economically Weaker Section)' },
] as const;

// Religion
export const RELIGIONS = [
  { value: 'Hindu', label: 'Hindu' },
  { value: 'Muslim', label: 'Muslim' },
  { value: 'Christian', label: 'Christian' },
  { value: 'Sikh', label: 'Sikh' },
  { value: 'Buddhist', label: 'Buddhist' },
  { value: 'Jain', label: 'Jain' },
  { value: 'Other', label: 'Other' },
] as const;

// Guardian Relations
export const GUARDIAN_RELATIONS = [
  { value: 'Father', label: 'Father' },
  { value: 'Mother', label: 'Mother' },
  { value: 'Guardian', label: 'Legal Guardian' },
  { value: 'Grandfather', label: 'Grandfather' },
  { value: 'Grandmother', label: 'Grandmother' },
  { value: 'Uncle', label: 'Uncle' },
  { value: 'Aunt', label: 'Aunt' },
  { value: 'Other', label: 'Other Relative' },
] as const;

// Streams (for Classes 11-12)
export const STREAMS = [
  { value: 'Science', label: 'Science' },
  { value: 'Commerce', label: 'Commerce' },
  { value: 'Arts', label: 'Arts/Humanities' },
] as const;

// Student Status
export const STUDENT_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'graduated', label: 'Graduated' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'dropped', label: 'Dropped Out' },
] as const;

// Attendance Status
export const ATTENDANCE_STATUSES = [
  { value: 'present', label: 'Present', color: 'green' },
  { value: 'absent', label: 'Absent', color: 'red' },
  { value: 'late', label: 'Late', color: 'yellow' },
  { value: 'leave', label: 'Leave', color: 'blue' },
  { value: 'half_day', label: 'Half Day', color: 'orange' },
] as const;

// Fee Status
export const FEE_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'paid', label: 'Paid', color: 'green' },
  { value: 'partial', label: 'Partial', color: 'blue' },
  { value: 'overdue', label: 'Overdue', color: 'red' },
  { value: 'waived', label: 'Waived', color: 'gray' },
] as const;

// Month Names
export const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
] as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 500,
} as const;

// Color Mappings for Badges
export const COLOR_CLASSES = {
  green: 'bg-green-100 text-green-800 border-green-200',
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  gray: 'bg-gray-100 text-gray-800 border-gray-200',
  orange: 'bg-orange-100 text-orange-800 border-orange-200',
} as const;

// Export helper functions
export const getConcessionTypeColor = (type: string) => {
  const concessionType = CONCESSION_TYPES.find((t) => t.value === type);
  return COLOR_CLASSES[concessionType?.color || 'gray'];
};

export const getStatusColor = (status: string, statusList: readonly { value: string; color: string }[]) => {
  const statusItem = statusList.find((s) => s.value === status);
  return COLOR_CLASSES[statusItem?.color as keyof typeof COLOR_CLASSES || 'gray'];
};
