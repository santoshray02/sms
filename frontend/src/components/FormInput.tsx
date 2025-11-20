import { InputHTMLAttributes, ReactNode, useState } from 'react';
import {
  COLORS,
  COMPONENT_SIZES,
  BORDER_RADIUS,
  TRANSITIONS,
  FOCUS_STYLES,
  SPACING,
} from '../config/design-system';
import { AlertIcon, CheckIcon } from './Icons';

export interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  required?: boolean;
  size?: 'sm' | 'base' | 'lg';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const FormInput = ({
  label,
  error,
  success,
  helperText,
  required = false,
  size = 'base',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  className = '',
  style,
  ...props
}: FormInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputSize = COMPONENT_SIZES.input[size];

  const getInputBorderColor = () => {
    if (error) return COLORS.danger[500];
    if (success) return COLORS.success[500];
    if (isFocused) return COLORS.primary[500];
    return COLORS.gray[300];
  };

  const getInputBorderWidth = () => {
    if (error || success || isFocused) return '2px';
    return '1px';
  };

  const hasIcon = !!icon;
  const paddingWithIcon = iconPosition === 'left' ? '36px' : inputSize.padding;

  return (
    <div
      style={{
        width: fullWidth ? '100%' : 'auto',
        marginBottom: SPACING[4],
      }}
    >
      {/* Label */}
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 500,
            color: COLORS.gray[700],
            marginBottom: '8px',
          }}
        >
          {label}
          {required && (
            <span
              style={{
                color: COLORS.danger[500],
                marginLeft: '4px',
                fontSize: '14px',
              }}
            >
              *
            </span>
          )}
        </label>
      )}

      {/* Input Container */}
      <div style={{ position: 'relative', width: '100%' }}>
        {/* Icon */}
        {hasIcon && iconPosition === 'left' && (
          <div
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: disabled ? COLORS.gray[400] : COLORS.gray[500],
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            {icon}
          </div>
        )}

        {/* Input Field */}
        <input
          {...props}
          disabled={disabled}
          required={required}
          className={className}
          style={{
            ...style,
            width: '100%',
            height: inputSize.height,
            padding: `0 ${inputSize.padding}`,
            paddingLeft: hasIcon && iconPosition === 'left' ? paddingWithIcon : inputSize.padding,
            paddingRight: hasIcon && iconPosition === 'right' ? '36px' : inputSize.padding,
            fontSize: inputSize.fontSize,
            color: disabled ? COLORS.gray[500] : COLORS.gray[900],
            backgroundColor: disabled ? COLORS.gray[100] : COLORS.white,
            border: `${getInputBorderWidth()} solid ${getInputBorderColor()}`,
            borderRadius: BORDER_RADIUS.base,
            outline: 'none',
            transition: `all ${TRANSITIONS.base}`,
            cursor: disabled ? 'not-allowed' : 'text',
          }}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
            if (!error && !success) {
              e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.primary[100]}`;
            }
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
            e.currentTarget.style.boxShadow = 'none';
          }}
        />

        {/* Right Icon or Status Icon */}
        {(hasIcon && iconPosition === 'right') || error || success ? (
          <div
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            {error && <AlertIcon size={18} color={COLORS.danger[500]} />}
            {!error && success && <CheckIcon size={18} color={COLORS.success[500]} />}
            {!error && !success && hasIcon && iconPosition === 'right' && icon}
          </div>
        ) : null}
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            marginTop: '6px',
            fontSize: '13px',
            color: COLORS.danger[600],
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <AlertIcon size={14} color={COLORS.danger[600]} />
          {error}
        </div>
      )}

      {/* Success Message */}
      {!error && success && (
        <div
          style={{
            marginTop: '6px',
            fontSize: '13px',
            color: COLORS.success[600],
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <CheckIcon size={14} color={COLORS.success[600]} />
          {success}
        </div>
      )}

      {/* Helper Text */}
      {!error && !success && helperText && (
        <div
          style={{
            marginTop: '6px',
            fontSize: '13px',
            color: COLORS.gray[600],
          }}
        >
          {helperText}
        </div>
      )}
    </div>
  );
};

export default FormInput;
