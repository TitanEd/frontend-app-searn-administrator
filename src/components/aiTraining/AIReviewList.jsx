/* eslint-disable react/prop-types */
import { useIntl } from '@edx/frontend-platform/i18n';
import {
  faCheck,
  faCheckCircle,
  faHistory,
  faInfoCircle,
  faPencilAlt,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useId, useRef, useState } from 'react';
import { EmptyState } from '../emptyState';
import { hasDisplayValue } from '../../utils/hasDisplayValue';
import messages from '../../pages/uploadTrainingWithAi/messages';
import './AIReviewList.scss';

const INLINE_FIELDS = [
  { key: 'training_mode', labelKey: 'fieldMode', infoKey: 'fieldInfoMode' },
  { key: 'language', labelKey: 'fieldLanguage', infoKey: 'fieldInfoLanguage' },
  { key: 'domain', labelKey: 'fieldDomain', infoKey: 'fieldInfoDomain' },
  { key: 'sub_domain', labelKey: 'fieldSubDomain', infoKey: 'fieldInfoSubDomain' },
  { key: 'approach', labelKey: 'fieldApproach', infoKey: 'fieldInfoApproach' },
  { key: 'product_type', labelKey: 'fieldProductType', infoKey: 'fieldInfoProductType' },
  { key: 'duration', labelKey: 'fieldDuration', infoKey: 'fieldInfoDuration' },
  { key: 'cost', labelKey: 'fieldCost', infoKey: 'fieldInfoCost' },
];

const FieldInfoButton = ({ label, info }) => {
  const { formatMessage } = useIntl();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onPointerDown = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!hasDisplayValue(info)) {
    return null;
  }

  return (
    <span className="ai-review-list__info" ref={wrapRef}>
      <button
        type="button"
        className="ai-review-list__info-btn"
        aria-label={formatMessage(messages.fieldInfoAria, { field: label })}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={tooltipId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <FontAwesomeIcon icon={faInfoCircle} aria-hidden />
      </button>
      {open && (
        <span className="ai-review-list__tooltip" id={tooltipId} role="tooltip">
          {hasDisplayValue(label) && <strong>{label}</strong>}
          {info}
        </span>
      )}
    </span>
  );
};

const FieldLabel = ({ label, info }) => (
  <span className="ai-review-list__field-label">
    {label}
    <FieldInfoButton label={label} info={info} />
  </span>
);

const SuggestionChips = ({ label, suggestions = [], selected = [], disabled, onToggle }) => (
  <div className="ai-review-list__section">
    <span className="ai-review-list__section-label">{label}</span>
    <div className="ai-review-list__chips">
      {suggestions.map((item) => {
        const name = typeof item === 'string' ? item : item.name;
        if (!hasDisplayValue(name)) {
          return null;
        }
        const score = typeof item === 'object' ? Number(item.score || 0) : null;
        const isOn = selected.includes(name);
        const scoreClass = score >= 75 ? 'is-high' : score >= 50 ? 'is-mid' : 'is-low';
        return (
          <button
            key={name}
            type="button"
            className={`ai-review-list__chip ${isOn ? 'is-on' : ''}`}
            disabled={disabled}
            onClick={() => onToggle(name)}
          >
            <span className={`ai-review-list__chip-box ${isOn ? 'is-on' : ''}`}>
              {isOn && <FontAwesomeIcon icon={faCheck} aria-hidden />}
            </span>
            <span className="ai-review-list__chip-name">{name}</span>
            {score != null && (
              <span className={`ai-review-list__chip-score ${scoreClass}`}>{Math.round(score)}%</span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);

const AIReviewList = ({
  items = [],
  selected,
  onToggleSelect,
  onToggleMapping,
  onApprove,
  onEdit,
  onHistory,
  approving = new Set(),
  reanalyzing = new Set(),
  busy = false,
}) => {
  const { formatMessage } = useIntl();

  if (!items.length) {
    return <EmptyState message={formatMessage(messages.noResults)} />;
  }

  return (
    <div className="ai-review-list">
      {items.filter((training) => hasDisplayValue(training.id)).map((training) => {
        const canApprove = !training.created
          && (training.competencies || []).length > 0
          && (training.activities || []).length > 0;
        const isApproving = approving.has(training.id);
        const isReanalyzing = reanalyzing.has(training.id);
        const conf = Math.round((training.confidence || 0) * 100);

        return (
          <article key={training.id} className={`ai-review-list__card ${selected.has(training.id) ? 'is-selected' : ''} ${training.created ? 'is-created' : ''}`}>
            <div className="ai-review-list__check">
              {!training.created && (
                <input
                  type="checkbox"
                  checked={selected.has(training.id)}
                  disabled={!canApprove || busy || isReanalyzing}
                  onChange={() => onToggleSelect(training)}
                  aria-label={hasDisplayValue(training.training_name) ? training.training_name : formatMessage(messages.untitled)}
                />
              )}
            </div>
            <div className="ai-review-list__card-main">
              <div className="ai-review-list__title-row">
                <div>
                  <div className="ai-review-list__title-line">
                    <h3 className="ai-review-list__title">
                      {hasDisplayValue(training.training_name) ? training.training_name : formatMessage(messages.untitled)}
                    </h3>
                    {training.created && (
                      <span className="ai-review-list__badge is-created">
                        <FontAwesomeIcon icon={faCheckCircle} aria-hidden />
                        {formatMessage(messages.createdBadge)}
                      </span>
                    )}
                    {!training.created && training.edited && (
                      <span className="ai-review-list__badge is-edited">{formatMessage(messages.editedBadge)}</span>
                    )}
                  </div>
                  {hasDisplayValue(training.description) && (
                    <p className="ai-review-list__desc">{training.description}</p>
                  )}
                </div>
                <div className="ai-review-list__actions">
                  <button
                    type="button"
                    className="ai-review-list__btn is-outline"
                    disabled={busy || isReanalyzing}
                    onClick={() => onEdit(training)}
                  >
                    <FontAwesomeIcon icon={faPencilAlt} aria-hidden />
                    {formatMessage(messages.edit)}
                  </button>
                  {!training.created && (
                    <button
                      type="button"
                      className="ai-review-list__btn is-primary"
                      disabled={!canApprove || isApproving || busy || isReanalyzing}
                      onClick={() => onApprove(training)}
                    >
                      {isApproving
                        ? <FontAwesomeIcon icon={faSpinner} spin aria-hidden />
                        : <FontAwesomeIcon icon={faCheckCircle} aria-hidden />}
                      {isApproving ? formatMessage(messages.approving) : formatMessage(messages.approve)}
                    </button>
                  )}
                  <button
                    type="button"
                    className="ai-review-list__icon-btn"
                    aria-label={formatMessage(messages.history)}
                    title={formatMessage(messages.viewChangeHistory)}
                    disabled={busy || isReanalyzing}
                    onClick={() => onHistory(training)}
                  >
                    <FontAwesomeIcon icon={faHistory} aria-hidden />
                  </button>
                </div>
              </div>

              {isReanalyzing ? (
                <div className="ai-review-list__reanalyzing" role="status">
                  <FontAwesomeIcon icon={faSpinner} spin aria-hidden />
                  <span>{formatMessage(messages.reanalyzingHint)}</span>
                </div>
              ) : (
                <>
                  <SuggestionChips
                    label={formatMessage(messages.competenciesLabel)}
                    suggestions={training.competency_suggestions?.length
                      ? training.competency_suggestions
                      : (training.competencies || []).map((name) => ({ name, score: conf }))}
                    selected={training.competencies || []}
                    disabled={training.created || busy}
                    onToggle={(name) => onToggleMapping(training, 'competencies', name)}
                  />
                  <SuggestionChips
                    label={formatMessage(messages.activitiesLabel)}
                    suggestions={training.activity_suggestions?.length
                      ? training.activity_suggestions
                      : (training.activities || []).map((name) => ({ name, score: conf }))}
                    selected={training.activities || []}
                    disabled={training.created || busy}
                    onToggle={(name) => onToggleMapping(training, 'activities', name)}
                  />
                </>
              )}

              <div className="ai-review-list__fields">
                {INLINE_FIELDS.filter((field) => hasDisplayValue(training[field.key])).map((field) => (
                  <div key={field.key} className="ai-review-list__field">
                    <FieldLabel label={formatMessage(messages[field.labelKey])} info={formatMessage(messages[field.infoKey])} />
                    <p>{training[field.key]}</p>
                  </div>
                ))}
              </div>
              {!canApprove && !training.created && (
                <p className="ai-review-list__hint">{formatMessage(messages.needsCompetency)}</p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default AIReviewList;
