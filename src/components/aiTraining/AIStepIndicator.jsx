/* eslint-disable react/prop-types */
import { useIntl } from '@edx/frontend-platform/i18n';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import messages from '../../pages/uploadTrainingWithAi/messages';
import './AIStepIndicator.scss';

const AIStepIndicator = ({ current = 1 }) => {
  const { formatMessage } = useIntl();
  const steps = [
    { n: 1, label: formatMessage(messages.stepUpload) },
    { n: 2, label: formatMessage(messages.stepProcessing) },
    { n: 3, label: formatMessage(messages.stepReview) },
  ];

  return (
    <nav className="ai-step-indicator" aria-label={formatMessage(messages.stepProgressAria)}>
      {steps.map((step, idx) => {
        const done = current > step.n;
        const active = current === step.n;
        return (
          <div key={step.n} className="ai-step-indicator__item">
            <span
              className={`ai-step-indicator__pill ${done ? 'is-done' : ''} ${active ? 'is-active' : ''}`}
              aria-current={active ? 'step' : undefined}
            >
              <span className="ai-step-indicator__number">
                {done ? <FontAwesomeIcon icon={faCheck} aria-hidden /> : step.n}
              </span>
              {step.label}
            </span>
            {idx < steps.length - 1 && <span className="ai-step-indicator__line" aria-hidden />}
          </div>
        );
      })}
    </nav>
  );
};

export default AIStepIndicator;
