import React, { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface DataTableProps {
  children: ReactNode;
  className?: string;
}

export function DataTable({ children, className }: DataTableProps) {
  return (
    <div className={twMerge("w-full overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg", className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
          {children}
        </table>
      </div>
    </div>
  );
}

interface DataTableHeaderProps {
  children: ReactNode;
  className?: string;
}

export function DataTableHeader({ children, className }: DataTableHeaderProps) {
  return (
    <thead className={twMerge("bg-gray-50 dark:bg-gray-800", className)}>
      {children}
    </thead>
  );
}

interface DataTableBodyProps {
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
  loadingRows?: number;
  colSpan?: number;
  emptyMessage?: string;
}

export function DataTableBody({ 
  children, 
  className, 
  isLoading = false, 
  loadingRows = 5,
  colSpan = 7,
  emptyMessage = "No data available"
}: DataTableBodyProps) {
  if (isLoading) {
    return (
      <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
        {[...Array(loadingRows)].map((_, index) => (
          <tr key={`loading-${index}`}>
            {[...Array(colSpan)].map((_, cellIndex) => (
              <td key={`loading-cell-${cellIndex}`} className="whitespace-nowrap px-3 py-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  }

  // Check if children is empty or null
  const hasChildren = React.Children.count(children) > 0;

  if (!hasChildren) {
    return (
      <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
        <tr>
          <td colSpan={colSpan} className="py-10 text-center text-gray-500 dark:text-gray-400">
            <p>{emptyMessage}</p>
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className={twMerge("divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900", className)}>
      {children}
    </tbody>
  );
}

interface DataTableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function DataTableRow({ children, className, onClick }: DataTableRowProps) {
  return (
    <tr 
      className={twMerge(
        "hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors", 
        onClick ? "cursor-pointer" : "",
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

interface DataTableCellProps {
  children: ReactNode;
  className?: string;
  header?: boolean;
}

export function DataTableCell({ children, className, header = false }: DataTableCellProps) {
  if (header) {
    return (
      <th className={twMerge(
        "py-3 pl-3 pr-3 text-center text-sm font-semibold text-gray-900 dark:text-gray-200 sm:pl-3",
        className
      )}>
        {children}
      </th>
    );
  }

  return (
    <td className={twMerge(
      "whitespace-nowrap px-3 py-4 text-sm text-gray-600 dark:text-gray-300",
      className
    )}>
      {children}
    </td>
  );
}

// Export named components
export const Table = {
  Root: DataTable,
  Header: DataTableHeader,
  Body: DataTableBody,
  Row: DataTableRow,
  Cell: DataTableCell,
};