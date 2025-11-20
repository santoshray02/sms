import axios, { AxiosInstance, AxiosError } from 'axios';

// Dynamically construct API URL based on current hostname
const getApiBaseUrl = () => {
  // If explicitly set via environment variable, use it
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Otherwise, construct dynamically based on current location
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = import.meta.env.VITE_BACKEND_PORT || '10221';

  return `${protocol}//${hostname}:${port}/api/v1`;
};

const API_BASE_URL = getApiBaseUrl();

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(username: string, password: string) {
    const response = await this.client.post('/auth/login', { username, password });
    const { access_token } = response.data;
    localStorage.setItem('access_token', access_token);
    return response.data;
  }

  async logout() {
    await this.client.post('/auth/logout');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  }

  // Students
  async getStudents(params?: {
    page?: number;
    page_size?: number;
    class_id?: number;
    academic_year_id?: number;
    status?: string;
    search?: string;
  }) {
    const response = await this.client.get('/students', { params });
    return response.data;
  }

  async getStudent(id: number) {
    const response = await this.client.get(`/students/${id}`);
    return response.data;
  }

  async createStudent(data: any) {
    const response = await this.client.post('/students', data);
    return response.data;
  }

  async updateStudent(id: number, data: any) {
    const response = await this.client.put(`/students/${id}`, data);
    return response.data;
  }

  async deleteStudent(id: number) {
    await this.client.delete(`/students/${id}`);
  }

  // Academic Setup
  async getAcademicYears() {
    const response = await this.client.get('/academic/academic-years');
    return response.data;
  }

  async getClasses() {
    const response = await this.client.get('/academic/classes');
    return response.data;
  }

  async getTransportRoutes() {
    const response = await this.client.get('/academic/transport-routes');
    return response.data;
  }

  // Fees
  async getFeeStructures(params?: { class_id?: number; academic_year_id?: number }) {
    const response = await this.client.get('/fees/structures', { params });
    return response.data;
  }

  async createFeeStructure(data: {
    class_id: number;
    academic_year_id: number;
    tuition_fee: number;
    hostel_fee: number;
  }) {
    const response = await this.client.post('/fees/structures', data);
    return response.data;
  }

  async updateFeeStructure(id: number, data: {
    tuition_fee: number;
    hostel_fee: number;
  }) {
    const response = await this.client.put(`/fees/structures/${id}`, data);
    return response.data;
  }

  async generateMonthlyFees(data: {
    academic_year_id: number;
    month: number;
    year: number;
    due_day?: number;
  }) {
    const response = await this.client.post('/fees/generate-monthly', data);
    return response.data;
  }

  async getMonthlyFees(params?: {
    student_id?: number;
    academic_year_id?: number;
    month?: number;
    year?: number;
    status?: string;
  }) {
    const response = await this.client.get('/fees/monthly', { params });
    return response.data;
  }

  // Payments
  async createPayment(data: {
    monthly_fee_id: number;
    student_id: number;
    amount: number;
    payment_mode: string;
    payment_date: string;
    transaction_id?: string;
    notes?: string;
  }) {
    const response = await this.client.post('/payments', data);
    return response.data;
  }

  async getPayments(params?: { page?: number; page_size?: number; student_id?: number }) {
    const response = await this.client.get('/payments', { params });
    return response.data;
  }

  // Reports
  async getCollectionSummary(params?: {
    academic_year_id?: number;
    month?: number;
    year?: number;
  }) {
    const response = await this.client.get('/reports/collections', { params });
    return response.data;
  }

  async getDefaulters(params?: { academic_year_id?: number }) {
    const response = await this.client.get('/reports/defaulters', { params });
    return response.data;
  }

  async getClassWiseReport(params: {
    academic_year_id: number;
    month?: number;
    year?: number;
  }) {
    const response = await this.client.get('/reports/class-wise', { params });
    return response.data;
  }

  async getSMSLogs(params?: { sms_type?: string; status?: string; limit?: number }) {
    const response = await this.client.get('/reports/sms-logs', { params });
    return response.data;
  }

  // Guardians
  async getGuardians(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    is_active?: boolean;
  }) {
    const response = await this.client.get('/guardians', { params });
    return response.data;
  }

  async getGuardian(id: number) {
    const response = await this.client.get(`/guardians/${id}`);
    return response.data;
  }

  async getGuardianStudents(id: number) {
    const response = await this.client.get(`/guardians/${id}/students`);
    return response.data;
  }

  async createGuardian(data: any) {
    const response = await this.client.post('/guardians', data);
    return response.data;
  }

  async updateGuardian(id: number, data: any) {
    const response = await this.client.put(`/guardians/${id}`, data);
    return response.data;
  }

  async deleteGuardian(id: number) {
    await this.client.delete(`/guardians/${id}`);
  }

  // Streams
  async getStreams(is_active?: boolean) {
    const params = is_active !== undefined ? { is_active } : {};
    const response = await this.client.get('/streams', { params });
    return response.data;
  }

  async getStream(id: number) {
    const response = await this.client.get(`/streams/${id}`);
    return response.data;
  }

  async createStream(data: any) {
    const response = await this.client.post('/streams', data);
    return response.data;
  }

  async updateStream(id: number, data: any) {
    const response = await this.client.put(`/streams/${id}`, data);
    return response.data;
  }

  async deleteStream(id: number) {
    await this.client.delete(`/streams/${id}`);
  }

  // Concessions
  async getConcessions(params?: {
    page?: number;
    page_size?: number;
    student_id?: number;
    concession_type?: string;
    is_active?: boolean;
  }) {
    const response = await this.client.get('/concessions', { params });
    return response.data;
  }

  async getActiveConcessions(params?: { page?: number; page_size?: number }) {
    const response = await this.client.get('/concessions/active', { params });
    return response.data;
  }

  async getStudentConcessions(studentId: number, includeExpired?: boolean) {
    const params = includeExpired ? { include_expired: true } : {};
    const response = await this.client.get(`/concessions/student/${studentId}`, { params });
    return response.data;
  }

  async getConcession(id: number) {
    const response = await this.client.get(`/concessions/${id}`);
    return response.data;
  }

  async createConcession(data: any) {
    const response = await this.client.post('/concessions', data);
    return response.data;
  }

  async updateConcession(id: number, data: any) {
    const response = await this.client.put(`/concessions/${id}`, data);
    return response.data;
  }

  async deleteConcession(id: number) {
    await this.client.delete(`/concessions/${id}`);
  }

  // Attendance
  async getAttendance(params?: {
    page?: number;
    page_size?: number;
    student_id?: number;
    class_id?: number;
    date_from?: string;
    date_to?: string;
    status?: string;
  }) {
    const response = await this.client.get('/attendance', { params });
    return response.data;
  }

  async getAttendanceByDate(date: string, classId?: number) {
    const params = classId ? { class_id: classId } : {};
    const response = await this.client.get(`/attendance/date/${date}`, { params });
    return response.data;
  }

  async getStudentAttendancePercentage(
    studentId: number,
    params?: { date_from?: string; date_to?: string }
  ) {
    const response = await this.client.get(`/attendance/student/${studentId}/percentage`, {
      params,
    });
    return response.data;
  }

  async createAttendance(data: any) {
    const response = await this.client.post('/attendance', data);
    return response.data;
  }

  async createBulkAttendance(data: {
    class_id: number;
    date: string;
    marked_by: number;
    attendance_data: Array<{ student_id: number; status: string; remarks?: string }>;
  }) {
    const response = await this.client.post('/attendance/bulk', data);
    return response.data;
  }

  async updateAttendance(id: number, data: any) {
    const response = await this.client.put(`/attendance/${id}`, data);
    return response.data;
  }

  async deleteAttendance(id: number) {
    await this.client.delete(`/attendance/${id}`);
  }

  // System Settings
  async getSystemSettings() {
    const response = await this.client.get('/settings/');
    return response.data;
  }

  async updateSchoolSettings(data: {
    school_name?: string;
    school_code?: string;
    affiliation_number?: string;
    school_address?: string;
    principal_name?: string;
    principal_signature_url?: string;
    school_logo_url?: string;
  }) {
    const response = await this.client.put('/settings/school', data);
    return response.data;
  }

  async updateSMSSettings(data: {
    sms_provider?: string;
    sms_api_key?: string;
    sms_sender_id?: string;
    sms_balance?: number;
    sms_enabled?: boolean;
  }) {
    const response = await this.client.put('/settings/sms', data);
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
