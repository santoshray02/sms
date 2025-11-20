import { ReactNode, ButtonHTMLAttributes } from 'react';
import {
  COLORS,
  COMPONENT_SIZES,
  BORDER_RADIUS,
  TRANSITIONS,
  FOCUS_STYLES,
} from '../config/design-system';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'base' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: ReactNode;
}

const Button = ({
  variant = 'primary',
  size = 'base',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  children,
  className = '',
  style,
  ...props
}: ButtonProps) => {
  const getVariantStyles = () => {
    const baseStyles = {
      border: 'none',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          color: COLORS.white,
          backgroundColor: COLORS.primary[500],
          hoverBg: COLORS.primary[600],
          activeBg: COLORS.primary[700],
        };
      case 'success':
        return {
          ...baseStyles,
          color: COLORS.white,
          backgroundColor: COLORS.success[500],
          hoverBg: COLORS.success[600],
          activeBg: COLORS.success[700],
        };
      case 'danger':
        return {
          ...baseStyles,
          color: COLORS.white,
          backgroundColor: COLORS.danger[500],
          hoverBg: COLORS.danger[600],
          activeBg: COLORS.danger[700],
        };
      case 'secondary':
        return {
          ...baseStyles,
          color: COLORS.gray[700],
          backgroundColor: COLORS.gray[200],
          hoverBg: COLORS.gray[300],
          activeBg: COLORS.gray[400],
        };
      case 'outline':
        return {
          ...baseStyles,
          color: COLORS.primary[600],
          backgroundColor: 'transparent',
          border: `1px solid ${COLORS.primary[500]}`,
          hoverBg: COLORS.primary[50],
          activeBg: COLORS.primary[100],
        };
      case 'ghost':
        return {
          ...baseStyles,
          color: COLORS.gray[700],
          backgroundColor: 'transparent',
          border: 'none',
          hoverBg: COLORS.gray[100],
          activeBg: COLORS.gray[200],
        };
    }
  };

  const sizeStyles = COMPONENT_SIZES.button[size];
  const variantStyles = getVariantStyles();

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={className}
      style={{
        ...style,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        height: sizeStyles.height,
        padding: sizeStyles.padding,
        fontSize: sizeStyles.fontSize,
        fontWeight: 500,
        borderRadius: BORDER_RADIUS.base,
        transition: `all ${TRANSITIONS.base}`,
        width: fullWidth ? '100%' : 'auto',
        minWidth: fullWidth ? 'auto' : '120px',
        ...variantStyles,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.backgroundColor = variantStyles.hoverBg;
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = variantStyles.backgroundColor;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      onMouseDown={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.backgroundColor = variantStyles.activeBg;
        }
      }}
      onMouseUp={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.backgroundColor = variantStyles.hoverBg;
        }
      }}
      onFocus={(e) => {
        e.currentTarget.style.outline = `${FOCUS_STYLES.ring.width} ${FOCUS_STYLES.ring.style} ${FOCUS_STYLES.ring.color}`;
        e.currentTarget.style.outlineOffset = FOCUS_STYLES.ring.offset;
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = 'none';
      }}
    >
      {loading && (
        <div
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
      )}
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </button>
  );
};

export default Button;
