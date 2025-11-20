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

  // Guardian (new or legacy parent)
  guardian_id?: number;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  address?: string;

  // Government compliance
  category?: string;
  caste?: string;
  religion?: string;
  caste_certificate_number?: string;
  income_certificate_number?: string;
  bpl_card_number?: string;
  aadhaar_number?: string;

  // Additional info
  blood_group?: string;
  photo_url?: string;

  // Scholarship
  scholarship_type?: string;
  scholarship_amount?: number;
  concession_percentage?: number;
  concession_reason?: string;

  // Board exam
  board_registration_number?: string;
  roll_number?: string;

  // Fee config
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [transportRoutes, setTransportRoutes] = useState<any[]>([]);
  const [guardians, setGuardians] = useState<any[]>([]);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    basic: true,
    guardian: false,
    government: false,
    scholarship: false,
    board: false,
    additional: false,
  });

  const [formData, setFormData] = useState({
    admission_number: student?.admission_number || '',
    first_name: student?.first_name || '',
    last_name: student?.last_name || '',
    date_of_birth: student?.date_of_birth || '',
    gender: student?.gender || 'Male',
    class_id: student?.class_id || '',
    academic_year_id: student?.academic_year_id || '',

    // Guardian
    guardian_id: student?.guardian_id || '',
    parent_name: student?.parent_name || '',
    parent_phone: student?.parent_phone || '',
    parent_email: student?.parent_email || '',
    address: student?.address || '',

    // Government
    category: student?.category || '',
    caste: student?.caste || '',
    religion: student?.religion || '',
    caste_certificate_number: student?.caste_certificate_number || '',
    income_certificate_number: student?.income_certificate_number || '',
    bpl_card_number: student?.bpl_card_number || '',
    aadhaar_number: student?.aadhaar_number || '',

    // Additional
    blood_group: student?.blood_group || '',
    photo_url: student?.photo_url || '',

    // Scholarship
    scholarship_type: student?.scholarship_type || '',
    scholarship_amount: student?.scholarship_amount ? student.scholarship_amount / 100 : '',
    concession_percentage: student?.concession_percentage || 0,
    concession_reason: student?.concession_reason || '',

    // Board
    board_registration_number: student?.board_registration_number || '',
    roll_number: student?.roll_number || '',

    // Fee config
    has_hostel: student?.has_hostel || false,
    transport_route_id: student?.transport_route_id || '',
    status: student?.status || 'active',
  });

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

  const fetchGuardians = async () => {
    try {
      const data = await apiClient.getGuardians({ page_size: 100 });
      setGuardians(data.guardians || []);
    } catch (err) {
      console.error('Failed to fetch guardians:', err);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
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
      const submitData: any = {
        admission_number: formData.admission_number,
        first_name: formData.first_name,
        last_name: formData.last_name,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        class_id: Number(formData.class_id),
        academic_year_id: Number(formData.academic_year_id),
        has_hostel: formData.has_hostel,
        concession_percentage: Number(formData.concession_percentage) || 0,
      };

      // Guardian or legacy parent
      if (formData.guardian_id) {
        submitData.guardian_id = Number(formData.guardian_id);
      } else {
        if (formData.parent_name) submitData.parent_name = formData.parent_name;
        if (formData.parent_phone) submitData.parent_phone = formData.parent_phone;
      }

      // Optional fields
      if (formData.parent_email) submitData.parent_email = formData.parent_email;
      if (formData.address) submitData.address = formData.address;
      if (formData.transport_route_id) submitData.transport_route_id = Number(formData.transport_route_id);

      // Government fields
      if (formData.category) submitData.category = formData.category;
      if (formData.caste) submitData.caste = formData.caste;
      if (formData.religion) submitData.religion = formData.religion;
      if (formData.caste_certificate_number) submitData.caste_certificate_number = formData.caste_certificate_number;
      if (formData.income_certificate_number) submitData.income_certificate_number = formData.income_certificate_number;
      if (formData.bpl_card_number) submitData.bpl_card_number = formData.bpl_card_number;
      if (formData.aadhaar_number) submitData.aadhaar_number = formData.aadhaar_number;

      // Additional
      if (formData.blood_group) submitData.blood_group = formData.blood_group;
      if (formData.photo_url) submitData.photo_url = formData.photo_url;

      // Scholarship
      if (formData.scholarship_type) submitData.scholarship_type = formData.scholarship_type;
      if (formData.scholarship_amount) submitData.scholarship_amount = Number(formData.scholarship_amount) * 100;
      if (formData.concession_reason) submitData.concession_reason = formData.concession_reason;

      // Board
      if (formData.board_registration_number) submitData.board_registration_number = formData.board_registration_number;
      if (formData.roll_number) submitData.roll_number = formData.roll_number;

      if (student) submitData.status = formData.status;

      if (student) {
        await apiClient.updateStudent(student.id, submitData);
      } else {
        await apiClient.createStudent(submitData);
      }

      onClose();
    } catch (err: any) {
      console.error('Failed to save student:', err);
      setError(err.response?.data?.detail || 'Failed to save student');
    } finally {
      setLoading(false);
    }
  };

  const Section = ({ title, name, children }: { title: string; name: string; children: React.ReactNode }) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => toggleSection(name)}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
      >
        <span className="font-medium text-gray-900 text-sm sm:text-base">{title}</span>
        <svg
          className={`h-5 w-5 text-gray-500 transition-transform ${expandedSections[name] ? 'transform rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expandedSections[name] && (
        <div className="px-4 py-4 bg-white">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full my-4 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 rounded-t-lg flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
              {student ? 'Edit Student' : 'Add New Student'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 p-1" type="button">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Basic Information */}
            <Section title="📋 Basic Information" name="basic">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 sm:grid sm:grid-cols-2 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Admission Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="admission_number"
                      value={formData.admission_number}
                      onChange={handleChange}
                      required
                      disabled={!!student}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Academic Year <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="academic_year_id"
                      value={formData.academic_year_id}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                    >
                      <option value="">Select Year</option>
                      {academicYears.map((year) => (
                        <option key={year.id} value={year.id}>
                          {year.name} {year.is_current ? '(Current)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Class <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="class_id"
                    value={formData.class_id}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} {cls.section}
                      </option>
                    ))}
                  </select>
                </div>

                {student && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="graduated">Graduated</option>
                    </select>
                  </div>
                )}
              </div>
            </Section>

            {/* Guardian Information */}
            <Section title="👨‍👩‍👧‍👦 Guardian Information" name="guardian">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Link to Guardian (Recommended for siblings)
                  </label>
                  <select
                    name="guardian_id"
                    value={formData.guardian_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  >
                    <option value="">No Guardian (Use fields below)</option>
                    {guardians.map((guardian) => (
                      <option key={guardian.id} value={guardian.id}>
                        {guardian.full_name} - {guardian.phone} ({guardian.relation})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Select existing guardian or fill in parent details below
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Parent/Guardian Name {!formData.guardian_id && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      name="parent_name"
                      value={formData.parent_name}
                      onChange={handleChange}
                      required={!formData.guardian_id}
                      disabled={!!formData.guardian_id}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone {!formData.guardian_id && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="tel"
                      name="parent_phone"
                      value={formData.parent_phone}
                      onChange={handleChange}
                      required={!formData.guardian_id}
                      disabled={!!formData.guardian_id}
                      placeholder="10-15 digits"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input
                      type="email"
                      name="parent_email"
                      value={formData.parent_email}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                    />
                  </div>
                </div>
              </div>
            </Section>

            {/* Government Compliance */}
            <Section title="🏛️ Government Compliance (RTE/CBSE)" name="government">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  >
                    <option value="">Select Category</option>
                    <option value="General">General</option>
                    <option value="SC">SC (Scheduled Caste)</option>
                    <option value="ST">ST (Scheduled Tribe)</option>
                    <option value="OBC">OBC (Other Backward Class)</option>
                    <option value="EWS">EWS (Economically Weaker Section)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Religion</label>
                  <input
                    type="text"
                    name="religion"
                    value={formData.religion}
                    onChange={handleChange}
                    placeholder="Hindu/Muslim/Christian/etc."
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Caste</label>
                  <input
                    type="text"
                    name="caste"
                    value={formData.caste}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Caste Certificate No.</label>
                  <input
                    type="text"
                    name="caste_certificate_number"
                    value={formData.caste_certificate_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Income Certificate No.</label>
                  <input
                    type="text"
                    name="income_certificate_number"
                    value={formData.income_certificate_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">BPL Card No.</label>
                  <input
                    type="text"
                    name="bpl_card_number"
                    value={formData.bpl_card_number}
                    onChange={handleChange}
                    placeholder="Below Poverty Line"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Aadhaar Number</label>
                  <input
                    type="text"
                    name="aadhaar_number"
                    value={formData.aadhaar_number}
                    onChange={handleChange}
                    placeholder="12-digit Aadhaar"
                    maxLength={12}
                    pattern="[0-9]{12}"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Blood Group</label>
                  <select
                    name="blood_group"
                    value={formData.blood_group}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
            </Section>

            {/* Scholarship & Concession */}
            <Section title="💰 Scholarship & Concession" name="scholarship">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Scholarship Type</label>
                  <input
                    type="text"
                    name="scholarship_type"
                    value={formData.scholarship_type}
                    onChange={handleChange}
                    placeholder="NMMSS/NMMS/Post-Matric/etc."
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Scholarship Amount (₹/month)</label>
                  <input
                    type="number"
                    name="scholarship_amount"
                    value={formData.scholarship_amount}
                    onChange={handleChange}
                    placeholder="Monthly amount"
                    min="0"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Concession (%)</label>
                  <input
                    type="number"
                    name="concession_percentage"
                    value={formData.concession_percentage}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    placeholder="0-100"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Concession Reason</label>
                  <input
                    type="text"
                    name="concession_reason"
                    value={formData.concession_reason}
                    onChange={handleChange}
                    placeholder="Merit/Sibling/Financial"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  />
                </div>
              </div>
            </Section>

            {/* Board Exam Information */}
            <Section title="📝 Board Exam Information (Class 10/12)" name="board">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Board Registration No.</label>
                  <input
                    type="text"
                    name="board_registration_number"
                    value={formData.board_registration_number}
                    onChange={handleChange}
                    placeholder="CBSE Registration Number"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Roll Number</label>
                  <input
                    type="text"
                    name="roll_number"
                    value={formData.roll_number}
                    onChange={handleChange}
                    placeholder="Class Roll Number"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  />
                </div>
              </div>
            </Section>

            {/* Fee Configuration */}
            <Section title="🏫 Fee Configuration" name="additional">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Transport Route</label>
                  <select
                    name="transport_route_id"
                    value={formData.transport_route_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  >
                    <option value="">No Transport</option>
                    {transportRoutes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.name} - ₹{(route.monthly_fee / 100).toFixed(0)}/month
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center pt-6">
                  <input
                    type="checkbox"
                    name="has_hostel"
                    checked={formData.has_hostel}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Hostel Facility
                  </label>
                </div>
              </div>
            </Section>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-4 rounded-b-lg flex-shrink-0">
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : (student ? 'Update Student' : 'Add Student')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
