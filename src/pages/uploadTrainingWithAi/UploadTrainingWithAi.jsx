/* eslint-disable react/prop-types */
import { useIntl } from '@edx/frontend-platform/i18n';
import {
  faCloudUploadAlt,
  faFileAlt,
  faListUl,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AITrainingCreate from './AITrainingCreate';
import { fileTypeFromName, formatUploadedAt } from '../../api/aiTraining/aiTrainingUtils';
import { DataTable } from '../../components/dataTable';
import { EmptyState } from '../../components/emptyState';
import { SkeletonScreen, SKELETON_VARIANTS } from '../../components/skeleton';
import { useToast } from '../../components/toast/ToastProvider';
import useImportHistory from '../../hooks/aiTraining/useImportHistory';
import { ADMIN_PATHS } from '../../utils/adminPaths';
import { hasDisplayValue } from '../../utils/hasDisplayValue';
import { buildPaginationShowingParams } from '../../utils/paginationUtils';
import messages from './messages';
import './UploadTrainingWithAi.scss';

const UploadTrainingWithAi = () => {
  const [searchParams] = useSearchParams();
  const reviewJobId = searchParams.get('job');
  if (hasDisplayValue(reviewJobId)) {
    return <AITrainingCreate />;
  }
  return <UploadTrainingHistory />;
};

const UploadTrainingHistory = () => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const {
    rows,
    count,
    totalPages,
    pageSize,
    isLoading,
    isError,
    errorMessage,
    refetch,
  } = useImportHistory({ page });

  useEffect(() => {
    if (isError) {
      showToast({
        title: formatMessage(messages.loadErrorTitle),
        description: hasDisplayValue(errorMessage)
          ? errorMessage
          : formatMessage(messages.loadErrorFallback),
      });
    }
  }, [isError, errorMessage, formatMessage, showToast]);

  const goToNewUpload = () => navigate(ADMIN_PATHS.uploadTrainingWithAiNew);
  const goToReview = (jobId) => {
    if (!hasDisplayValue(jobId)) return;
    navigate(ADMIN_PATHS.uploadTrainingWithAiJob(jobId));
  };

  const handlePageChange = (nextPage) => {
    const numeric = Number(nextPage);
    if (Number.isFinite(numeric) && numeric >= 1) {
      setPage(numeric);
    }
  };

  const showInitialSkeleton = isLoading && rows.length === 0;

  const tableRows = useMemo(
    () => rows
      .filter((row) => hasDisplayValue(row.job_id))
      .map((row, index) => ({
        ...row,
        rowIndex: ((page - 1) * pageSize) + index + 1,
      })),
    [page, pageSize, rows],
  );

  const columns = useMemo(() => [
    {
      key: 'rowIndex',
      header: formatMessage(messages.columnIndex),
      renderCell: (row) => row.rowIndex,
    },
    {
      key: 'file_name',
      header: formatMessage(messages.columnDocumentName),
      renderCell: (row) => (
        <div className="upload-training-ai-page__doc-name">
          <FontAwesomeIcon icon={faFileAlt} aria-hidden />
          {hasDisplayValue(row.file_name) && <span>{row.file_name}</span>}
        </div>
      ),
    },
    {
      key: 'type',
      header: formatMessage(messages.columnType),
      renderCell: (row) => (
        hasDisplayValue(fileTypeFromName(row.file_name)) && (
          <span className="upload-training-ai-page__type">
            {fileTypeFromName(row.file_name)}
          </span>
        )
      ),
    },
    {
      key: 'uploaded_at',
      header: formatMessage(messages.columnUploadedAt),
      renderCell: (row) => (
        hasDisplayValue(formatUploadedAt(row.uploaded_at)) && (
          <span className="upload-training-ai-page__nowrap">
            {formatUploadedAt(row.uploaded_at)}
          </span>
        )
      ),
    },
    {
      key: 'total_records',
      header: formatMessage(messages.columnRecords),
      renderCell: (row) => Number(row.total_records ?? 0).toLocaleString(),
    },
    {
      key: 'created',
      header: formatMessage(messages.columnCreated),
      renderCell: (row) => Number(row.created ?? 0).toLocaleString(),
    },
    {
      key: 'actions',
      header: formatMessage(messages.columnActions),
      renderCell: (row) => (
        row.status === 'completed' ? (
          <button
            type="button"
            className="upload-training-ai-page__ghost-btn"
            onClick={() => goToReview(row.job_id)}
          >
            <FontAwesomeIcon icon={faListUl} aria-hidden />
            <span>{formatMessage(messages.reviewTrainings)}</span>
          </button>
        ) : null
      ),
    },
  ], [formatMessage]);

  return (
    <section className="upload-training-ai-page">
      <div className="upload-training-ai-page__header">
        <div>
          <h2 className="upload-training-ai-page__title">{formatMessage(messages.uploadedDocumentsTitle)}</h2>
          <p className="upload-training-ai-page__subtitle">{formatMessage(messages.uploadedDocumentsSubtitle)}</p>
        </div>
        <button type="button" className="upload-training-ai-page__primary-btn" onClick={goToNewUpload}>
          <FontAwesomeIcon icon={faCloudUploadAlt} aria-hidden />
          <span>{formatMessage(messages.uploadDocumentButton)}</span>
        </button>
      </div>

      {showInitialSkeleton && (
        <SkeletonScreen
          variant={SKELETON_VARIANTS.TABLE}
          ariaLabel={formatMessage(messages.historyListLoading)}
        />
      )}

      {!showInitialSkeleton && isError && rows.length === 0 && (
        <div className="upload-training-ai-page__empty">
          <EmptyState fullSize message={errorMessage} />
          <button type="button" className="upload-training-ai-page__outline-btn" onClick={() => refetch()}>
            {formatMessage(messages.retry)}
          </button>
        </div>
      )}

      {!showInitialSkeleton && !isError && count === 0 && (
        <div className="upload-training-ai-page__empty">
          <EmptyState fullSize message={formatMessage(messages.emptyTitle)} />
          <button type="button" className="upload-training-ai-page__primary-btn" onClick={goToNewUpload}>
            <FontAwesomeIcon icon={faCloudUploadAlt} aria-hidden />
            <span>{formatMessage(messages.uploadDocumentButton)}</span>
          </button>
        </div>
      )}

      {!showInitialSkeleton && !isError && count > 0 && (
        <DataTable
          columns={columns}
          rows={tableRows}
          rowKey="job_id"
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          minWidth={960}
          paginationLabel={formatMessage(messages.historyPaginationLabel)}
          footerContent={formatMessage(
            messages.showingCount,
            buildPaginationShowingParams(tableRows, count),
          )}
        />
      )}
    </section>
  );
};

export default UploadTrainingWithAi;
