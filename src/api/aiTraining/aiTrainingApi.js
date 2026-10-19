/**
 * AI Training upload / extract / create API (real HTTP).
 * Contract matches /api/v1/ai-training/* on trainings_catalog_ai.
 * Every response is normalized so missing/empty fields never break the UI.
 */
import { executeApiRequest } from '../apiRequest';
import {
  AI_TRAINING_IMPORT_HISTORY_PAGE_SIZE,
  AI_TRAINING_IMPORTS,
  AI_TRAINING_REVIEW_PAGE_SIZE,
  AI_TRAINING_UPLOAD,
} from '../endpoints';
import { getApiBaseUrl, getHttpClient } from '../httpClient';
import aiTrainingMessages from './aiTrainingMessages';
import { hasDisplayValue } from '../../utils/hasDisplayValue';

export { STEP_ORDER } from './aiTrainingUtils';

const enc = (value) => encodeURIComponent(String(value ?? ''));

const asArray = (value) => (Array.isArray(value) ? value : []);
const asObject = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});
const asNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};
const asString = (value, fallback = '') => (
  value == null ? fallback : String(value)
);

const normalizeImportRow = (row) => {
  const item = asObject(row);
  const jobId = asString(item.job_id || item.id);
  return {
    id: jobId,
    job_id: jobId,
    file_name: asString(item.file_name),
    uploaded_by: asString(item.uploaded_by),
    uploaded_at: item.uploaded_at || null,
    total_records: asNumber(item.total_records),
    created: asNumber(item.created),
    needs_review: asNumber(item.needs_review),
    failed: asNumber(item.failed),
    status: asString(item.status, 'completed'),
    timeline: asArray(item.timeline),
  };
};

const normalizeImportHistory = (data, page, pageSize) => {
  const body = asObject(data);
  const results = asArray(body.results).map(normalizeImportRow);
  const count = asNumber(body.count, results.length);
  const size = Math.max(1, asNumber(body.page_size, pageSize));
  const totalPages = Math.max(1, asNumber(body.total_pages, Math.ceil(count / size) || 1));
  return {
    results,
    count,
    page: Math.min(Math.max(1, asNumber(body.page, page)), totalPages),
    page_size: size,
    total_pages: totalPages,
  };
};

const normalizeStatus = (data, jobId) => {
  const body = asObject(data);
  return {
    job_id: asString(body.job_id, jobId),
    status: asString(body.status, 'processing'),
    current_step: asString(body.current_step, 'validating_document'),
    progress: asNumber(body.progress),
    message: asString(body.message, 'Processing...'),
    total_records: asNumber(body.total_records),
    processed_records: asNumber(body.processed_records),
    error: body.error == null ? null : body.error,
    started_at: body.started_at || null,
  };
};

const normalizeExtractedItem = (row) => {
  const item = asObject(row);
  return {
    ...item,
    id: asString(item.id),
    training_name: asString(item.training_name),
    description: asString(item.description),
    domain: asString(item.domain),
    sub_domain: asString(item.sub_domain),
    language: asString(item.language),
    duration: asString(item.duration),
    cost: asString(item.cost),
    training_mode: asString(item.training_mode),
    approach: asString(item.approach),
    evaluation: asString(item.evaluation),
    outcome: asString(item.outcome),
    product_type: asString(item.product_type),
    registration_by: asString(item.registration_by, 'URL'),
    registration_value: asString(item.registration_value),
    nra_objectives: asArray(item.nra_objectives),
    competencies: asArray(item.competencies),
    activities: asArray(item.activities),
    competency_suggestions: asArray(item.competency_suggestions),
    activity_suggestions: asArray(item.activity_suggestions),
    status: asString(item.status, 'needs_review'),
    confidence: asNumber(item.confidence),
    created: Boolean(item.created),
    edited: Boolean(item.edited || item.status === 'edited'),
    provider: asString(item.provider),
    maturity_level: asString(item.maturity_level),
    target_audience: asString(item.target_audience),
    source_id: asString(item.source_id),
    source_file: asString(item.source_file),
  };
};

const normalizeExtracted = (data) => {
  const body = asObject(data);
  const items = asArray(body.items).map(normalizeExtractedItem);
  const summary = asObject(body.summary);
  return {
    items,
    page: Math.max(1, asNumber(body.page, 1)),
    page_size: Math.max(1, asNumber(body.page_size, AI_TRAINING_REVIEW_PAGE_SIZE)),
    total: asNumber(body.total, items.length),
    total_pages: Math.max(1, asNumber(body.total_pages, 1)),
    matching_ids: asArray(body.matching_ids),
    summary: {
      total: asNumber(summary.total, items.length),
      approved: asNumber(summary.approved),
      edited_pending: asNumber(summary.edited_pending),
      pending: asNumber(summary.pending),
    },
  };
};

const normalizeCreateJob = (data) => {
  const body = asObject(data);
  return {
    create_job_id: asString(body.create_job_id),
    status: asString(body.status, 'completed'),
    created: asNumber(body.created),
    failed: asNumber(body.failed),
    remaining: asNumber(body.remaining),
    progress: asNumber(body.progress, body.status === 'completed' ? 100 : 0),
    total: asNumber(body.total),
    failures: asArray(body.failures),
  };
};

const normalizeHistory = (data) => asArray(data).map((row) => {
  const item = asObject(row);
  return {
    id: asString(item.id),
    training_id: asString(item.training_id),
    actor: asString(item.actor),
    training_name: asString(item.training_name),
    field: asString(item.field),
    before: item.before == null ? '' : item.before,
    after: item.after == null ? '' : item.after,
    timestamp: item.timestamp || null,
  };
});

const withNormalized = async (result, normalize) => {
  if (!result?.ok) {
    return result;
  }
  try {
    return { ...result, data: normalize(result.data) };
  } catch {
    return { ...result, data: normalize(null) };
  }
};

/** @param {string} jobId */
const importsUrl = (jobId) => `/api/v1/ai-training/imports/${enc(jobId)}/`;
/** @param {string} jobId */
const historyUrl = (jobId) => `/api/v1/ai-training/imports/${enc(jobId)}/history/`;
/** @param {string} jobId @param {string} eventId */
const historyRevertUrl = (jobId, eventId) => (
  `/api/v1/ai-training/imports/${enc(jobId)}/history/${enc(eventId)}/revert/`
);
/** @param {string} jobId */
const statusUrl = (jobId) => `/api/v1/ai-training/jobs/${enc(jobId)}/status/`;
/** @param {string} jobId */
const extractedUrl = (jobId) => `/api/v1/ai-training/jobs/${enc(jobId)}/extracted/`;
/** @param {string} jobId @param {string} trainingId */
const extractedDetailUrl = (jobId, trainingId) => (
  `/api/v1/ai-training/jobs/${enc(jobId)}/extracted/${enc(trainingId)}/`
);
/** @param {string} jobId @param {string} trainingId */
const mappingsUrl = (jobId, trainingId) => (
  `/api/v1/ai-training/jobs/${enc(jobId)}/extracted/${enc(trainingId)}/mappings/`
);
/** @param {string} jobId @param {string} trainingId */
const reanalyzeUrl = (jobId, trainingId) => (
  `/api/v1/ai-training/jobs/${enc(jobId)}/extracted/${enc(trainingId)}/reanalyze/`
);
/** @param {string} jobId */
const createUrl = (jobId) => `/api/v1/ai-training/jobs/${enc(jobId)}/create/`;
/** @param {string} createJobId */
const createJobStatusUrl = (createJobId) => `/api/v1/ai-training/create-jobs/${enc(createJobId)}/`;

/**
 * List AI document import history.
 */
export const fetchImportHistory = async ({
  formatMessage,
  page = 1,
  pageSize = AI_TRAINING_IMPORT_HISTORY_PAGE_SIZE,
}) => withNormalized(
  await executeApiRequest({
    request: () => getHttpClient().get(`${getApiBaseUrl()}${AI_TRAINING_IMPORTS}`, {
      params: { page, page_size: pageSize },
    }),
    formatMessage,
    fallbackMessage: aiTrainingMessages.historyLoadError,
  }),
  (data) => normalizeImportHistory(data, page, pageSize),
);

/**
 * Single import details.
 */
export const fetchImportDetails = async ({ formatMessage, jobId }) => withNormalized(
  await executeApiRequest({
    request: () => getHttpClient().get(`${getApiBaseUrl()}${importsUrl(jobId)}`),
    formatMessage,
    fallbackMessage: aiTrainingMessages.jobNotFound,
  }),
  (data) => normalizeImportRow(data),
);

/**
 * Change history for a job.
 */
export const fetchChangeHistory = async ({ formatMessage, jobId }) => withNormalized(
  await executeApiRequest({
    request: () => getHttpClient().get(`${getApiBaseUrl()}${historyUrl(jobId)}`),
    formatMessage,
    fallbackMessage: aiTrainingMessages.historyLoadError,
  }),
  normalizeHistory,
);

const isHttpUrl = (value) => {
  try {
    const parsed = new URL(String(value).trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Upload a training document (file or URL) and start AI processing.
 * @param {{
 *   formatMessage: Function,
 *   file?: File,
 *   fileName?: string,
 *   sourceUrl?: string,
 *   trainingProviderId?: number|string,
 *   onProgress?: (pct: number) => void,
 * }} params
 */
export const uploadTrainingDocument = async ({
  formatMessage,
  file,
  fileName,
  sourceUrl,
  trainingProviderId,
  onProgress,
}) => {
  const url = hasDisplayValue(sourceUrl) ? String(sourceUrl).trim() : '';
  const usingUrl = Boolean(url);
  if (!file && !usingUrl) {
    return {
      ok: false,
      data: null,
      message: formatMessage(aiTrainingMessages.uploadError),
    };
  }
  if (usingUrl && !isHttpUrl(url)) {
    return {
      ok: false,
      data: null,
      message: formatMessage(aiTrainingMessages.invalidSourceUrl),
    };
  }

  const name = usingUrl
    ? url
    : (fileName || file.name || 'document.pdf');
  if (!usingUrl) {
    const ext = name.split('.').pop()?.toLowerCase();
    const allowed = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'csv', 'txt'];
    if (ext && !allowed.includes(ext)) {
      return {
        ok: false,
        data: null,
        message: formatMessage(aiTrainingMessages.unsupportedFile),
      };
    }
  }

  return withNormalized(
    await executeApiRequest({
      request: () => {
        const body = new FormData();
        if (usingUrl) {
          body.append('source_type', 'url');
          body.append('document_url', url);
          body.append('document_name', name);
        } else {
          body.append('document_file', file);
          body.append('source_type', 'file');
          body.append('document_name', name);
        }
        if (trainingProviderId != null && trainingProviderId !== '') {
          body.append('training_provider_id', String(trainingProviderId));
        }
        if (typeof onProgress === 'function') {
          onProgress(usingUrl ? 50 : 30);
        }
        return getHttpClient().post(`${getApiBaseUrl()}${AI_TRAINING_UPLOAD}`, body, {
          onUploadProgress: (event) => {
            if (usingUrl || typeof onProgress !== 'function' || !event.total) {
              return;
            }
            onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
          },
        }).then((response) => {
          if (typeof onProgress === 'function') {
            onProgress(100);
          }
          return response;
        });
      },
      formatMessage,
      fallbackMessage: aiTrainingMessages.uploadError,
    }),
    (data) => {
      const body = asObject(data);
      const nested = asObject(body.results);
      return { job_id: asString(body.job_id || nested.job_id) };
    },
  );
};

/**
 * Poll AI processing status for a job.
 */
export const fetchProcessingStatus = async ({ formatMessage, jobId }) => withNormalized(
  await executeApiRequest({
    request: () => getHttpClient().get(`${getApiBaseUrl()}${statusUrl(jobId)}`),
    formatMessage,
    fallbackMessage: aiTrainingMessages.jobNotFound,
  }),
  (data) => normalizeStatus(data, jobId),
);

/**
 * Paginated extracted trainings for review.
 */
export const fetchExtractedTrainings = async ({
  formatMessage,
  jobId,
  page = 1,
  pageSize = AI_TRAINING_REVIEW_PAGE_SIZE,
  search = '',
  filters = { confidence: 'all', created: 'all' },
}) => withNormalized(
  await executeApiRequest({
    request: () => getHttpClient().get(`${getApiBaseUrl()}${extractedUrl(jobId)}`, {
      params: {
        page,
        page_size: pageSize,
        search: search || undefined,
        confidence: filters?.confidence || 'all',
        created: filters?.created || 'all',
      },
    }),
    formatMessage,
    fallbackMessage: aiTrainingMessages.resultsLoadError,
  }),
  normalizeExtracted,
);

/**
 * Toggle competencies / activities arrays.
 */
export const updateMappings = async ({ formatMessage, jobId, trainingId, payload }) => withNormalized(
  await executeApiRequest({
    request: () => getHttpClient().patch(
      `${getApiBaseUrl()}${mappingsUrl(jobId, trainingId)}`,
      payload || {},
    ),
    formatMessage,
    fallbackMessage: aiTrainingMessages.updateError,
  }),
  normalizeExtractedItem,
);

/**
 * Full field update from edit drawer.
 */
export const updateExtractedTraining = async ({ formatMessage, jobId, trainingId, payload }) => withNormalized(
  await executeApiRequest({
    request: () => getHttpClient().patch(
      `${getApiBaseUrl()}${extractedDetailUrl(jobId, trainingId)}`,
      payload || {},
    ),
    formatMessage,
    fallbackMessage: aiTrainingMessages.updateError,
  }),
  normalizeExtractedItem,
);

/**
 * Re-analysis of competency/activity mappings.
 */
export const reanalyzeExtractedTraining = async ({ formatMessage, jobId, trainingId }) => withNormalized(
  await executeApiRequest({
    request: () => getHttpClient().post(
      `${getApiBaseUrl()}${reanalyzeUrl(jobId, trainingId)}`,
      {},
    ),
    formatMessage,
    fallbackMessage: aiTrainingMessages.updateError,
  }),
  normalizeExtractedItem,
);

/**
 * Start bulk create job for selected training ids.
 */
export const createTrainings = async ({ formatMessage, jobId, trainingIds }) => withNormalized(
  await executeApiRequest({
    request: () => getHttpClient().post(
      `${getApiBaseUrl()}${createUrl(jobId)}`,
      { training_ids: asArray(trainingIds) },
    ),
    formatMessage,
    fallbackMessage: aiTrainingMessages.createError,
  }),
  normalizeCreateJob,
);

/**
 * Poll create job status.
 */
export const fetchCreateJobStatus = async ({ formatMessage, createJobId }) => withNormalized(
  await executeApiRequest({
    request: () => getHttpClient().get(`${getApiBaseUrl()}${createJobStatusUrl(createJobId)}`),
    formatMessage,
    fallbackMessage: aiTrainingMessages.createError,
  }),
  normalizeCreateJob,
);

/**
 * Revert a single change-history event onto the extracted training.
 */
export const revertHistoryEvent = async ({ formatMessage, jobId, eventId }) => withNormalized(
  await executeApiRequest({
    request: () => getHttpClient().post(
      `${getApiBaseUrl()}${historyRevertUrl(jobId, eventId)}`,
      {},
    ),
    formatMessage,
    fallbackMessage: aiTrainingMessages.updateError,
  }),
  normalizeExtractedItem,
);
