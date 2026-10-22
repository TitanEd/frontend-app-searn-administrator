/**
 * Helpers for AI training import domain.
 */
import { hasDisplayValue } from '../../utils/hasDisplayValue';

/**
 * Submit value for a catalog-style option (`{ id, value, label }`) or a plain string.
 */
export const optionSubmitValue = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if (hasDisplayValue(value.value)) {
      return String(value.value);
    }
    if (hasDisplayValue(value.name)) {
      return String(value.name);
    }
    if (hasDisplayValue(value.label)) {
      return String(value.label);
    }
    return '';
  }
  return value == null ? '' : String(value);
};

/**
 * Visible label for a catalog-style option or a plain string.
 */
export const optionDisplayLabel = (value) => {
  if (Array.isArray(value)) {
    return value.map(optionDisplayLabel).filter(hasDisplayValue).join(', ');
  }
  if (value && typeof value === 'object') {
    if (hasDisplayValue(value.label)) {
      return String(value.label);
    }
    if (hasDisplayValue(value.name)) {
      return String(value.name);
    }
    if (hasDisplayValue(value.value)) {
      return String(value.value);
    }
    return '';
  }
  return value == null ? '' : String(value);
};

/**
 * Map option-list API `results` to SearchableDropdown `{ value, label }` rows.
 */
export const mapAiTrainingOptionsToDropdown = (results) => {
  if (!Array.isArray(results)) {
    return [];
  }

  return results
    .filter((row) => hasDisplayValue(row?.value) && hasDisplayValue(row?.label))
    .map((row) => ({
      value: String(row.value),
      label: String(row.label),
    }));
};

/**
 * Match a selected API/form value onto a dropdown option `value`, same as catalog forms.
 */
export const matchAiTrainingOptionValue = (options = [], rawValue = '') => {
  const selected = optionSubmitValue(rawValue);
  if (!hasDisplayValue(selected)) {
    return '';
  }

  const match = (Array.isArray(options) ? options : []).find((option) => (
    option.value === selected || option.label === selected
  ));

  return match?.value ?? selected;
};

export const matchAiTrainingOptionValues = (options = [], rawValues = []) => {
  if (!Array.isArray(rawValues)) {
    return [];
  }

  return rawValues
    .map((value) => matchAiTrainingOptionValue(options, value))
    .filter((value) => hasDisplayValue(value));
};

/**
 * Dropdown/multiselect options from extracted suggestions or selected rows.
 */
export const mapAiTrainingChoiceOptions = (rows = []) => (
  (Array.isArray(rows) ? rows : [])
    .map((row) => {
      const value = optionSubmitValue(row);
      const label = optionDisplayLabel(row);
      if (!hasDisplayValue(value) && !hasDisplayValue(label)) {
        return null;
      }
      return {
        value: value || label,
        label: label || value,
      };
    })
    .filter(Boolean)
);


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
  edited_pending: all.filter((t) => !t.created && (t.edited || optionSubmitValue(t.status) === 'edited')).length,
  pending: all.filter((t) => !t.created && !(t.edited || optionSubmitValue(t.status) === 'edited')).length,
});
