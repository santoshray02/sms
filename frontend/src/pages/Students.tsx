import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { apiClient } from '../services/api';
import StudentFormEnhanced from '../components/StudentFormEnhanced';
import Table, { TableColumn } from '../components/Table';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import FormInput from '../components/FormInput';
import { useToast } from '../contexts/ToastContext';
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  SearchIcon,
  StudentsIcon,
  FilterIcon
} from '../components/Icons';
import { COLORS } from '../config/design-system';

interface Student {
  id: number;
  admission_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  class_id: number;
  class_name?: string;
  parent_name: string;
  parent_phone: string;
  parent_email?: string;
  status: string;
  transport_route_id?: number;
}

interface StudentListResponse {
  total: number;
  page: number;
  page_size: number;
  students: Student[];
}

type SortField = 'admission_number' | 'first_name' | 'last_name' | 'date_of_birth' | 'created_at';
type SortOrder = 'asc' | 'desc';

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState<number | ''>('');
  const [classes, setClasses] = useState<any[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [pageSize] = useState(50);

  // Sorting state
  const [sortBy, setSortBy] = useState<SortField>('admission_number');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  const toast = useToast();

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, [classFilter, currentPage, sortBy, sortOrder]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (classFilter) params.class_id = classFilter;
      if (searchTerm) params.search = searchTerm;

      const response: StudentListResponse = await apiClient.getStudents(params);

      setStudents(response.students || []);
      setTotalStudents(response.total || 0);
      setTotalPages(Math.ceil((response.total || 0) / pageSize));
    } catch (error: any) {
      console.error('Failed to fetch students:', error);
      toast.error(error.response?.data?.detail || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const data = await apiClient.getClasses();
      setClasses(data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const handleAdd = () => {
    setEditingStudent(null);
    setShowForm(true);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setShowForm(true);
  };

  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;

    try {
      setDeleting(true);
      await apiClient.deleteStudent(studentToDelete.id);
      toast.success(`Student ${studentToDelete.first_name} ${studentToDelete.last_name} deleted successfully`);
      setDeleteDialogOpen(false);
      setStudentToDelete(null);

      // If we're on a page that no longer exists after deletion, go back one page
      if (students.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchStudents();
      }
    } catch (error: any) {
      console.error('Failed to delete student:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete student');
    } finally {
      setDeleting(false);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingStudent(null);
    fetchStudents();
  };

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page on new search
    fetchStudents();
  };

  const handleSort = (field: string) => {
    const validSortFields: SortField[] = ['admission_number', 'first_name', 'last_name', 'date_of_birth', 'created_at'];

    if (validSortFields.includes(field as SortField)) {
      if (sortBy === field) {
        // Toggle sort order
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        // New field, default to ascending
        setSortBy(field as SortField);
        setSortOrder('asc');
      }
      setCurrentPage(1); // Reset to first page on sort change
    }
  };

  // Table columns definition
  const columns: TableColumn<Student>[] = [
    {
      key: 'admission_number',
      label: 'Admission No',
      sortable: true,
      align: 'left',
    },
    {
      key: 'name',
      label: 'Student Name',
      sortable: true,
      align: 'left',
      render: (student) => (
        <div>
          <div className="font-medium text-gray-900">
            {student.first_name} {student.last_name}
          </div>
          <div className="text-xs text-gray-500">{student.date_of_birth}</div>
        </div>
      ),
    },
    {
      key: 'class_name',
      label: 'Class',
      align: 'left',
      render: (student) => student.class_name || `Class ${student.class_id}`,
    },
    {
      key: 'gender',
      label: 'Gender',
      align: 'left',
    },
    {
      key: 'parent_contact',
      label: 'Parent Contact',
      align: 'left',
      render: (student) => (
        <div>
          <div className="text-sm text-gray-900">{student.parent_name}</div>
          <div className="text-xs text-gray-500">{student.parent_phone}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (student) => (
        <span
          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
            student.status === 'active'
              ? 'bg-green-100 text-green-800'
              : student.status === 'inactive'
              ? 'bg-gray-100 text-gray-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {student.status}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (student) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleEdit(student)}
            className="text-primary-600 hover:text-primary-900 transition-colors"
            title="Edit Student"
          >
            <EditIcon size={18} />
          </button>
          <button
            onClick={() => handleDeleteClick(student)}
            className="text-red-600 hover:text-red-900 transition-colors"
            title="Delete Student"
          >
            <TrashIcon size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Students Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage student records and enrollment ({totalStudents} total students)
            </p>
          </div>
          <Button
            variant="primary"
            icon={<PlusIcon size={16} />}
            onClick={handleAdd}
          >
            Add Student
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <FormInput
                label="Search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                placeholder="Search by name, admission no, or phone..."
                icon={<SearchIcon size={18} color={COLORS.gray[400]} />}
                helperText="Press Enter to search"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FilterIcon size={16} className="inline mr-1" />
                Filter by Class
              </label>
              <select
                value={classFilter}
                onChange={(e) => {
                  setClassFilter(e.target.value ? Number(e.target.value) : '');
                  setCurrentPage(1); // Reset to first page
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.section}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Students Table */}
        {loading ? (
          <Table
            columns={columns}
            data={[]}
            loading={true}
            skeletonRows={10}
          />
        ) : students.length === 0 ? (
          <div className="bg-white rounded-lg shadow">
            <EmptyState
              icon={<StudentsIcon size={64} color={COLORS.gray[400]} />}
              title="No Students Found"
              description={
                searchTerm || classFilter
                  ? "No students match your search criteria. Try adjusting your filters."
                  : "Get started by adding your first student to the system."
              }
              action={
                !searchTerm && !classFilter ? (
                  <Button
                    variant="primary"
                    icon={<PlusIcon size={16} />}
                    onClick={handleAdd}
                  >
                    Add First Student
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setClassFilter('');
                      setCurrentPage(1);
                    }}
                  >
                    Clear Filters
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <Table
            columns={columns}
            data={students}
            zebraStripe={true}
            hover={true}
            stickyHeader={true}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            pagination={{
              currentPage,
              totalPages,
              pageSize,
              totalItems: totalStudents,
              onPageChange: setCurrentPage,
            }}
          />
        )}
      </div>

      {/* Student Form Modal */}
      {showForm && (
        <StudentFormEnhanced
          student={editingStudent}
          classes={classes}
          onClose={handleFormClose}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {studentToDelete && (
        <ConfirmDialog
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setStudentToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Student"
          message={
            <>
              Are you sure you want to delete <strong>{studentToDelete.first_name} {studentToDelete.last_name}</strong> (
              {studentToDelete.admission_number})?
              <br />
              <br />
              This action cannot be undone. The student will be marked as inactive.
            </>
          }
          confirmText="Delete Student"
          variant="danger"
          loading={deleting}
        />
      )}
    </Layout>
  );
}
