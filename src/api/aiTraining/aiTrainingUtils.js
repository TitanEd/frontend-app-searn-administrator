/**
 * Helpers for AI training import domain.
 */

export const STEP_ORDER = [
  'validating_document',
  'reading_document',
  'extracting_data',
  'identifying_trainings',
  'mapping_fields',
  'mapping_competencies',
  'mapping_activities',
  'validating_records',
  'preparing_results',
  'completed',
];

export const fileTypeFromName = (fileName) => {
  if (!fileName || typeof fileName !== 'string') {
    return '';
  }
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop().toUpperCase() : '';
};

export const formatUploadedAt = (iso) => {
  if (!iso) {
    return '';
  }
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

export const formatFileSize = (bytes) => {
  if (bytes == null || Number.isNaN(bytes)) {
    return '';
  }
  return bytes >= 1048576
    ? `${(bytes / 1048576).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

/**
 * Build summary stats from a list of extracted trainings.
 * @param {Array} all
 */
export const buildExtractedSummary = (all = []) => ({
  total: all.length,
  approved: all.filter((t) => t.created).length,
  edited_pending: all.filter((t) => !t.created && (t.edited || t.status === 'edited')).length,
  pending: all.filter((t) => !t.created && !(t.edited || t.status === 'edited')).length,
});
