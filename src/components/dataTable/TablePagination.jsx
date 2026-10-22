/* eslint-disable react/prop-types */
import { Pagination } from '@openedx/paragon';
import './DataTable.scss';

/**
 * Shared Paragon pagination with global `data-table__pagination` styles.
 * Renders nothing when `totalPages <= 1`.
 */
export const TablePagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  paginationLabel = 'Table pagination',
}) => {
  if (!totalPages || totalPages <= 1) {
    return null;
  }

  return (
    <Pagination
      className="data-table__pagination"
      paginationLabel={paginationLabel}
      pageCount={totalPages}
      currentPage={currentPage}
      onPageSelect={onPageChange}
    />
  );
};

/**
 * Footer row with optional summary + reusable centered pagination.
 * Pagination controls render only when `totalPages > 1`.
 * The summary (`footerContent`) renders whenever it is provided, including single-page lists.
 */
export const TablePaginationFooter = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  paginationLabel = 'Table pagination',
  footerContent = null,
}) => {
  const showPagination = totalPages > 1;
  const hasFooterContent = footerContent != null && footerContent !== '';

  if (!showPagination && !hasFooterContent) {
    return null;
  }

  return (
    <div className={`data-table__footer${showPagination ? ' data-table__footer--paginated' : ''}`}>
      {hasFooterContent ? (
        <div className="data-table__footer-summary">{footerContent}</div>
      ) : (
        <div className="data-table__footer-summary" aria-hidden="true" />
      )}
      {showPagination && (
        <div className="data-table__footer-pagination">
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            paginationLabel={paginationLabel}
          />
        </div>
      )}
      {/* Balance column so pagination stays visually centered when summary is present */}
      {showPagination && <div className="data-table__footer-spacer" aria-hidden="true" />}
    </div>
  );
};

export default TablePagination;
