"use client";

import React from 'react';
import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';

export interface Column<T> {
  header: string;
  key: string;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  sortConfig?: { key: string; direction: 'asc' | 'desc' } | null;
  onSort?: (key: string) => void;
  className?: string;
  rowKey?: (item: T, index: number) => string | number;
  onRowClick?: (item: T, index: number) => void;
}

const DataTable = <T extends any>({
  data,
  columns,
  loading = false,
  emptyMessage = '데이터가 없습니다.',
  sortConfig = null,
  onSort,
  className = '',
  rowKey = (_, index) => index,
  onRowClick,
  }: DataTableProps<T>) => {
  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown size={12} className="sort-icon inactive" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={12} className="sort-icon active" /> : <ChevronDown size={12} className="sort-icon active" />;
  };

  const handleRowClick = (item: T, index: number, e: React.MouseEvent) => {
    // Don't trigger row click if clicking on an interactive element (button, link, menu)
    const target = e.target as HTMLElement;
    if (target.closest('button, a, .action-dropdown, .actions-cell')) {
      return;
    }
    onRowClick?.(item, index);
  };

  return (
    <div className={`table-responsive ${className}`}>
      <table className="customer-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                onClick={() => column.sortable && onSort?.(column.key)}
                className={column.sortable ? 'sortable' : ''}
                style={{ textAlign: column.align, width: column.width }}
              >
                <div className="th-content">
                  {column.header}
                  {column.sortable && getSortIcon(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '3rem' }}>
                로딩 중...
              </td>
            </tr>
          ) : data.length > 0 ? (
            data.map((item, index) => (
              <tr 
                key={rowKey(item, index)}
                onClick={(e) => handleRowClick(item, index, e)}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                className={onRowClick ? 'clickable-row' : ''}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    style={{ textAlign: column.align }}
                    className={column.className}
                  >
                    {column.render ? column.render(item, index) : (item as any)[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                <div className="empty-state">
                  <p>{emptyMessage}</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
