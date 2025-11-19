import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

interface Student {
  id: number;
  admission_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  class_id: number;
  academic_year_id?: number;
  parent_name: string;
  parent_phone: string;
  parent_email?: string;
  address?: string;
  has_hostel?: boolean;
  transport_route_id?: number;
  status: string;
}

interface StudentFormProps {
  student: Student | null;
  classes: any[];
  onClose: () => void;
}

export default function StudentForm({ student, classes, onClose }: StudentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [transportRoutes, setTransportRoutes] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    admission_number: student?.admission_number || '',
    first_name: student?.first_name || '',
    last_name: student?.last_name || '',
    date_of_birth: student?.date_of_birth || '',
    gender: student?.gender || 'Male',
    class_id: student?.class_id || '',
    academic_year_id: student?.academic_year_id || '',
    parent_name: student?.parent_name || '',
    parent_phone: student?.parent_phone || '',
    parent_email: student?.parent_email || '',
    address: student?.address || '',
    has_hostel: student?.has_hostel || false,
    transport_route_id: student?.transport_route_id || '',
    status: student?.status || 'active',
  });

  useEffect(() => {
    fetchAcademicYears();
    fetchTransportRoutes();
  }, []);

  const fetchAcademicYears = async () => {
    try {
      const data = await apiClient.getAcademicYears();
      setAcademicYears(data);

      // Set default academic year if creating new student
      if (!student && data.length > 0) {
        const currentYear = data.find((year: any) => year.is_current);
        if (currentYear) {
          setFormData(prev => ({ ...prev, academic_year_id: currentYear.id }));
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Prepare data for submission
      const submitData: any = {
        admission_number: formData.admission_number,
        first_name: formData.first_name,
        last_name: formData.last_name,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        class_id: Number(formData.class_id),
        academic_year_id: Number(formData.academic_year_id),
        parent_name: formData.parent_name,
        parent_phone: formData.parent_phone,
        has_hostel: formData.has_hostel,
      };

      // Add optional fields only if they have values
      if (formData.parent_email) submitData.parent_email = formData.parent_email;
      if (formData.address) submitData.address = formData.address;
      if (formData.transport_route_id) submitData.transport_route_id = Number(formData.transport_route_id);
      if (student) submitData.status = formData.status;

      if (student) {
        await apiClient.updateStudent(student.id, submitData);
      } else {
        await apiClient.createStudent(submitData);
      }

      onClose();
    } catch (err: any) {
      console.error('Failed to save student:', err);
      setError(err.response?.data?.detail || 'Failed to save student. Please check all fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {student ? 'Edit Student' : 'Add New Student'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Admission Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admission Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="admission_number"
                value={formData.admission_number}
                onChange={handleChange}
                required
                disabled={!!student}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
              />
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <select
                name="academic_year_id"
                value={formData.academic_year_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select Academic Year</option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name} {year.is_current ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Class */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                name="class_id"
                value={formData.class_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.section}
                  </option>
                ))}
              </select>
            </div>

            {/* Status (only for edit) */}
            {student && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="graduated">Graduated</option>
                </select>
              </div>
            )}

            {/* Parent Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent/Guardian Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="parent_name"
                value={formData.parent_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Parent Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="parent_phone"
                value={formData.parent_phone}
                onChange={handleChange}
                required
                placeholder="10-15 digits"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Parent Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Email
              </label>
              <input
                type="email"
                name="parent_email"
                value={formData.parent_email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Transport Route */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transport Route
              </label>
              <select
                name="transport_route_id"
                value={formData.transport_route_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">No Transport</option>
                {transportRoutes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.name} - Rs. {(route.monthly_fee / 100).toFixed(2)}/month
                  </option>
                ))}
              </select>
            </div>

            {/* Hostel */}
            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                name="has_hostel"
                checked={formData.has_hostel}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Hostel Facility
              </label>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
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
              {loading ? 'Saving...' : student ? 'Update Student' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
