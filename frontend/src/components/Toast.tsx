import { useEffect } from 'react';
import { COLORS, TRANSITIONS, EASINGS } from '../config/design-system';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast = ({ id, type, message, duration = 5000, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: COLORS.success[50],
          border: COLORS.success[500],
          text: COLORS.success[900],
          icon: '✓',
        };
      case 'error':
        return {
          bg: COLORS.danger[50],
          border: COLORS.danger[500],
          text: COLORS.danger[900],
          icon: '✕',
        };
      case 'warning':
        return {
          bg: COLORS.warning[50],
          border: COLORS.warning[500],
          text: COLORS.warning[900],
          icon: '⚠',
        };
      case 'info':
      default:
        return {
          bg: COLORS.info[50],
          border: COLORS.info[500],
          text: COLORS.info[900],
          icon: 'ℹ',
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className="toast-item"
      style={{
        backgroundColor: styles.bg,
        borderLeft: `4px solid ${styles.border}`,
        padding: '12px 16px',
        borderRadius: '4px',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        animation: `slideInRight ${TRANSITIONS.slow} ${EASINGS.easeOut}`,
        minWidth: '320px',
        maxWidth: '500px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            fontSize: '18px',
            color: styles.border,
            fontWeight: 600,
          }}
        >
          {styles.icon}
        </div>
        <div
          style={{
            fontSize: '14px',
            color: styles.text,
            fontWeight: 500,
          }}
        >
          {message}
        </div>
      </div>
      <button
        onClick={() => onClose(id)}
        style={{
          background: 'none',
          border: 'none',
          color: styles.text,
          cursor: 'pointer',
          padding: '4px 8px',
          fontSize: '18px',
          lineHeight: 1,
          opacity: 0.6,
          transition: `opacity ${TRANSITIONS.fast}`,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
        aria-label="Close notification"
      >
        ×
      </button>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Toast;
