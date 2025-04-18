import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';
import { twMerge } from 'tailwind-merge';

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, lastPage, onPageChange, className = '' }: PaginationProps) {
  // Don't render pagination if we only have one page
  if (lastPage <= 1) {
    return null;
  }

  // Calculate which page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    
    // Always include first and last page
    // For small page counts, show all pages
    if (lastPage <= 7) {
      for (let i = 1; i <= lastPage; i++) {
        pages.push(i);
      }
    } else {
      // For large page counts, show a window around current page
      pages.push(1);
      
      // If current page is close to start
      if (currentPage <= 4) {
        pages.push(2, 3, 4, 5);
        pages.push('ellipsis');
      } 
      // If current page is close to end
      else if (currentPage >= lastPage - 3) {
        pages.push('ellipsis');
        pages.push(lastPage - 4, lastPage - 3, lastPage - 2, lastPage - 1);
      } 
      // If current page is in the middle
      else {
        pages.push('ellipsis');
        pages.push(currentPage - 1, currentPage, currentPage + 1);
        pages.push('ellipsis');
      }
      
      pages.push(lastPage);
    }
    
    return pages;
  };

  return (
    <nav className={twMerge("flex justify-center mt-5 space-x-1", className)}>
      {/* Previous page button */}
      <button
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={twMerge(
          "flex h-9 w-9 items-center justify-center rounded-md border text-sm",
          currentPage === 1 
            ? "border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500" 
            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous Page</span>
      </button>

      {/* Page numbers */}
      {getPageNumbers().map((page, idx) => 
        page === 'ellipsis' ? (
          <span 
            key={`ellipsis-${idx}`}
            className="flex h-9 w-9 items-center justify-center text-gray-500 dark:text-gray-400"
          >
            ...
          </span>
        ) : (
          <button
            key={`page-${page}`}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            className={twMerge(
              "flex h-9 w-9 items-center justify-center rounded-md border text-sm transition-colors",
              page === currentPage 
                ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500" 
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            )}
          >
            {page}
          </button>
        )
      )}

      {/* Next page button */}
      <button
        onClick={() => currentPage < lastPage && onPageChange(currentPage + 1)}
        disabled={currentPage === lastPage}
        className={twMerge(
          "flex h-9 w-9 items-center justify-center rounded-md border text-sm",
          currentPage === lastPage 
            ? "border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500" 
            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        )}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next Page</span>
      </button>
    </nav>
  );
}

// For Inertia-specific pagination with links
interface InertiaPaginationProps {
  links: {
    url: string | null;
    label: string;
    active: boolean;
  }[];
  className?: string;
}

export function InertiaPagination({ links, className = '' }: InertiaPaginationProps) {
  // Don't render pagination if we have too few pages
  if (links.length <= 3) {
    return null;
  }

  return (
    <nav className={twMerge("flex justify-center mt-5 space-x-1", className)}>
      {links.map((link, i) => {
        // Skip the "..." items if they don't have URLs
        if (!link.url && link.label.includes('...')) {
          return (
            <span key={i} className="flex h-9 w-9 items-center justify-center text-gray-500 dark:text-gray-400">
              ...
            </span>
          );
        }

        // For previous/next links
        const isChevron = link.label.includes('Previous') || link.label.includes('Next');

        return link.url === null ? (
          <span
            key={i}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500"
          >
            {isChevron ? (
              link.label.includes('Previous') ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <span dangerouslySetInnerHTML={{ __html: link.label }}></span>
            )}
          </span>
        ) : (
          <Link
            key={i}
            href={link.url}
            className={twMerge(
              "flex h-9 w-9 items-center justify-center rounded-md border text-sm transition-colors",
              link.active
                ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            )}
          >
            {isChevron ? (
              link.label.includes('Previous') ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <span dangerouslySetInnerHTML={{ __html: link.label }}></span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}