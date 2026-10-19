/* eslint-disable react/prop-types */
import { useIntl } from '@edx/frontend-platform/i18n';
import {
  faArrowLeft,
  faCheck,
  faCheckCircle,
  faCircle,
  faCloudUploadAlt,
  faFileAlt,
  faLink,
  faPencilAlt,
  faSpinner,
  faTimes,
  faTimesCircle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { formatFileSize, STEP_ORDER } from '../../api/aiTraining/aiTrainingUtils';
import AIReviewList from '../../components/aiTraining/AIReviewList';
import AIStepIndicator from '../../components/aiTraining/AIStepIndicator';
import ExtractedTrainingDrawer from '../../components/aiTraining/ExtractedTrainingDrawer';
import { EmptyState } from '../../components/emptyState';
import { TablePaginationFooter } from '../../components/dataTable';
import SearchInput from '../../components/searchInput/SearchInput';
import SearchableDropdown from '../../components/searchableDropdown/SearchableDropdown';
import { SkeletonCardList, SkeletonScreen, SkeletonStatsGrid, SkeletonToolbar, SKELETON_VARIANTS } from '../../components/skeleton';
import { useToast } from '../../components/toast/ToastProvider';
import useCreateTrainings from '../../hooks/aiTraining/useCreateTrainings';
import useExtractedTrainings from '../../hooks/aiTraining/useExtractedTrainings';
import useProcessingStatus from '../../hooks/aiTraining/useProcessingStatus';
import useUpdateExtractedTraining from '../../hooks/aiTraining/useUpdateExtractedTraining';
import useUploadTrainingDocument from '../../hooks/aiTraining/useUploadTrainingDocument';
import { AI_TRAINING_REVIEW_PAGE_SIZE } from '../../api/endpoints';
import { ADMIN_PATHS } from '../../utils/adminPaths';
import { hasDisplayValue } from '../../utils/hasDisplayValue';
import messages from './messages';
import './AITrainingCreate.scss';

const PAGE_SIZE = AI_TRAINING_REVIEW_PAGE_SIZE;
const SOURCE_FILE = 'file';
const SOURCE_URL = 'url';

const isHttpUrl = (value) => {
  try {
    const parsed = new URL(String(value).trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const PROCESS_STEP_MESSAGES = {
  validating_document: messages.processStepValidating,
  reading_document: messages.processStepReading,
  extracting_data: messages.processStepExtracting,
  identifying_trainings: messages.processStepIdentifying,
  mapping_fields: messages.processStepMappingFields,
  mapping_competencies: messages.processStepMappingCompetencies,
  mapping_activities: messages.processStepMappingActivities,
  validating_records: messages.processStepValidatingRecords,
  preparing_results: messages.processStepPreparing,
  completed: messages.processStepCompleted,
};

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    <path d="M20 3v4" />
    <path d="M22 5h-4" />
    <path d="M4 17v2" />
    <path d="M5 18H3" />
  </svg>
);

const AITrainingCreate = () => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const fileRef = useRef(null);
  const isNewUploadFlow = location.pathname.includes('/new');
  const resumeJob = searchParams.get('job');

  const [phase, setPhase] = useState(() => {
    if (!hasDisplayValue(resumeJob)) return 'upload';
    return isNewUploadFlow ? 'processing' : 'review';
  });
  const [files, setFiles] = useState([]);
  const [sourceMode, setSourceMode] = useState(SOURCE_FILE);
  const [sourceUrl, setSourceUrl] = useState('');
  const [dragging, setDragging] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [jobId, setJobId] = useState(() => (hasDisplayValue(resumeJob) ? resumeJob : null));
  const [processError, setProcessError] = useState(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ confidence: 'all', created: 'all' });
  const [selected, setSelected] = useState(new Set());
  const [editing, setEditing] = useState(null);
  const [drawerTab, setDrawerTab] = useState('edit');
  const [approving, setApproving] = useState(new Set());
  const [reanalyzing, setReanalyzing] = useState(new Set());
  const [createResult, setCreateResult] = useState(null);
  const [showCreateBanner, setShowCreateBanner] = useState(false);

  const { upload, isUploading } = useUploadTrainingDocument();
  const {
    status,
    isLoading: statusLoading,
    isError: statusError,
    errorMessage: statusErrorMessage,
    refetch: refetchStatus,
  } = useProcessingStatus({
    jobId,
    enabled: Boolean(jobId) && isNewUploadFlow && phase !== 'upload',
  });
  const {
    items,
    summary,
    pageSize: backendPageSize,
    totalPages,
    total: extractedTotal,
    matchingIds,
    results,
    isLoading: loadingResults,
    isError: resultsError,
    errorMessage: resultsErrorMessage,
    refetch: refetchResults,
  } = useExtractedTrainings({
    jobId,
    page,
    pageSize: PAGE_SIZE,
    search,
    filters,
    enabled: (phase === 'review' || phase === 'creating') && Boolean(jobId),
  });
  const pageSize = backendPageSize || PAGE_SIZE;
  const { updateMappings, updateTraining, reanalyzeTraining, revertHistory, isUpdating } = useUpdateExtractedTraining({ jobId });
  const { create, isCreating } = useCreateTrainings({ jobId });

  useEffect(() => {
    const resume = searchParams.get('job');
    if (!hasDisplayValue(resume)) return;
    setJobId(resume);
    if (isNewUploadFlow) {
      setPhase((current) => (current === 'upload' ? 'processing' : current));
      return;
    }
    setPhase((current) => (
      current === 'upload' || current === 'processing' ? 'review' : current
    ));
  }, [isNewUploadFlow, searchParams]);

  useEffect(() => {
    if (phase !== 'processing' || !status) return;
    if (status.status === 'completed') setPhase('review');
    else if (status.status === 'failed') {
      const message = (
        (typeof status.error === 'string' && status.error)
        || status.error?.message
        || status.message
        || formatMessage(messages.toastProcessFailed)
      );
      setProcessError(message);
      showToast({
        title: formatMessage(messages.toastProcessFailed),
        description: hasDisplayValue(message) ? message : formatMessage(messages.toastProcessFailed),
      });
      setPhase('failed');
    }
  }, [phase, status, formatMessage, showToast]);

  const confidenceOptions = useMemo(() => [
    { value: 'all', label: formatMessage(messages.confidenceAny) },
    { value: 'high', label: formatMessage(messages.confidenceHigh) },
    { value: 'medium', label: formatMessage(messages.confidenceMedium) },
    { value: 'low', label: formatMessage(messages.confidenceLow) },
  ], [formatMessage]);

  const createdOptions = useMemo(() => [
    { value: 'all', label: formatMessage(messages.statusAll) },
    { value: 'created', label: formatMessage(messages.statusCreated) },
    { value: 'not_created', label: formatMessage(messages.statusNotCreated) },
  ], [formatMessage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, filters.confidence, filters.created]);

  const handlePageChange = (nextPage) => {
    const numeric = Number(nextPage);
    if (Number.isFinite(numeric) && numeric >= 1) {
      setPage(numeric);
    }
  };

  const addFiles = (list) => {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  };

  const startUpload = async () => {
    const usingUrl = sourceMode === SOURCE_URL;
    const trimmedUrl = sourceUrl.trim();
    if (usingUrl) {
      if (!isHttpUrl(trimmedUrl)) return;
    } else if (files.length === 0) return;
    try {
      const data = await upload({
        file: usingUrl ? undefined : files[0],
        fileName: usingUrl ? trimmedUrl : files.map((item) => item.name).join(' + '),
        sourceUrl: usingUrl ? trimmedUrl : undefined,
        onProgress: setUploadPct,
      });
      setJobId(data.job_id);
      navigate(ADMIN_PATHS.uploadTrainingWithAiNewJob(data.job_id), { replace: true });
      setPhase('processing');
    } catch (err) {
      showToast({
        title: formatMessage(messages.toastUploadFailed),
        description: hasDisplayValue(err?.message) ? err.message : formatMessage(messages.toastUploadFailed),
      });
    }
  };

  const selectableIds = useMemo(
    () => items.filter((item) => !item.created && (item.activities || []).length > 0 && (item.competencies || []).length > 0).map((item) => item.id),
    [items],
  );
  const allPageSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
  const busy = isCreating || phase === 'creating';

  const toggleAllPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) selectableIds.forEach((id) => next.delete(id));
      else selectableIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleToggleMapping = async (training, kind, name) => {
    const current = training[kind] || [];
    const needle = String(name || '').trim().toLowerCase();
    const alreadyOn = current.some((item) => {
      const hay = String(item || '').trim().toLowerCase();
      return hay === needle || hay.includes(needle) || needle.includes(hay);
    });
    const next = alreadyOn
      ? current.filter((item) => {
        const hay = String(item || '').trim().toLowerCase();
        return !(hay === needle || hay.includes(needle) || needle.includes(hay));
      })
      : [...current, name];
    try {
      await updateMappings({ trainingId: training.id, payload: { [kind]: next } });
      await refetchResults();
    } catch (err) {
      showToast({
        title: formatMessage(messages.toastLoadFailed),
        description: hasDisplayValue(err?.message) ? err.message : formatMessage(messages.toastLoadFailed),
      });
    }
  };

  const handleSaveSelected = async () => {
    if (selected.size === 0) return;
    setPhase('creating');
    setShowCreateBanner(false);
    try {
      const result = await create([...selected]);
      const job = result.data || {};
      setCreateResult(job);
      setShowCreateBanner(true);
      setSelected(new Set());
      setPhase('review');
      await refetchResults();
      showToast({
        title: job.failed > 0 ? formatMessage(messages.toastCreatePartial) : formatMessage(messages.toastCreateOk),
        description: hasDisplayValue(result.message)
          ? result.message
          : formatMessage(messages.toastCreateDescription, {
            created: Number(job.created || 0).toLocaleString(),
            failed: Number(job.failed || 0).toLocaleString(),
          }),
      });
    } catch (err) {
      setPhase('review');
      showToast({
        title: formatMessage(messages.createErrorTitle),
        description: hasDisplayValue(err?.message) ? err.message : formatMessage(messages.toastCreatePartial),
      });
    }
  };

  const handleApprove = async (training) => {
    if (training.created || busy) return;
    setApproving((prev) => new Set(prev).add(training.id));
    try {
      const result = await create([training.id]);
      const job = result.data || {};
      setSelected((prev) => { const next = new Set(prev); next.delete(training.id); return next; });
      await refetchResults();
      const trainingName = hasDisplayValue(training.training_name)
        ? training.training_name
        : formatMessage(messages.untitled);
      showToast({
        title: job.failed === 0 ? formatMessage(messages.toastApproveOk) : formatMessage(messages.toastCreatePartial),
        description: hasDisplayValue(result.message)
          ? result.message
          : formatMessage(messages.toastApproveDescription, { name: trainingName }),
      });
    } catch (err) {
      showToast({
        title: formatMessage(messages.createErrorTitle),
        description: hasDisplayValue(err?.message) ? err.message : formatMessage(messages.toastCreatePartial),
      });
    } finally {
      setApproving((prev) => { const next = new Set(prev); next.delete(training.id); return next; });
    }
  };

  const handleDrawerSave = async (form, { skipSuccessToast = false, syncCatalog = false } = {}) => {
    if (!editing) return;
    const trainingId = editing.id;
    const trainingName = hasDisplayValue(editing.training_name)
      ? editing.training_name
      : formatMessage(messages.untitled);
    try {
      const result = await updateTraining({
        trainingId,
        payload: { ...form, sync_catalog: Boolean(syncCatalog) },
      });
      setEditing(null);
      if (!skipSuccessToast) {
        const synced = Boolean(result?.data?.catalog_synced || syncCatalog);
        showToast({
          title: formatMessage(synced ? messages.toastUpdatedTitle : messages.toastSavedTitle),
          description: hasDisplayValue(result.message)
            ? result.message
            : formatMessage(
              synced ? messages.toastUpdatedDescription : messages.toastDraftSavedDescription,
              { name: trainingName },
            ),
        });
      }
    } catch (err) {
      showToast({
        title: formatMessage(messages.saveErrorTitle),
        description: hasDisplayValue(err?.message) ? err.message : formatMessage(messages.saveError),
      });
      throw err;
    }

    // Re-score mappings only for draft saves / create path — not when pushing to live catalog.
    if (!syncCatalog) {
      setReanalyzing((prev) => new Set(prev).add(trainingId));
      try {
        await reanalyzeTraining({ trainingId });
      } catch (err) {
        showToast({
          title: formatMessage(messages.toastReanalyzeFailed),
          description: hasDisplayValue(err?.message) ? err.message : formatMessage(messages.toastReanalyzeFailed),
        });
      } finally {
        setReanalyzing((prev) => { const next = new Set(prev); next.delete(trainingId); return next; });
      }
    }
    await refetchResults();
  };

  const handleCreateOne = async (draft) => {
    setEditing(null);
    await handleApprove(draft);
  };

  const handleRevert = async (event) => {
    try {
      await revertHistory({ eventId: event.id });
      showToast({
        title: formatMessage(messages.toastRevertOk),
        description: formatMessage(messages.toastRevertDescription),
      });
      await refetchResults();
    } catch (err) {
      showToast({
        title: formatMessage(messages.toastLoadFailed),
        description: hasDisplayValue(err?.message) ? err.message : formatMessage(messages.toastLoadFailed),
      });
    }
  };

  const resetToUpload = () => {
    setPhase('upload');
    setFiles([]);
    setSourceMode(SOURCE_FILE);
    setSourceUrl('');
    setUploadPct(0);
    setJobId(null);
    setSelected(new Set());
    setProcessError(null);
    navigate(ADMIN_PATHS.uploadTrainingWithAiNew, { replace: true });
  };

  const stepNumber = phase === 'upload' ? 1 : (phase === 'processing' || phase === 'failed' ? 2 : 3);
  const currentIndex = status ? STEP_ORDER.indexOf(status.current_step) : 0;
  const visibleSteps = STEP_ORDER.filter((step) => step !== 'completed');
  const isReviewLoading = loadingResults && items.length === 0 && !resultsError;

  return (
    <section className="ai-training-create">
      <button type="button" className="ai-training-create__back" onClick={() => navigate(ADMIN_PATHS.uploadTrainingWithAi)}>
        <FontAwesomeIcon icon={faArrowLeft} aria-hidden />
        <span>{formatMessage(messages.backToHistory)}</span>
      </button>

      <AIStepIndicator current={stepNumber} />

      {phase === 'upload' && (
        <div className="ai-training-create__upload">
          <h2 className="ai-training-create__heading">{formatMessage(messages.uploadHeading)}</h2>
          <p className="ai-training-create__hint">{formatMessage(messages.uploadHint)}</p>
          <fieldset className="ai-training-create__source-choice" aria-label={formatMessage(messages.sourceChoiceLabel)}>
            <label className="ai-training-create__source-option" htmlFor="ai-source-file">
              <input
                id="ai-source-file"
                type="checkbox"
                checked={sourceMode === SOURCE_FILE}
                onChange={() => {
                  setSourceMode(SOURCE_FILE);
                  setSourceUrl('');
                }}
              />
              {formatMessage(messages.sourceUploadDocument)}
            </label>
            <label className="ai-training-create__source-option" htmlFor="ai-source-url">
              <input
                id="ai-source-url"
                type="checkbox"
                checked={sourceMode === SOURCE_URL}
                onChange={() => {
                  setSourceMode(SOURCE_URL);
                  setFiles([]);
                }}
              />
              {formatMessage(messages.sourceShareUrl)}
            </label>
          </fieldset>
          {sourceMode === SOURCE_FILE ? (
          <div
            className={`ai-training-create__dropzone ${dragging ? 'is-dragging' : ''}`}
            role="group"
            aria-label={formatMessage(messages.dropzoneLabel)}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }}
          >
            <FontAwesomeIcon icon={faCloudUploadAlt} className="ai-training-create__drop-icon" aria-hidden />
            <p className="ai-training-create__drop-title">{formatMessage(messages.uploadDocumentButton)}</p>
            <p className="ai-training-create__drop-sub">{formatMessage(messages.dragDrop)}</p>
            <p className="ai-training-create__drop-or">{formatMessage(messages.orLabel)}</p>
            <button type="button" className="ai-training-create__outline-button" onClick={() => fileRef.current?.click()}>
              {formatMessage(messages.browseFiles)}
            </button>
            <input ref={fileRef} type="file" hidden multiple accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt" onChange={(event) => addFiles(event.target.files)} aria-label={formatMessage(messages.browseFiles)} />
            <p className="ai-training-create__drop-formats">{formatMessage(messages.supportedFormats)}</p>
          </div>
          ) : (
          <div className="ai-training-create__url-panel">
            <FontAwesomeIcon icon={faLink} className="ai-training-create__drop-icon" aria-hidden />
            <label className="ai-training-create__url-label" htmlFor="ai-source-url-input">
              {formatMessage(messages.sourceUrlLabel)}
            </label>
            <input
              id="ai-source-url-input"
              className="ai-training-create__url-input"
              type="url"
              value={sourceUrl}
              placeholder={formatMessage(messages.sourceUrlPlaceholder)}
              onChange={(event) => setSourceUrl(event.target.value)}
              autoComplete="url"
            />
          </div>
          )}
          {sourceMode === SOURCE_FILE && files.length > 0 && (
            <div className="ai-training-create__file-list">
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="ai-training-create__file-row">
                  <div className="ai-training-create__file-icon"><FontAwesomeIcon icon={faFileAlt} aria-hidden /></div>
                  <div className="ai-training-create__file-meta">
                    {hasDisplayValue(file.name) && (
                      <p className="ai-training-create__file-name">{file.name}</p>
                    )}
                    {(hasDisplayValue(file.name) || file.size) && (
                      <p className="ai-training-create__file-size">
                        {formatMessage(messages.fileMeta, {
                          type: String(file.name || '').split('.').pop()?.toUpperCase() || '',
                          size: file.size ? formatFileSize(file.size) : '',
                        })}
                      </p>
                    )}
                    {isUploading && index === 0 && (
                      <div className="ai-training-create__progress">
                        <div className="ai-training-create__progress-bar progress-shimmer" style={{ width: `${uploadPct}%` }} />
                      </div>
                    )}
                  </div>
                  {!isUploading ? (
                    <button type="button" className="ai-training-create__icon-btn" onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== index))} aria-label={formatMessage(messages.removeFile)}>
                      <FontAwesomeIcon icon={faTimes} aria-hidden />
                    </button>
                  ) : (
                    <span className="ai-training-create__file-spacer" aria-hidden />
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="ai-training-create__actions">
            <button type="button" className="ai-training-create__outline-button" onClick={() => navigate(ADMIN_PATHS.uploadTrainingWithAi)}>{formatMessage(messages.cancel)}</button>
            <button
              type="button"
              className="ai-training-create__primary-button"
              disabled={
                isUploading
                || (sourceMode === SOURCE_FILE ? files.length === 0 : !isHttpUrl(sourceUrl))
              }
              onClick={startUpload}
            >
              {isUploading && <FontAwesomeIcon icon={faSpinner} spin aria-hidden />}
              <span>
                {formatMessage(sourceMode === SOURCE_URL ? messages.startAiProcessing : messages.uploadAndStart)}
              </span>
            </button>
          </div>
        </div>
      )}

      {phase === 'processing' && (
        <div className="ai-training-create__processing">
          {statusLoading && !status ? (
            <SkeletonScreen
              variant={SKELETON_VARIANTS.CARD_LIST}
              rows={6}
              hasHeader
              ariaLabel={formatMessage(messages.processingListLoading)}
            />
          ) : statusError && !status ? (
            <div className="ai-training-create__empty">
              <EmptyState message={statusErrorMessage} />
              <button type="button" className="ai-training-create__outline-button" onClick={() => refetchStatus()}>
                {formatMessage(messages.retry)}
              </button>
            </div>
          ) : (
            <>
              <div className="ai-training-create__sparkle">
                <span className="animate-step-ring" aria-hidden />
                <span className="animate-step-ring is-delayed" aria-hidden />
                <SparklesIcon />
              </div>
              <h2 className="ai-training-create__heading">{formatMessage(messages.processingHeading)}</h2>
              <p className="ai-training-create__hint">{formatMessage(messages.processingKeepOpen)}</p>
              {status && Number(status.total_records || 0) > 0 && (
                <p className="ai-training-create__progress-text">
                  {formatMessage(messages.processingRecords, {
                    processed: Number(status.processed_records || 0).toLocaleString(),
                    total: Number(status.total_records).toLocaleString(),
                    progress: status.progress ?? 0,
                  })}
                </p>
              )}
              <div className="ai-training-create__progress is-wide progress-shimmer">
                <div className="ai-training-create__progress-bar" style={{ width: `${status?.progress ?? 0}%` }} />
              </div>
              <ol className="ai-training-create__timeline">
                {visibleSteps.map((step, idx) => {
                  const index = STEP_ORDER.indexOf(step);
                  const done = index < currentIndex;
                  const active = index === currentIndex;
                  const isLast = idx === visibleSteps.length - 1;
                  const stepMessage = PROCESS_STEP_MESSAGES[step];
                  if (!stepMessage) {
                    return null;
                  }
                  const label = formatMessage(stepMessage);
                  return (
                    <li key={step} className={`ai-training-create__timeline-row ${done ? 'is-done' : ''} ${active ? 'is-active' : ''}`}>
                      {!isLast && <span className={`ai-training-create__connector ${done ? 'is-done' : ''}`} aria-hidden />}
                      <span className="ai-training-create__node">
                        {done && <FontAwesomeIcon icon={faCheck} aria-hidden />}
                        {active && <FontAwesomeIcon icon={faSpinner} spin aria-hidden />}
                        {!done && !active && <FontAwesomeIcon icon={faCircle} aria-hidden />}
                        {active && <span className="animate-step-ring" aria-hidden />}
                      </span>
                      <div>
                        <p>
                          {done ? formatMessage(messages.processStepDone, { step: label }) : label}
                          {active && (
                            <span className="ai-training-create__dots" aria-hidden>
                              <span className="animate-dot" />
                              <span className="animate-dot" style={{ animationDelay: '0.15s' }} />
                              <span className="animate-dot" style={{ animationDelay: '0.3s' }} />
                            </span>
                          )}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </div>
      )}

      {phase === 'failed' && (
        <div className="ai-training-create__failed">
          <FontAwesomeIcon icon={faTimesCircle} className="ai-training-create__failed-icon" aria-hidden />
          <h2>{formatMessage(messages.processingFailedTitle)}</h2>
          {hasDisplayValue(processError) && <p>{processError}</p>}
          <div className="ai-training-create__actions">
            <button type="button" className="ai-training-create__primary-button" onClick={() => { setProcessError(null); setPhase('processing'); }}>{formatMessage(messages.tryAgain)}</button>
            <button type="button" className="ai-training-create__outline-button" onClick={resetToUpload}>{formatMessage(messages.uploadAnother)}</button>
          </div>
        </div>
      )}

      {(phase === 'review' || phase === 'creating') && (
        <div className="ai-training-create__review">
          <h2 className="ai-training-create__review-title">{formatMessage(messages.reviewHeading)}</h2>
          <p className="ai-training-create__review-hint">
            {formatMessage(messages.reviewHint)}
            {summary && (
              <>
                {' '}
                <strong>{formatMessage(messages.trainingsFound, { count: Number(summary.total || 0).toLocaleString() })}</strong>
              </>
            )}
          </p>

          {isReviewLoading && (
            <SkeletonScreen ariaLabel={formatMessage(messages.listLoading)}>
              <SkeletonStatsGrid count={4} />
              <SkeletonToolbar showSearch showFilter showPrimaryButton={false} />
              <SkeletonCardList rows={6} hasHeader={false} />
            </SkeletonScreen>
          )}

          {!isReviewLoading && summary && (
            <div className="ai-training-create__stats">
              {[
                { icon: faFileAlt, label: formatMessage(messages.statAll), value: summary.total, tone: '' },
                { icon: faCheckCircle, label: formatMessage(messages.statApproved), value: summary.approved, tone: 'is-approved' },
                { icon: faPencilAlt, label: formatMessage(messages.statEdited), value: summary.edited_pending, tone: 'is-edited' },
                { icon: faCircle, label: formatMessage(messages.statPending), value: summary.pending, tone: 'is-pending' },
              ].map((stat) => (
                <div key={stat.label} className={`ai-training-create__stat ${stat.tone}`}>
                  <span className="ai-training-create__stat-icon"><FontAwesomeIcon icon={stat.icon} aria-hidden /></span>
                  <div>
                    <span className="ai-training-create__stat-label">{stat.label}</span>
                    <span className="ai-training-create__stat-value">{Number(stat.value || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isReviewLoading && (
          <>
          <div className="ai-training-create__toolbar">
            <SearchInput
              className="ai-training-create__search"
              type="search"
              placeholder={formatMessage(messages.searchPlaceholder)}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              ariaLabel={formatMessage(messages.searchPlaceholder)}
            />
            <SearchableDropdown
              className="ai-training-create__filter is-match"
              value={filters.confidence}
              options={confidenceOptions}
              onChange={(value) => setFilters((prev) => ({ ...prev, confidence: value }))}
              triggerLabel={formatMessage(messages.confidenceFilter)}
              searchPlaceholder={formatMessage(messages.dropdownSearchPlaceholder)}
              noOptionsText={formatMessage(messages.dropdownNoOptions)}
            />
            <SearchableDropdown
              className="ai-training-create__filter is-status"
              value={filters.created}
              options={createdOptions}
              onChange={(value) => setFilters((prev) => ({ ...prev, created: value }))}
              triggerLabel={formatMessage(messages.trainingStatusFilter)}
              searchPlaceholder={formatMessage(messages.dropdownSearchPlaceholder)}
              noOptionsText={formatMessage(messages.dropdownNoOptions)}
            />
          </div>

          {busy && (
            <div className="ai-training-create__create-progress">
              <strong>{formatMessage(messages.savingTrainings)}</strong>
              <p>{formatMessage(messages.savingTrainingsHint)}</p>
              <div className="ai-training-create__progress is-wide progress-shimmer">
                <div className="ai-training-create__progress-bar" style={{ width: `${createResult?.progress || 35}%` }} />
              </div>
            </div>
          )}
          {!busy && showCreateBanner && createResult && (
            <div className={`ai-training-create__create-result ${createResult.failed > 0 ? 'has-errors' : ''}`}>
              <FontAwesomeIcon icon={faCheckCircle} aria-hidden />
              <div>
                <strong>{formatMessage(messages.importComplete)}</strong>
                <p>{formatMessage(messages.importCompleteSummary, { created: Number(createResult.created || 0).toLocaleString(), failed: Number(createResult.failed || 0).toLocaleString() })}</p>
              </div>
              <button type="button" className="ai-training-create__text-btn" onClick={() => setShowCreateBanner(false)}>{formatMessage(messages.dismiss)}</button>
            </div>
          )}

          <div className="ai-training-create__table">
            <div className="ai-training-create__selection-bar">
              <label className="ai-training-create__select-page">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={toggleAllPage}
                  disabled={busy || selectableIds.length === 0}
                  aria-label={formatMessage(messages.selectPage)}
                />
                <span>{formatMessage(messages.selectPage)}</span>
              </label>
              {extractedTotal > pageSize && (
                <button type="button" className="ai-training-create__text-btn" onClick={() => setSelected(new Set(matchingIds))}>
                  {formatMessage(messages.selectAllMatching, { count: matchingIds.length.toLocaleString() })}
                </button>
              )}
              {selected.size > 0 && (
                <button type="button" className="ai-training-create__text-btn" onClick={() => setSelected(new Set())}>{formatMessage(messages.clearSelection)}</button>
              )}
              <span className="ai-training-create__selected-count">{formatMessage(messages.selectedCount, { count: selected.size.toLocaleString() })}</span>
            </div>

            {resultsError && !loadingResults ? (
              <div className="ai-training-create__empty">
                <EmptyState message={resultsErrorMessage} />
                <button type="button" className="ai-training-create__outline-button" onClick={() => refetchResults()}>{formatMessage(messages.retry)}</button>
              </div>
            ) : (
              <AIReviewList
                items={items}
                selected={selected}
                onToggleSelect={(training) => setSelected((prev) => {
                  const next = new Set(prev);
                  if (next.has(training.id)) next.delete(training.id);
                  else next.add(training.id);
                  return next;
                })}
                onToggleMapping={handleToggleMapping}
                onApprove={handleApprove}
                onEdit={(training) => { setEditing(training); setDrawerTab('edit'); }}
                onHistory={(training) => { setEditing(training); setDrawerTab('history'); }}
                approving={approving}
                reanalyzing={reanalyzing}
                busy={busy}
              />
            )}

            <TablePaginationFooter
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              paginationLabel={formatMessage(messages.extractedPaginationLabel)}
              footerContent={formatMessage(messages.showingResults, {
                start: items.length ? ((page - 1) * pageSize) + 1 : 0,
                end: Math.min(page * pageSize, extractedTotal || items.length),
                total: (extractedTotal || items.length).toLocaleString(),
              })}
            />
          </div>

          <div className="ai-training-create__bottom-actions">
            <button type="button" className="ai-training-create__outline-button" onClick={() => navigate(ADMIN_PATHS.uploadTrainingWithAi)}>{formatMessage(messages.cancel)}</button>
            <button type="button" className="ai-training-create__primary-button" disabled={selected.size === 0 || busy} onClick={handleSaveSelected}>
              {busy && <FontAwesomeIcon icon={faSpinner} spin aria-hidden />}
              {formatMessage(messages.createSelectedCount, { count: selected.size })}
            </button>
          </div>
          </>
          )}
        </div>
      )}

      <ExtractedTrainingDrawer
        jobId={jobId}
        open={Boolean(editing)}
        training={editing}
        tab={drawerTab}
        onClose={() => setEditing(null)}
        onSave={handleDrawerSave}
        onCreateOne={handleCreateOne}
        onRevert={handleRevert}
        isSaving={isUpdating}
      />
    </section>
  );
};

export default AITrainingCreate;
