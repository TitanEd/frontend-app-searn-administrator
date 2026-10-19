/* eslint-disable react/prop-types */
import { useIntl } from '@edx/frontend-platform/i18n';
import { faSpinner, faUndo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useMemo, useState } from 'react';
import catalogOptions from '../../mock/uploadTrainingWithAi/options.json';
import useChangeHistory from '../../hooks/aiTraining/useChangeHistory';
import MultiSelectInput from '../multiSelectInput/MultiSelectInput';
import PopupDialog from '../popupDialog/PopupDialog';
import SearchableDropdown from '../searchableDropdown/SearchableDropdown';
import { SkeletonScreen, SKELETON_VARIANTS } from '../skeleton';
import { hasDisplayValue } from '../../utils/hasDisplayValue';
import messages from '../../pages/uploadTrainingWithAi/messages';
import './ExtractedTrainingDrawer.scss';

const REGISTRATION_URL = 'URL';
const REGISTRATION_EMAIL = 'Email';

const HISTORY_FIELD_MESSAGES = {
  training_name: messages.drawerTrainingName,
  description: messages.drawerDescription,
  domain: messages.drawerDomain,
  sub_domain: messages.drawerSubDomain,
  language: messages.drawerLanguage,
  duration: messages.drawerDuration,
  cost: messages.drawerCost,
  training_mode: messages.drawerTrainingMode,
  approach: messages.drawerApproach,
  evaluation: messages.drawerEvaluation,
  outcome: messages.drawerOutcome,
  competencies: messages.drawerCompetencies,
  activities: messages.drawerActivities,
  nra_objectives: messages.drawerNraObjectives,
  product_type: messages.drawerProductType,
  registration_by: messages.drawerRegistrationBy,
  registration_value: messages.drawerRegistrationValue,
};

const AiIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    <path d="M20 3v4" />
    <path d="M22 5h-4" />
    <path d="M4 17v2" />
    <path d="M5 18H3" />
  </svg>
);

const formatHistoryValue = (value) => {
  if (Array.isArray(value)) return value.join(', ');
  if (value == null) return '';
  return String(value);
};

const mergeSelectOptions = (options = [], selected) => {
  const catalog = options.filter((item) => hasDisplayValue(item?.value));
  const selectedList = Array.isArray(selected)
    ? selected
    : (hasDisplayValue(selected) ? [selected] : []);
  const extras = selectedList
    .filter((value) => hasDisplayValue(value) && !catalog.some((item) => String(item.value) === String(value)))
    .map((value) => ({ id: String(value), value, label: value }));
  return [...extras, ...catalog];
};

const optionLabel = (options, value, fallback) => {
  const match = options.find((item) => String(item.value) === String(value));
  if (hasDisplayValue(match?.label)) {
    return match.label;
  }
  if (hasDisplayValue(value)) {
    return value;
  }
  return fallback;
};

const ExtractedTrainingDrawer = ({
  open,
  training,
  jobId,
  tab = 'edit',
  onClose,
  onSave,
  onCreateOne,
  onRevert,
  isSaving = false,
}) => {
  const { formatMessage } = useIntl();
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState(null);
  const { events, isLoading: historyLoading } = useChangeHistory({
    jobId,
    trainingId: training?.id,
    trainingName: training?.training_name,
    enabled: open && tab === 'history',
  });

  useEffect(() => {
    if (!training) {
      setDraft(null);
      return;
    }
    setDraft({
      ...training,
      product_type: training.product_type || '',
      registration_by: training.registration_by === REGISTRATION_EMAIL
        ? REGISTRATION_EMAIL
        : REGISTRATION_URL,
      registration_value: training.registration_value || '',
      nra_objectives: Array.isArray(training.nra_objectives) ? [...training.nra_objectives] : [],
      competencies: Array.isArray(training.competencies) ? [...training.competencies] : [],
      activities: Array.isArray(training.activities) ? [...training.activities] : [],
    });
    setError(null);
  }, [training, tab]);

  const suggestionToOptions = (suggestions = []) => (
    suggestions
      .map((item) => {
        const name = typeof item === 'string' ? item : item?.name;
        if (!hasDisplayValue(name)) return null;
        const score = typeof item === 'object' ? Number(item.score || 0) : null;
        return {
          id: (typeof item === 'object' && item.id) || name,
          value: name,
          label: score != null && Number.isFinite(score) ? `${name} (${Math.round(score)}%)` : name,
        };
      })
      .filter(Boolean)
  );

  // Prefer AI suggestions from this training (not global mock catalog) so checks match the card.
  const competencyOptions = useMemo(
    () => mergeSelectOptions(
      suggestionToOptions(training?.competency_suggestions).length
        ? suggestionToOptions(training?.competency_suggestions)
        : (catalogOptions.competencies?.results || []),
      draft?.competencies,
    ),
    [training?.competency_suggestions, draft?.competencies],
  );
  const activityOptions = useMemo(
    () => mergeSelectOptions(
      suggestionToOptions(training?.activity_suggestions).length
        ? suggestionToOptions(training?.activity_suggestions)
        : (catalogOptions.activities?.results || []),
      draft?.activities,
    ),
    [training?.activity_suggestions, draft?.activities],
  );
  const nraObjectiveOptions = useMemo(
    () => mergeSelectOptions(catalogOptions.nraObjectives?.results, draft?.nra_objectives),
    [draft?.nra_objectives],
  );
  const languageOptions = useMemo(
    () => mergeSelectOptions(catalogOptions.languages?.results, draft?.language),
    [draft?.language],
  );
  const modeOptions = useMemo(
    () => mergeSelectOptions(catalogOptions.modes?.results, draft?.training_mode),
    [draft?.training_mode],
  );
  const approachOptions = useMemo(
    () => mergeSelectOptions(catalogOptions.approaches?.results, draft?.approach),
    [draft?.approach],
  );
  const evaluationOptions = useMemo(
    () => mergeSelectOptions(catalogOptions.evaluations?.results, draft?.evaluation),
    [draft?.evaluation],
  );
  const outcomeOptions = useMemo(
    () => mergeSelectOptions(catalogOptions.outcomes?.results, draft?.outcome),
    [draft?.outcome],
  );
  const productTypeOptions = useMemo(
    () => mergeSelectOptions(catalogOptions.productTypes?.results, draft?.product_type),
    [draft?.product_type],
  );

  if (!open || !training || !draft) {
    return null;
  }

  const setField = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));
  const dropdownSearchPlaceholder = formatMessage(messages.dropdownSearchPlaceholder);
  const dropdownNoOptions = formatMessage(messages.dropdownNoOptions);
  const registrationId = hasDisplayValue(training.id) ? training.id : 'training';

  const persist = async (options) => {
    try {
      setError(null);
      await onSave({
        training_name: draft.training_name,
        description: draft.description,
        domain: draft.domain,
        sub_domain: draft.sub_domain,
        language: draft.language,
        duration: draft.duration,
        cost: draft.cost,
        training_mode: draft.training_mode,
        approach: draft.approach,
        evaluation: draft.evaluation,
        outcome: draft.outcome,
        product_type: draft.product_type,
        registration_by: draft.registration_by,
        registration_value: draft.registration_value,
        nra_objectives: draft.nra_objectives,
        activities: draft.activities,
        competencies: draft.competencies,
      }, options);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  if (tab === 'history') {
    return (
      <PopupDialog
        isOpen={open}
        title={formatMessage(messages.historyDialogTitle)}
        onClose={onClose}
        contentClassName="ai-training-dialog ai-training-dialog--history"
      >
        {hasDisplayValue(training.training_name) && (
          <p className="ai-drawer__subtitle">{training.training_name}</p>
        )}
        {historyLoading ? (
          <SkeletonScreen
            variant={SKELETON_VARIANTS.CARD_LIST}
            rows={3}
            hasHeader={false}
            ariaLabel={formatMessage(messages.historyListDialogLoading)}
          />
        ) : events.length === 0 ? (
          <p className="ai-drawer__history-empty">{formatMessage(messages.drawerHistoryEmpty)}</p>
        ) : (
          <div className="ai-drawer__history-list">
            {events.filter((event) => hasDisplayValue(event.id)).map((event) => {
              const actorName = hasDisplayValue(event.actor)
                ? event.actor
                : formatMessage(messages.historyActorUser);
              const actorKey = String(actorName).toLowerCase();
              const isAiEvent = actorKey === 'ai';
              const isSystemEvent = actorKey === 'system';
              const canRevert = !isAiEvent && !isSystemEvent;
              const fieldMessage = HISTORY_FIELD_MESSAGES[event.field];
              const fieldLabel = fieldMessage
                ? formatMessage(fieldMessage)
                : (event.field && event.field !== 'created'
                  ? event.field
                  : (isSystemEvent ? '' : formatMessage(messages.drawerTrainingUpdated)));
              return (
                <article className="ai-drawer__history-item" key={event.id}>
                  <div className="ai-drawer__history-meta">
                    <span className={`ai-drawer__actor ${isAiEvent ? 'is-ai' : ''} ${isSystemEvent ? 'is-system' : ''}`}>
                      {isAiEvent
                        ? formatMessage(messages.historyActorAi)
                        : isSystemEvent
                          ? formatMessage(messages.historyActorSystem)
                          : formatMessage(messages.historyActorEdited, { name: actorName })}
                    </span>
                    {hasDisplayValue(event.timestamp) && (
                      <time>{new Date(event.timestamp).toLocaleString()}</time>
                    )}
                  </div>
                  {hasDisplayValue(fieldLabel) && (
                    <strong className="ai-drawer__history-field">{fieldLabel}</strong>
                  )}
                  {hasDisplayValue(formatHistoryValue(event.before)) && (
                    <p className="ai-drawer__history-before">
                      {formatMessage(messages.drawerBefore)} {formatHistoryValue(event.before)}
                    </p>
                  )}
                  {hasDisplayValue(formatHistoryValue(event.after)) && (
                    <p className="ai-drawer__history-after">
                      {formatMessage(messages.drawerAfter)} {formatHistoryValue(event.after)}
                    </p>
                  )}
                  {canRevert && (
                    <button type="button" className="ai-drawer__outline-button" disabled={isSaving} onClick={() => onRevert?.(event)}>
                      <FontAwesomeIcon icon={faUndo} aria-hidden />
                      {formatMessage(messages.revertAndSave)}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
        <div className="ai-drawer__footer">
          <button type="button" className="ai-drawer__primary-button" onClick={onClose}>
            {formatMessage(messages.closeDrawer)}
          </button>
        </div>
      </PopupDialog>
    );
  }

  return (
    <PopupDialog
      isOpen={open}
      title={formatMessage(messages.editTrainingTitle)}
      onClose={onClose}
      contentClassName="ai-training-dialog"
    >
      <p className="ai-drawer__subtitle">
        <span className="ai-drawer__ai-icon">
          <AiIcon />
        </span>
        {formatMessage(messages.aiExtractedConfidence, { score: Math.round((training.confidence || 0) * 100) })}
      </p>
      {hasDisplayValue(error) && <p className="ai-drawer__error">{error}</p>}

      <section className="ai-drawer__section">
        <h3>{formatMessage(messages.mappedSection)}</h3>
        <div className="ai-drawer__grid">
          <div className="ai-drawer__field">
            <span className="ai-drawer__label">{formatMessage(messages.drawerCompetencies)}</span>
            <MultiSelectInput
              options={competencyOptions}
              selectedValues={draft.competencies}
              onChange={(values) => setField('competencies', values)}
              searchPlaceholder={formatMessage(messages.searchCompetencies)}
              noOptionsText={dropdownNoOptions}
              disabled={isSaving}
            />
          </div>
          <div className="ai-drawer__field">
            <span className="ai-drawer__label">{formatMessage(messages.drawerActivities)}</span>
            <MultiSelectInput
              options={activityOptions}
              selectedValues={draft.activities}
              onChange={(values) => setField('activities', values)}
              searchPlaceholder={formatMessage(messages.searchActivities)}
              noOptionsText={dropdownNoOptions}
              disabled={isSaving}
            />
          </div>
        </div>
      </section>

      <div className="ai-drawer__grid">
        <section className="ai-drawer__section">
          <h3>{formatMessage(messages.basicSection)}</h3>
          <div className="ai-drawer__fields">
            <label className="ai-drawer__label" htmlFor="ai-edit-training-name">
              {formatMessage(messages.drawerTrainingName)}
            </label>
            <input
              id="ai-edit-training-name"
              className="ai-drawer__input"
              value={draft.training_name || ''}
              onChange={(event) => setField('training_name', event.target.value)}
              disabled={isSaving}
            />

            <label className="ai-drawer__label" htmlFor="ai-edit-description">
              {formatMessage(messages.drawerDescription)}
            </label>
            <textarea
              id="ai-edit-description"
              className="ai-drawer__textarea"
              rows={5}
              value={draft.description || ''}
              onChange={(event) => setField('description', event.target.value)}
              disabled={isSaving}
            />

            <div className="ai-drawer__row">
              <div className="ai-drawer__field">
                <span className="ai-drawer__label">{formatMessage(messages.drawerLanguage)}</span>
                <SearchableDropdown
                  value={draft.language}
                  options={languageOptions}
                  onChange={(value) => setField('language', value)}
                  triggerLabel={optionLabel(languageOptions, draft.language, formatMessage(messages.drawerLanguage))}
                  searchPlaceholder={dropdownSearchPlaceholder}
                  noOptionsText={dropdownNoOptions}
                  disabled={isSaving}
                />
              </div>
              <div className="ai-drawer__field">
                <label className="ai-drawer__label" htmlFor="ai-edit-duration">
                  {formatMessage(messages.drawerDuration)}
                </label>
                <input
                  id="ai-edit-duration"
                  className="ai-drawer__input"
                  value={draft.duration || ''}
                  onChange={(event) => setField('duration', event.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>

            <label className="ai-drawer__label" htmlFor="ai-edit-cost">
              {formatMessage(messages.drawerCost)}
            </label>
            <input
              id="ai-edit-cost"
              className="ai-drawer__input"
              value={draft.cost || ''}
              onChange={(event) => setField('cost', event.target.value)}
              disabled={isSaving}
            />
          </div>
        </section>

        <section className="ai-drawer__section">
          <h3>{formatMessage(messages.detailsSection)}</h3>
          <div className="ai-drawer__fields">
            {[
              ['training_mode', messages.drawerTrainingMode, modeOptions],
              ['approach', messages.drawerApproach, approachOptions],
              ['evaluation', messages.drawerEvaluation, evaluationOptions],
              ['outcome', messages.drawerOutcome, outcomeOptions],
              ['product_type', messages.drawerProductType, productTypeOptions],
            ].map(([key, label, options]) => (
              <div key={key} className="ai-drawer__field">
                <span className="ai-drawer__label">{formatMessage(label)}</span>
                <SearchableDropdown
                  value={draft[key]}
                  options={options}
                  onChange={(value) => setField(key, value)}
                  triggerLabel={optionLabel(options, draft[key], formatMessage(label))}
                  searchPlaceholder={dropdownSearchPlaceholder}
                  noOptionsText={dropdownNoOptions}
                  disabled={isSaving}
                />
              </div>
            ))}

            <div className="ai-drawer__field">
              <span className="ai-drawer__label">{formatMessage(messages.drawerNraObjectives)}</span>
              <MultiSelectInput
                options={nraObjectiveOptions}
                selectedValues={draft.nra_objectives}
                onChange={(values) => setField('nra_objectives', values)}
                searchPlaceholder={formatMessage(messages.searchObjectives)}
                noOptionsText={dropdownNoOptions}
                disabled={isSaving}
              />
            </div>

            <div className="ai-drawer__registration">
              <span className="ai-drawer__label">{formatMessage(messages.drawerRegistrationBy)}</span>
              <div className="ai-drawer__radio-group">
                <label className="ai-drawer__radio" htmlFor={`ai-edit-reg-url-${registrationId}`}>
                  <input
                    id={`ai-edit-reg-url-${registrationId}`}
                    type="radio"
                    name={`ai-edit-registration-${registrationId}`}
                    checked={draft.registration_by === REGISTRATION_URL}
                    onChange={() => setField('registration_by', REGISTRATION_URL)}
                    disabled={isSaving}
                  />
                  {formatMessage(messages.registrationUrl)}
                </label>
                <label className="ai-drawer__radio" htmlFor={`ai-edit-reg-email-${registrationId}`}>
                  <input
                    id={`ai-edit-reg-email-${registrationId}`}
                    type="radio"
                    name={`ai-edit-registration-${registrationId}`}
                    checked={draft.registration_by === REGISTRATION_EMAIL}
                    onChange={() => setField('registration_by', REGISTRATION_EMAIL)}
                    disabled={isSaving}
                  />
                  {formatMessage(messages.registrationEmail)}
                </label>
              </div>
              <input
                id={`ai-edit-registration-value-${registrationId}`}
                className="ai-drawer__input"
                type={draft.registration_by === REGISTRATION_EMAIL ? 'email' : 'url'}
                aria-label={formatMessage(messages.drawerRegistrationValue)}
                value={draft.registration_value || ''}
                onChange={(event) => setField('registration_value', event.target.value)}
                placeholder={
                  draft.registration_by === REGISTRATION_EMAIL
                    ? formatMessage(messages.registrationEmailPlaceholder)
                    : formatMessage(messages.registrationUrlPlaceholder)
                }
                disabled={isSaving}
              />
            </div>
          </div>
        </section>
      </div>

      <div className="ai-drawer__footer">
        <button type="button" className="ai-drawer__outline-button" onClick={onClose}>
          {formatMessage(messages.cancel)}
        </button>
        <button
          type="button"
          className="ai-drawer__outline-button"
          disabled={isSaving}
          onClick={() => persist({ syncCatalog: false })}
        >
          {isSaving && <FontAwesomeIcon icon={faSpinner} spin aria-hidden />}
          {formatMessage(messages.saveDrawer)}
        </button>
        {training.created ? (
          <button
            type="button"
            className="ai-drawer__primary-button"
            disabled={isSaving}
            onClick={() => persist({ syncCatalog: true })}
          >
            {formatMessage(messages.saveAndUpdate)}
          </button>
        ) : (
          <button
            type="button"
            className="ai-drawer__primary-button"
            disabled={isSaving}
            onClick={async () => {
              const saved = await persist({ skipSuccessToast: true, syncCatalog: false });
              if (saved) onCreateOne?.(draft);
            }}
          >
            {formatMessage(messages.saveAndCreate)}
          </button>
        )}
      </div>
    </PopupDialog>
  );
};

export default ExtractedTrainingDrawer;
