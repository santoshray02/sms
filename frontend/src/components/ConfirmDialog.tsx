import { ReactNode } from 'react';
import { COLORS, Z_INDEX, TRANSITIONS, EASINGS, BORDER_RADIUS } from '../config/design-system';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: '⚠️',
          iconBg: COLORS.danger[50],
          iconColor: COLORS.danger[500],
          confirmBg: COLORS.danger[500],
          confirmHoverBg: COLORS.danger[600],
        };
      case 'warning':
        return {
          icon: '⚠️',
          iconBg: COLORS.warning[50],
          iconColor: COLORS.warning[500],
          confirmBg: COLORS.warning[500],
          confirmHoverBg: COLORS.warning[600],
        };
      case 'info':
        return {
          icon: 'ℹ️',
          iconBg: COLORS.info[50],
          iconColor: COLORS.info[500],
          confirmBg: COLORS.primary[500],
          confirmHoverBg: COLORS.primary[600],
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: Z_INDEX.modalBackdrop,
          animation: `fadeIn ${TRANSITIONS.base} ${EASINGS.easeOut}`,
        }}
        onClick={onCancel}
        role="presentation"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
        aria-modal="true"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: COLORS.white,
          borderRadius: BORDER_RADIUS.lg,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          zIndex: Z_INDEX.modal,
          minWidth: '400px',
          maxWidth: '500px',
          animation: `slideUpFade ${TRANSITIONS.slow} ${EASINGS.easeOut}`,
        }}
      >
        {/* Header with Icon */}
        <div
          style={{
            padding: '24px 24px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: BORDER_RADIUS.full,
              backgroundColor: styles.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              flexShrink: 0,
            }}
          >
            {styles.icon}
          </div>
          <div style={{ flex: 1 }}>
            <h3
              id="dialog-title"
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 600,
                color: COLORS.gray[900],
                marginBottom: '8px',
              }}
            >
              {title}
            </h3>
            <div
              id="dialog-message"
              style={{
                fontSize: '14px',
                color: COLORS.gray[600],
                lineHeight: 1.5,
              }}
            >
              {message}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            padding: '16px 24px 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            borderTop: `1px solid ${COLORS.gray[200]}`,
          }}
        >
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              color: COLORS.gray[700],
              backgroundColor: COLORS.white,
              border: `1px solid ${COLORS.gray[300]}`,
              borderRadius: BORDER_RADIUS.base,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: `all ${TRANSITIONS.base}`,
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = COLORS.gray[50];
                e.currentTarget.style.borderColor = COLORS.gray[400];
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.white;
              e.currentTarget.style.borderColor = COLORS.gray[300];
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              color: COLORS.white,
              backgroundColor: loading ? COLORS.gray[400] : styles.confirmBg,
              border: 'none',
              borderRadius: BORDER_RADIUS.base,
              cursor: loading ? 'wait' : 'pointer',
              transition: `all ${TRANSITIONS.base}`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = styles.confirmHoverBg;
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = styles.confirmBg;
              }
            }}
          >
            {loading && (
              <div
                style={{
                  width: '14px',
                  height: '14px',
                  border: `2px solid ${COLORS.white}`,
                  borderTopColor: 'transparent',
                  borderRadius: BORDER_RADIUS.full,
                  animation: 'spin 1s linear infinite',
                }}
              />
            )}
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translate(-50%, -45%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
};

export default ConfirmDialog;
