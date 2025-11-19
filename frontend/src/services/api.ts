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
}

export const apiClient = new ApiClient();
export default apiClient;
