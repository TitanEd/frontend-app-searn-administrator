/* eslint-disable no-promise-executor-return, no-param-reassign */
/**
 * AI Training upload / extract / create API.
 * Currently mock-backed via data/aiTraining/mockImports.
 * Swap bodies to real HTTP (executeApiRequest + endpoints) when backend is ready.
 */
import { AI_TRAINING_IMPORT_HISTORY_PAGE_SIZE, AI_TRAINING_REVIEW_PAGE_SIZE } from '../endpoints';
import MOCK_IMPORTS, {
  MOCK_CHANGE_HISTORY,
  MOCK_EXTRACTED,
} from '../../data/aiTraining/mockImports';
import { buildReviewExtracted } from '../../mock/uploadTrainingWithAi/buildReviewExtracted';
import PROCESSING_STEPS from '../../mock/uploadTrainingWithAi/processingSteps.json';
import { STEP_ORDER, buildExtractedSummary } from './aiTrainingUtils';
import aiTrainingMessages from './aiTrainingMessages';

export { STEP_ORDER } from './aiTrainingUtils';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const store = {
  imports: MOCK_IMPORTS.map((r) => ({ ...r })),
  extracted: JSON.parse(JSON.stringify(MOCK_EXTRACTED)),
  jobs: {},
  createJobs: {},
  history: JSON.parse(JSON.stringify(MOCK_CHANGE_HISTORY)),
};

const ok = (data) => ({ ok: true, data, message: null });
const fail = (message) => ({ ok: false, data: null, message });

const markCreated = (items, createdCount) => {
  const count = Math.max(0, Math.min(Number(createdCount) || 0, items.length));
  return items.map((item, index) => (
    index < count
      ? { ...item, created: true, status: 'created', edited: false }
      : item
  ));
};

const ensureExtracted = (jobId) => {
  if (!Array.isArray(store.extracted[jobId])) {
    const imp = store.imports.find((row) => row.job_id === jobId);
    if (!imp) {
      return null;
    }
    const total = Number(imp.total_records) || 0;
    const created = Number(imp.created) || 0;
    store.extracted[jobId] = total > 0
      ? markCreated(buildReviewExtracted(jobId, total), created)
      : [];
  }

  store.extracted[jobId] = store.extracted[jobId].map((item, index) => ({
    ...item,
    id: item.id || `${jobId}_t${index + 1}`,
  }));
  return store.extracted[jobId];
};

const asCount = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

/**
 * List AI document import history.
 * @param {{ formatMessage: Function, page?: number, pageSize?: number }} params
 */
export const fetchImportHistory = async ({
  formatMessage,
  page = 1,
  pageSize = AI_TRAINING_IMPORT_HISTORY_PAGE_SIZE,
}) => {
  try {
    const sorted = store.imports
      .map((row) => ({
        ...row,
        total_records: asCount(row.total_records),
        created: asCount(row.created),
        needs_review: asCount(row.needs_review),
        failed: asCount(row.failed),
      }))
      .sort((left, right) => new Date(right.uploaded_at) - new Date(left.uploaded_at));
    const currentPage = Math.max(1, Number(page) || 1);
    const size = Math.max(1, Number(pageSize) || AI_TRAINING_IMPORT_HISTORY_PAGE_SIZE);
    const count = sorted.length;
    const totalPages = Math.max(1, Math.ceil(count / size));
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * size;
    return ok({
      results: sorted.slice(start, start + size),
      count,
      page: safePage,
      page_size: size,
      total_pages: totalPages,
    });
  } catch {
    return fail(formatMessage(aiTrainingMessages.historyLoadError));
  }
};

/**
 * Single import details.
 * @param {{ formatMessage: Function, jobId: string }} params
 */
export const fetchImportDetails = async ({ formatMessage, jobId }) => {
  const record = store.imports.find((r) => r.job_id === jobId);
  if (!record) {
    return fail(formatMessage(aiTrainingMessages.jobNotFound));
  }
  return ok({ ...record });
};

/**
 * Change history for a job.
 * @param {{ jobId: string }} params
 */
export const fetchChangeHistory = async ({ jobId }) => {
  return ok(JSON.parse(JSON.stringify(store.history[jobId] || [])));
};

/**
 * Upload a training document and start AI processing.
 * @param {{ formatMessage: Function, file: File, onProgress?: (pct: number) => void }} params
 */
export const uploadTrainingDocument = async ({ formatMessage, file, fileName, onProgress }) => {
  if (!file) {
    return fail(formatMessage(aiTrainingMessages.uploadError));
  }
  const name = fileName || file.name || 'document.pdf';
  const ext = name.split('.').pop()?.toLowerCase();
  const allowed = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'csv', 'txt'];
  if (ext && !allowed.includes(ext)) {
    return fail(formatMessage(aiTrainingMessages.unsupportedFile));
  }

  try {
    for (let p = 10; p <= 100; p += 15) {
      await delay(120);
      if (typeof onProgress === 'function') {
        onProgress(Math.min(100, p));
      }
    }

    const jobId = `job_${Date.now()}`;
    const now = new Date().toISOString();

    store.jobs[jobId] = {
      job_id: jobId,
      status: 'processing',
      current_step: 'validating_document',
      progress: 8,
      message: 'Validating your document...',
      total_records: 0,
      processed_records: 0,
      error: null,
      started_at: now,
    };

    store.imports.unshift({
      job_id: jobId,
      file_name: name,
      uploaded_by: 'You',
      uploaded_at: now,
      total_records: 0,
      created: 0,
      needs_review: 0,
      failed: 0,
      status: 'processing',
      timeline: [{ at: now, label: 'Document uploaded' }],
    });

    const template = store.extracted.job_seed_template || store.extracted.job_seed_2026 || [];
    store.extracted[jobId] = template.map((t, i) => ({
      ...JSON.parse(JSON.stringify(t)),
      id: `${jobId}_t${i + 1}`,
      source_file: name,
      created: false,
      status: 'needs_review',
    }));

    runProcessingSimulation(jobId);
    return ok({ job_id: jobId });
  } catch {
    return fail(formatMessage(aiTrainingMessages.uploadError));
  }
};

function runProcessingSimulation(jobId) {
  const steps = PROCESSING_STEPS.map((step, index) => ({
    step: step.id,
    progress: Math.round(((index + 1) / (PROCESSING_STEPS.length + 1)) * 100),
    message: `${step.label}...`,
    wait: 800,
  }));
  steps.push({
    step: 'completed',
    progress: 100,
    message: 'Processing complete.',
    wait: 400,
  });

  let i = 0;
  const tick = async () => {
    const job = store.jobs[jobId];
    if (!job || job.status === 'failed') {
      return;
    }
    const s = steps[i];
    if (!s) {
      return;
    }
    job.current_step = s.step;
    job.progress = s.progress;
    job.message = s.message;
    const items = store.extracted[jobId] || [];
    if (s.step === 'identifying_trainings') {
      job.total_records = items.length;
      job.processed_records = Math.min(items.length, Math.ceil(items.length * 0.4));
    }
    if (s.step === 'mapping_activities' || s.step === 'preparing_results') {
      job.processed_records = items.length;
      job.total_records = items.length;
    }
    if (s.step === 'completed') {
      job.status = 'completed';
      const imp = store.imports.find((r) => r.job_id === jobId);
      if (imp) {
        imp.status = 'completed';
        imp.total_records = items.length;
        imp.needs_review = items.filter((t) => !t.created).length;
        imp.created = items.filter((t) => t.created).length;
        imp.timeline = [
          ...(imp.timeline || []),
          { at: new Date().toISOString(), label: 'AI extraction completed' },
          { at: new Date().toISOString(), label: 'Competency matching completed' },
        ];
      }
      return;
    }
    i += 1;
    await delay(s.wait);
    tick();
  };
  tick();
}

/**
 * Poll AI processing status for a job.
 * @param {{ formatMessage: Function, jobId: string }} params
 */
export const fetchProcessingStatus = async ({ formatMessage, jobId }) => {
  const job = store.jobs[jobId];
  if (!job) {
    if (store.extracted[jobId]) {
      const items = store.extracted[jobId] || [];
      return ok({
        job_id: jobId,
        status: 'completed',
        current_step: 'completed',
        progress: 100,
        message: 'Processing complete.',
        total_records: items.length,
        processed_records: items.length,
        error: null,
      });
    }
    return fail(formatMessage(aiTrainingMessages.jobNotFound));
  }
  return ok({ ...job });
};

/**
 * Paginated extracted trainings for review.
 * @param {{ formatMessage: Function, jobId: string, page?: number, pageSize?: number, search?: string }} params
 */
export const fetchExtractedTrainings = async ({
  formatMessage,
  jobId,
  page = 1,
  pageSize = AI_TRAINING_REVIEW_PAGE_SIZE,
  search = '',
  filters = { confidence: 'all', created: 'all' },
}) => {
  const extracted = ensureExtracted(jobId);
  if (!extracted) {
    return fail(formatMessage(aiTrainingMessages.resultsLoadError));
  }
  let items = extracted;
  items = items.map((t) => ({
    ...t,
    edited: Boolean(t.edited || t.status === 'edited'),
  }));

  const q = String(search || '').trim().toLowerCase();
  if (q) {
    items = items.filter(
      (t) => (t.training_name || '').toLowerCase().includes(q)
        || (t.description || '').toLowerCase().includes(q)
        || (t.domain || '').toLowerCase().includes(q)
        || (t.sub_domain || '').toLowerCase().includes(q)
        || (t.provider || '').toLowerCase().includes(q)
        || (t.competencies || []).some((value) => String(value).toLowerCase().includes(q))
        || (t.activities || []).some((value) => String(value).toLowerCase().includes(q)),
    );
  }

  if (filters?.created === 'created') {
    items = items.filter((t) => t.created);
  } else if (filters?.created === 'not_created') {
    items = items.filter((t) => !t.created);
  }

  if (filters?.confidence === 'high') {
    items = items.filter((t) => Number(t.confidence || 0) >= 0.75);
  } else if (filters?.confidence === 'medium') {
    items = items.filter((t) => Number(t.confidence || 0) >= 0.5 && Number(t.confidence || 0) < 0.75);
  } else if (filters?.confidence === 'low') {
    items = items.filter((t) => Number(t.confidence || 0) < 0.5);
  }

  const total = items.length;
  const matchingIds = items
    .filter((t) => !t.created && (t.activities || []).length > 0 && (t.competencies || []).length > 0)
    .map((t) => t.id);
  const size = Math.max(1, Number(pageSize) || AI_TRAINING_REVIEW_PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / size) || 1);
  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const start = (currentPage - 1) * size;
  const pageItems = items.slice(start, start + size);
  const all = store.extracted[jobId] || [];

  return ok({
    items: pageItems,
    page: currentPage,
    page_size: size,
    total,
    total_pages: totalPages,
    matching_ids: matchingIds,
    summary: buildExtractedSummary(all),
  });
};

/**
 * Toggle competencies / activities arrays.
 * @param {{ formatMessage: Function, jobId: string, trainingId: string, payload: object }} params
 */
export const updateMappings = async ({ formatMessage, jobId, trainingId, payload }) => {
  const list = store.extracted[jobId];
  if (!list) {
    return fail(formatMessage(aiTrainingMessages.jobNotFound));
  }
  const idx = list.findIndex((t) => t.id === trainingId);
  if (idx < 0) {
    return fail(formatMessage(aiTrainingMessages.updateError));
  }
  const next = {
    ...list[idx],
    ...payload,
    status: list[idx].status === 'needs_review' ? 'edited' : list[idx].status,
    edited: !list[idx].created,
  };
  list[idx] = next;
  pushHistory(jobId, next, payload);
  return ok({ ...next });
};

/**
 * Full field update from edit drawer.
 * @param {{ formatMessage: Function, jobId: string, trainingId: string, payload: object }} params
 */
export const updateExtractedTraining = async ({ formatMessage, jobId, trainingId, payload }) => {
  const list = store.extracted[jobId];
  if (!list) {
    return fail(formatMessage(aiTrainingMessages.jobNotFound));
  }
  const idx = list.findIndex((t) => t.id === trainingId);
  if (idx < 0) {
    return fail(formatMessage(aiTrainingMessages.updateError));
  }
  const prev = list[idx];
  const next = { ...prev, ...payload, status: 'edited', edited: !prev.created };
  list[idx] = next;
  pushHistory(jobId, next, payload, prev);
  return ok({ ...next });
};

/**
 * Mock-backed re-analysis of competency/activity mappings.
 * Replace this adapter with the real AI re-analysis endpoint when available.
 */
export const reanalyzeExtractedTraining = async ({ formatMessage, jobId, trainingId }) => {
  const list = store.extracted[jobId];
  if (!list) return fail(formatMessage(aiTrainingMessages.jobNotFound));
  const index = list.findIndex((item) => item.id === trainingId);
  if (index < 0) return fail(formatMessage(aiTrainingMessages.updateError));

  const current = list[index];
  const selectedSuggestions = [
    ...(current.competency_suggestions || []).filter((item) => (current.competencies || []).includes(item.name)),
    ...(current.activity_suggestions || []).filter((item) => (current.activities || []).includes(item.name)),
  ];
  const confidence = selectedSuggestions.length
    ? selectedSuggestions.reduce((sum, item) => sum + Number(item.score || 0), 0) / selectedSuggestions.length / 100
    : Number(current.confidence || 0);
  const updated = { ...current, confidence, status: current.created ? current.status : 'edited' };
  list[index] = updated;
  if (!store.history[jobId]) store.history[jobId] = [];
  store.history[jobId].unshift({
    id: `ev_${Date.now()}_reanalyze`,
    training_id: updated.id,
    actor: 'AI',
    training_name: updated.training_name,
    field: 'competencies and activities',
    before: '',
    after: `Re-analysis completed. Match score: ${Math.round(confidence * 100)}%`,
    timestamp: new Date().toISOString(),
  });
  return ok({ ...updated });
};

/**
 * Start bulk create job for selected training ids.
 * @param {{ formatMessage: Function, jobId: string, trainingIds: string[] }} params
 */
export const createTrainings = async ({ formatMessage, jobId, trainingIds }) => {
  const list = store.extracted[jobId];
  if (!list) {
    return fail(formatMessage(aiTrainingMessages.jobNotFound));
  }
  if (!trainingIds?.length) {
    return fail(formatMessage(aiTrainingMessages.createError));
  }

  const createJobId = `create_${Date.now()}`;
  store.createJobs[createJobId] = {
    create_job_id: createJobId,
    status: 'processing',
    created: 0,
    failed: 0,
    remaining: trainingIds.length,
    progress: 0,
    total: trainingIds.length,
    failures: [],
  };

  setTimeout(() => {
    let created = 0;
    let failed = 0;
    const failures = [];
    trainingIds.forEach((id) => {
      const idx = list.findIndex((t) => t.id === id);
      if (idx < 0) {
        failed += 1;
        failures.push({ id, training_name: id, reason: 'Record not found' });
        return;
      }
      const item = list[idx];
      if (!item.competencies?.length || !item.activities?.length) {
        failed += 1;
        failures.push({ id, training_name: item.training_name, reason: 'Missing competency or activity' });
        return;
      }
      list[idx] = { ...item, created: true, status: 'created', edited: false };
      created += 1;
    });
    store.createJobs[createJobId] = {
      create_job_id: createJobId,
      status: 'completed',
      created,
      failed,
      remaining: 0,
      progress: 100,
      total: trainingIds.length,
      failures,
    };
    const imp = store.imports.find((r) => r.job_id === jobId);
    if (imp) {
      const all = store.extracted[jobId] || [];
      imp.created = all.filter((t) => t.created).length;
      imp.needs_review = all.filter((t) => !t.created).length;
    }
  }, 1500);

  return ok({ ...store.createJobs[createJobId] });
};

/**
 * Poll create job status.
 * @param {{ formatMessage: Function, createJobId: string }} params
 */
export const fetchCreateJobStatus = async ({ formatMessage, createJobId }) => {
  const job = store.createJobs[createJobId];
  if (!job) {
    return fail(formatMessage(aiTrainingMessages.createError));
  }
  return ok({ ...job });
};

function serializeHistoryValue(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value == null) {
    return '';
  }
  return value;
}

function valuesEqual(left, right) {
  return JSON.stringify(serializeHistoryValue(left)) === JSON.stringify(serializeHistoryValue(right));
}

function pushHistory(jobId, training, payload, prev) {
  if (!store.history[jobId]) {
    store.history[jobId] = [];
  }
  Object.keys(payload || {}).forEach((field) => {
    const before = prev ? serializeHistoryValue(prev[field]) : '';
    const after = serializeHistoryValue(payload[field]);
    if (valuesEqual(before, after)) {
      return;
    }
    store.history[jobId].unshift({
      id: `ev_${Date.now()}_${field}`,
      training_id: training.id,
      actor: 'User',
      training_name: training.training_name,
      field,
      before,
      after,
      timestamp: new Date().toISOString(),
    });
  });
}

/**
 * Revert a single change-history event onto the extracted training.
 */
export const revertHistoryEvent = async ({ formatMessage, jobId, eventId }) => {
  const events = store.history[jobId] || [];
  const event = events.find((entry) => entry.id === eventId);
  const list = store.extracted[jobId];
  if (!event || !list) {
    return fail(formatMessage(aiTrainingMessages.updateError));
  }
  const idx = list.findIndex((item) => item.id === event.training_id);
  if (idx < 0) {
    return fail(formatMessage(aiTrainingMessages.updateError));
  }
  const prev = list[idx];
  const next = {
    ...prev,
    [event.field]: event.before,
    status: prev.created ? prev.status : 'edited',
  };
  list[idx] = next;
  pushHistory(jobId, next, { [event.field]: event.before }, prev);
  return ok({ ...next });
};
