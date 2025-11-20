import { COLORS, BORDER_RADIUS } from '../config/design-system';

export type SpinnerSize = 'sm' | 'base' | 'lg' | 'xl';

interface SpinnerProps {
  size?: SpinnerSize;
  color?: string;
  text?: string;
  fullScreen?: boolean;
}

const Spinner = ({ size = 'base', color = COLORS.primary[500], text, fullScreen = false }: SpinnerProps) => {
  const getSizeValue = () => {
    switch (size) {
      case 'sm':
        return '16px';
      case 'base':
        return '24px';
      case 'lg':
        return '32px';
      case 'xl':
        return '48px';
    }
  };

  const sizeValue = getSizeValue();

  const spinner = (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <div
        style={{
          width: sizeValue,
          height: sizeValue,
          border: `3px solid ${COLORS.gray[200]}`,
          borderTopColor: color,
          borderRadius: BORDER_RADIUS.full,
          animation: 'spin 1s linear infinite',
        }}
      />
      {text && (
        <div
          style={{
            fontSize: '14px',
            color: COLORS.gray[600],
            fontWeight: 500,
          }}
        >
          {text}
        </div>
      )}
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
    </div>
  );

  if (fullScreen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          zIndex: 9999,
        }}
      >
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default Spinner;
