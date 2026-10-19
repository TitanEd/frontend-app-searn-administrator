/* eslint-disable react/prop-types */
import { useIntl } from '@edx/frontend-platform/i18n';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect } from 'react';
import commonMessages from '../../messages/commonMessages';
import './PopupDialog.scss';

let activeScrollLocks = 0;
let previousScrollStyles = {
  htmlOverflow: '',
  bodyOverflow: '',
  bodyPaddingRight: '',
};

const lockPageScroll = () => {
  if (activeScrollLocks === 0 && typeof document !== 'undefined') {
    const html = document.documentElement;
    const { body } = document;
    previousScrollStyles = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPaddingRight: body.style.paddingRight,
    };
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }
    html.classList.add('is-popup-open');
  }
  activeScrollLocks += 1;
};

const unlockPageScroll = () => {
  activeScrollLocks = Math.max(0, activeScrollLocks - 1);
  if (activeScrollLocks === 0 && typeof document !== 'undefined') {
    document.documentElement.style.overflow = previousScrollStyles.htmlOverflow;
    document.body.style.overflow = previousScrollStyles.bodyOverflow;
    document.body.style.paddingRight = previousScrollStyles.bodyPaddingRight;
    document.documentElement.classList.remove('is-popup-open');
  }
};

const PopupDialog = ({
  isOpen,
  title,
  onClose,
  contentClassName = '',
  children,
}) => {
  const { formatMessage } = useIntl();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    lockPageScroll();
    return () => {
      unlockPageScroll();
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const closeDialogLabel = formatMessage(commonMessages.closeDialog);

  return (
    <div className="popup-dialog" role="dialog" aria-modal="true">
      <button type="button" className="popup-dialog__backdrop" aria-label={closeDialogLabel} onClick={onClose} />
      <div className={`popup-dialog__content ${contentClassName}`}>
        <div className="popup-dialog__header">
          <h2 className="popup-dialog__title">{title}</h2>
        </div>
        <button type="button" className="popup-dialog__close" aria-label={closeDialogLabel} onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
        {children}
      </div>
    </div>
  );
};

export default PopupDialog;
