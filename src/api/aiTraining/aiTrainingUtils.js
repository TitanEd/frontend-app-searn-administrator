/**
 * Helpers for AI training import domain.
 */

/**
 * Normalize public job ids to plain document pk strings.
 * Accepts ``52`` / ``"52"`` and legacy ``job_52``.
 */
export const normalizeAiJobId = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return '';
  }
  const legacy = /^job_(\d+)$/i.exec(raw);
  if (legacy) {
    return legacy[1];
  }
  return raw;
};

/**
 * Normalize backend processing timeline steps.
 * FE must render these labels from the API (not a hardcoded frontend list).
 */
export const normalizeProcessingSteps = (steps) => {
  if (!Array.isArray(steps)) {
    return [];
  }
  return steps
    .map((row, index) => {
      const item = row && typeof row === 'object' ? row : {};
      const key = String(item.key ?? item.id ?? item.step ?? '').trim();
      if (!key) {
        return null;
      }
      const orderValue = Number(item.order);
      return {
        key,
        label: String(item.label ?? item.message ?? key),
        order: Number.isFinite(orderValue) ? orderValue : index,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);
};

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
