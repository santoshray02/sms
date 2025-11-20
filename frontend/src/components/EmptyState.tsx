import { ReactNode } from 'react';
import { COLORS, SPACING, BORDER_RADIUS } from '../config/design-system';

interface EmptyStateProps {
  icon?: string | ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'search' | 'error';
}

const EmptyState = ({
  icon,
  title,
  description,
  action,
  variant = 'default',
}: EmptyStateProps) => {
  const getDefaultIcon = () => {
    switch (variant) {
      case 'search':
        return '🔍';
      case 'error':
        return '⚠️';
      default:
        return '📋';
    }
  };

  const displayIcon = icon || getDefaultIcon();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${SPACING[16]} ${SPACING[6]}`,
        textAlign: 'center',
        minHeight: '400px',
      }}
    >
      {/* Icon */}
      <div
        style={{
          fontSize: '64px',
          marginBottom: SPACING[4],
          opacity: 0.6,
        }}
      >
        {typeof displayIcon === 'string' ? displayIcon : displayIcon}
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: '20px',
          fontWeight: 600,
          color: COLORS.gray[900],
          marginBottom: SPACING[2],
        }}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          style={{
            fontSize: '14px',
            color: COLORS.gray[600],
            maxWidth: '400px',
            marginBottom: action ? SPACING[6] : 0,
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 500,
            color: COLORS.white,
            backgroundColor: COLORS.primary[500],
            border: 'none',
            borderRadius: BORDER_RADIUS.base,
            cursor: 'pointer',
            transition: 'all 200ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.primary[600];
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 82, 204, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.primary[500];
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
