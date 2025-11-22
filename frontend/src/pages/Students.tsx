import { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from '@tanstack/react-table';
import Layout from '../components/Layout';
import { apiClient } from '../services/api';
import StudentFormEnhanced from '../components/StudentFormEnhanced';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../contexts/ToastContext';
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  SearchIcon,
  StudentsIcon,
} from '../components/Icons';

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
  computed_section?: string;
  average_marks?: number;
  attendance_percentage?: number;
}

export default function StudentsWithTanStack() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [classes, setClasses] = useState<any[]>([]);

  // TanStack Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  // View student details
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const toast = useToast();

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getStudents({ page_size: 100 });
      setStudents(response.students || []);
    } catch (error: any) {
      console.error('Failed to fetch students:', error);
      toast.error('Failed to fetch students');
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

  const handleView = (student: Student) => {
    setViewingStudent(student);
    setShowViewModal(true);
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
      toast.success(`Student deleted successfully`);
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
      fetchStudents();
    } catch (error: any) {
      console.error('Failed to delete student:', error);
      toast.error('Failed to delete student');
    } finally {
      setDeleting(false);
    }
  };

  // Define columns with TanStack Table
  const columns = useMemo<ColumnDef<Student>[]>(
    () => [
      {
        accessorKey: 'admission_number',
        header: 'Admission No',
        cell: info => info.getValue(),
        enableSorting: true,
      },
      {
        accessorFn: row => `${row.first_name} ${row.last_name}`,
        id: 'name',
        header: 'Student Name',
        cell: info => (
          <div>
            <div className="font-medium text-gray-900">{info.getValue() as string}</div>
            <div className="text-xs text-gray-500">{info.row.original.date_of_birth}</div>
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'class_name',
        header: 'Class',
        cell: info => info.getValue() || `Class ${info.row.original.class_id}`,
        enableSorting: true,
      },
      {
        accessorKey: 'computed_section',
        header: 'Section',
        cell: info => (
          <div className="text-center">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-800 font-semibold text-sm">
              {info.getValue() as string || '-'}
            </span>
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'gender',
        header: 'Gender',
        cell: info => info.getValue(),
        enableSorting: true,
      },
      {
        accessorFn: row => ({ name: row.parent_name, phone: row.parent_phone }),
        id: 'parent_contact',
        header: 'Parent Contact',
        cell: info => {
          const value = info.getValue() as { name: string; phone: string };
          return (
            <div>
              <div className="text-sm text-gray-900">{value.name}</div>
              <div className="text-xs text-gray-500">{value.phone}</div>
            </div>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: info => (
          <span
            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
              info.getValue() === 'active'
                ? 'bg-green-100 text-green-800'
                : info.getValue() === 'inactive'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {info.getValue() as string}
          </span>
        ),
        enableSorting: true,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: info => (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => handleView(info.row.original)}
              className="text-gray-600 hover:text-gray-900 transition-colors"
              title="View Details"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
            <button
              onClick={() => handleEdit(info.row.original)}
              className="text-primary-600 hover:text-primary-900 transition-colors"
              title="Edit Student"
            >
              <EditIcon size={18} />
            </button>
            <button
              onClick={() => handleDeleteClick(info.row.original)}
              className="text-red-600 hover:text-red-900 transition-colors"
              title="Delete Student"
            >
              <TrashIcon size={18} />
            </button>
          </div>
        ),
        enableSorting: false,
      },
    ],
    []
  );

  const table = useReactTable({
    data: students,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Students Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage student records ({table.getFilteredRowModel().rows.length} students)
            </p>
          </div>
          <div className="flex gap-3">
            {/* Column Visibility Toggle */}
            <div className="inline-flex">
              <button
                onClick={() => {
                  const isAllVisible = table.getIsAllColumnsVisible();
                  table.toggleAllColumnsVisible(!isAllVisible);
                }}
                className="px-4 py-2 border border-gray-300 rounded-l-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                {table.getIsAllColumnsVisible() ? 'Hide' : 'Show'} All
              </button>
              <div className="relative">
                <details className="group">
                  <summary className="px-4 py-2 border border-l-0 border-gray-300 rounded-r-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer list-none">
                    Columns ▼
                  </summary>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                    <div className="py-1 max-h-96 overflow-y-auto">
                      {table.getAllLeafColumns().filter(col => col.id !== 'actions').map(column => (
                        <label key={column.id} className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={column.getIsVisible()}
                            onChange={column.getToggleVisibilityHandler()}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <span className="ml-3 text-sm text-gray-700">{column.columnDef.header as string}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </details>
              </div>
            </div>

            <Button variant="primary" icon={<PlusIcon size={16} />} onClick={() => setShowForm(true)}>
              Add Student
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <SearchIcon size={18} className="text-gray-400" />
            <input
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Search students..."
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-2">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span>
                              {{
                                asc: ' 🔼',
                                desc: ' 🔽',
                              }[header.column.getIsSorted() as string] ?? ' ⇅'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                      Loading students...
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-12 text-center">
                      <StudentsIcon size={48} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">No students found</p>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)}
                  </span>{' '}
                  of <span className="font-medium">{table.getFilteredRowModel().rows.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    ««
                  </button>
                  <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    «
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                  </span>
                  <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    »
                  </button>
                  <button
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    »»
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Form Modal */}
      {showForm && (
        <StudentFormEnhanced student={editingStudent} classes={classes} onClose={() => { setShowForm(false); setEditingStudent(null); fetchStudents(); }} />
      )}

      {/* View Student Modal - Same as before */}
      {viewingStudent && showViewModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Student Details</h3>
              <button onClick={() => { setShowViewModal(false); setViewingStudent(null); }} className="text-gray-400 hover:text-gray-500">
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Admission No</label>
                  <p className="text-sm text-gray-900">{viewingStudent.admission_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-sm text-gray-900">{viewingStudent.first_name} {viewingStudent.last_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Class</label>
                  <p className="text-sm text-gray-900">{viewingStudent.class_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Section</label>
                  <p className="text-sm text-gray-900">{viewingStudent.computed_section || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Gender</label>
                  <p className="text-sm text-gray-900">{viewingStudent.gender}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-sm text-gray-900">{viewingStudent.status}</p>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button
                  onClick={() => { setShowViewModal(false); setViewingStudent(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => { setShowViewModal(false); handleEdit(viewingStudent); }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {studentToDelete && (
        <ConfirmDialog
          isOpen={deleteDialogOpen}
          onClose={() => { setDeleteDialogOpen(false); setStudentToDelete(null); }}
          onConfirm={handleDeleteConfirm}
          title="Delete Student"
          message={`Are you sure you want to delete ${studentToDelete.first_name} ${studentToDelete.last_name}?`}
          confirmText="Delete"
          variant="danger"
          loading={deleting}
        />
      )}
    </Layout>
  );
}
