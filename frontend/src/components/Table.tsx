import { ReactNode } from 'react';
import { COLORS, SPACING, BORDER_RADIUS, TRANSITIONS } from '../config/design-system';
import EmptyState from './EmptyState';

export interface TableColumn<T = any> {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  render?: (value: any, row: T, index: number) => ReactNode;
  sortable?: boolean;
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyState?: {
    title: string;
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  stickyHeader?: boolean;
  zebraStripe?: boolean;
  hover?: boolean;
  onRowClick?: (row: T, index: number) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
  };
}

function Table<T = any>({
  columns,
  data,
  loading = false,
  emptyState,
  stickyHeader = true,
  zebraStripe = true,
  hover = true,
  onRowClick,
  sortBy,
  sortOrder,
  onSort,
  pagination,
}: TableProps<T>) {
  const getColumnAlignment = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'center';
      case 'right':
        return 'right';
      default:
        return 'left';
    }
  };

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead
            style={{
              backgroundColor: COLORS.gray[50],
              borderBottom: `2px solid ${COLORS.gray[200]}`,
            }}
          >
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding: '12px 16px',
                    textAlign: getColumnAlignment(col.align),
                    fontSize: '12px',
                    fontWeight: 600,
                    color: COLORS.gray[700],
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: col.width,
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: '16px',
                      borderBottom: `1px solid ${COLORS.gray[200]}`,
                    }}
                  >
                    <div
                      style={{
                        height: '16px',
                        backgroundColor: COLORS.gray[200],
                        borderRadius: BORDER_RADIUS.base,
                        animation: 'pulse 2s ease-in-out infinite',
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return emptyState ? (
      <EmptyState
        title={emptyState.title}
        description={emptyState.description}
        action={emptyState.action}
        variant="default"
      />
    ) : (
      <div style={{ padding: '48px', textAlign: 'center', color: COLORS.gray[500] }}>
        No data available
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto" style={{ borderRadius: BORDER_RADIUS.lg }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead
            style={{
              backgroundColor: COLORS.gray[50],
              borderBottom: `2px solid ${COLORS.primary[500]}`,
              position: stickyHeader ? 'sticky' : 'static',
              top: 0,
              zIndex: 10,
            }}
          >
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && onSort?.(col.key)}
                  style={{
                    padding: '12px 16px',
                    textAlign: getColumnAlignment(col.align),
                    fontSize: '12px',
                    fontWeight: 600,
                    color: COLORS.gray[700],
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: col.width,
                    cursor: col.sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: col.align === 'center' ? 'center' : col.align === 'right' ? 'flex-end' : 'flex-start',
                    gap: '4px'
                  }}>
                    <span>{col.label}</span>
                    {col.sortable && (
                      <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: '4px' }}>
                        {sortBy === col.key ? (
                          sortOrder === 'asc' ? (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                              <path d="M6 3l4 5H2z" />
                            </svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                              <path d="M6 9l4-5H2z" />
                            </svg>
                          )
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill={COLORS.gray[400]}>
                            <path d="M6 3l2 2.5H4z" />
                            <path d="M6 9l2-2.5H4z" />
                          </svg>
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                style={{
                  backgroundColor: zebraStripe && rowIndex % 2 === 1 ? COLORS.gray[50] : COLORS.white,
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: `all ${TRANSITIONS.fast}`,
                }}
                onClick={() => onRowClick?.(row, rowIndex)}
                onMouseEnter={(e) => {
                  if (hover) {
                    e.currentTarget.style.backgroundColor = COLORS.gray[100];
                  }
                }}
                onMouseLeave={(e) => {
                  if (hover) {
                    e.currentTarget.style.backgroundColor =
                      zebraStripe && rowIndex % 2 === 1 ? COLORS.gray[50] : COLORS.white;
                  }
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: '16px',
                      textAlign: getColumnAlignment(col.align),
                      fontSize: '14px',
                      color: COLORS.gray[900],
                      borderBottom: `1px solid ${COLORS.gray[200]}`,
                    }}
                  >
                    {col.render
                      ? col.render((row as any)[col.key], row, rowIndex)
                      : (row as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderTop: `1px solid ${COLORS.gray[200]}`,
            backgroundColor: COLORS.white,
          }}
        >
          {/* Items info */}
          <div style={{ fontSize: '14px', color: COLORS.gray[600] }}>
            Showing{' '}
            <strong>
              {Math.min((pagination.currentPage - 1) * pagination.pageSize + 1, pagination.totalItems)}
            </strong>{' '}
            to{' '}
            <strong>
              {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)}
            </strong>{' '}
            of <strong>{pagination.totalItems}</strong> results
          </div>

          {/* Page controls */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              style={{
                padding: '8px 12px',
                fontSize: '14px',
                fontWeight: 500,
                color: pagination.currentPage === 1 ? COLORS.gray[400] : COLORS.gray[700],
                backgroundColor: COLORS.white,
                border: `1px solid ${COLORS.gray[300]}`,
                borderRadius: BORDER_RADIUS.base,
                cursor: pagination.currentPage === 1 ? 'not-allowed' : 'pointer',
                transition: `all ${TRANSITIONS.base}`,
              }}
              onMouseEnter={(e) => {
                if (pagination.currentPage !== 1) {
                  e.currentTarget.style.backgroundColor = COLORS.gray[50];
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.white;
              }}
            >
              Previous
            </button>

            {/* Page numbers */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                const pageNum = i + 1;
                const isActive = pageNum === pagination.currentPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => pagination.onPageChange(pageNum)}
                    style={{
                      width: '36px',
                      height: '36px',
                      fontSize: '14px',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? COLORS.white : COLORS.gray[700],
                      backgroundColor: isActive ? COLORS.primary[500] : COLORS.white,
                      border: `1px solid ${isActive ? COLORS.primary[500] : COLORS.gray[300]}`,
                      borderRadius: BORDER_RADIUS.base,
                      cursor: 'pointer',
                      transition: `all ${TRANSITIONS.base}`,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = COLORS.gray[50];
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = COLORS.white;
                      }
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              style={{
                padding: '8px 12px',
                fontSize: '14px',
                fontWeight: 500,
                color:
                  pagination.currentPage === pagination.totalPages
                    ? COLORS.gray[400]
                    : COLORS.gray[700],
                backgroundColor: COLORS.white,
                border: `1px solid ${COLORS.gray[300]}`,
                borderRadius: BORDER_RADIUS.base,
                cursor:
                  pagination.currentPage === pagination.totalPages ? 'not-allowed' : 'pointer',
                transition: `all ${TRANSITIONS.base}`,
              }}
              onMouseEnter={(e) => {
                if (pagination.currentPage !== pagination.totalPages) {
                  e.currentTarget.style.backgroundColor = COLORS.gray[50];
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.white;
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;
