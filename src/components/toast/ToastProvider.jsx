/* eslint-disable react/prop-types */
import { useIntl } from '@edx/frontend-platform/i18n';
import {
  createContext, useCallback, useContext, useMemo, useState,
} from 'react';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { hasDisplayValue } from '../../utils/hasDisplayValue';
import commonMessages from '../../messages/commonMessages';
import './ToastProvider.scss';

const ToastContext = createContext({
  showToast: () => {},
});

const TOAST_VISIBLE_MS = 4000;
const TOAST_CLOSE_MS = 260;

const ToastProvider = ({ children }) => {
  const { formatMessage } = useIntl();
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(item => item.id !== id));
  }, []);

  const closeToast = useCallback((id) => {
    setToasts(prev => prev.map(item => (
      item.id === id ? { ...item, isClosing: true } : item
    )));
    window.setTimeout(() => {
      removeToast(id);
    }, TOAST_CLOSE_MS);
  }, [removeToast]);

  const showToast = useCallback(({ title, description }) => {
    if (!hasDisplayValue(title) && !hasDisplayValue(description)) {
      return;
    }

    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, {
      id,
      title,
      description,
      isClosing: false,
    }]);
    window.setTimeout(() => {
      closeToast(id);
    }, TOAST_VISIBLE_MS);
  }, [closeToast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ol className="app-toast-viewport" tabIndex={-1}>
        {toasts.map(toast => (
          <li className={`app-toast ${toast.isClosing ? 'is-closing' : ''}`} key={toast.id} role="status">
            <div>
              {hasDisplayValue(toast.title) && (
                <p className="app-toast__title">{toast.title}</p>
              )}
              {hasDisplayValue(toast.description) && (
                <p className="app-toast__description">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              className="app-toast__close"
              aria-label={formatMessage(commonMessages.close)}
              onClick={() => closeToast(toast.id)}
            >
              <FontAwesomeIcon icon={faTimes} aria-hidden />
            </button>
          </li>
        ))}
      </ol>
    </ToastContext.Provider>
  );
};

const useToast = () => useContext(ToastContext);

export {
  ToastProvider,
  useToast,
};
