import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FiCheckCircle, FiAlertCircle, FiAlertTriangle, FiInfo, FiX } from "react-icons/fi";
import styles from "../../styles/Toast.module.css";

const ToastContext = createContext(null);
const DEFAULT_DURATION = 4000;

const ICONS = {
  success: FiCheckCircle,
  error: FiAlertCircle,
  warning: FiAlertTriangle,
  info: FiInfo,
};

function ToastItem({ toast, onDismiss }) {
  const { id, title, message, type, duration, action } = toast;
  const Icon = ICONS[type] || ICONS.info;
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef(null);

  const requestDismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onDismiss(id), 200);
  }, [id, onDismiss]);

  const startTimer = useCallback(() => {
    if (duration > 0) {
      timerRef.current = setTimeout(requestDismiss, duration);
    }
  }, [duration, requestDismiss]);

  useEffect(() => {
    startTimer();
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`${styles.toast} ${styles[type] || styles.info} ${leaving ? styles.leaving : ""}`}
      role="alert"
      onMouseEnter={() => clearTimeout(timerRef.current)}
      onMouseLeave={startTimer}
    >
      <span className={styles.iconWrap}>
        <Icon size={20} />
      </span>
      <div className={styles.content}>
        {title && <p className={styles.title}>{title}</p>}
        <p className={styles.message}>{message}</p>
        {action && (
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => {
              action.onClick?.();
              requestDismiss();
            }}
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        className={styles.closeBtn}
        onClick={requestDismiss}
        aria-label="Dismiss notification"
      >
        <FiX size={16} />
      </button>
      {duration > 0 && !leaving && (
        <span className={styles.progress} style={{ animationDuration: `${duration}ms` }} />
      )}
    </div>
  );
}

function ToastViewport({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className={styles.viewport} role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message, options = {}) => {
    const opts = typeof options === "string" ? { type: options } : options;
    const { type = "info", duration = DEFAULT_DURATION, title, action } = opts;
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, title, type, duration, action }]);
    return id;
  }, []);

  const toast = useMemo(
    () => ({
      show,
      success: (message, options) => show(message, { ...(typeof options === "object" ? options : {}), type: "success" }),
      error: (message, options) => show(message, { ...(typeof options === "object" ? options : {}), type: "error" }),
      warning: (message, options) => show(message, { ...(typeof options === "object" ? options : {}), type: "warning" }),
      info: (message, options) => show(message, { ...(typeof options === "object" ? options : {}), type: "info" }),
      dismiss,
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

export default ToastProvider;
