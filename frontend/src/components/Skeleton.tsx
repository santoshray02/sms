import { CSSProperties } from 'react';
import { COLORS, BORDER_RADIUS } from '../config/design-system';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave' | 'none';
  count?: number;
  style?: CSSProperties;
}

const Skeleton = ({
  width = '100%',
  height = '16px',
  variant = 'text',
  animation = 'pulse',
  count = 1,
  style,
}: SkeletonProps) => {
  const getVariantStyles = (): CSSProperties => {
    switch (variant) {
      case 'circular':
        return {
          borderRadius: BORDER_RADIUS.full,
          width: height, // Make it square for circular
        };
      case 'rectangular':
        return {
          borderRadius: BORDER_RADIUS.base,
        };
      case 'text':
      default:
        return {
          borderRadius: BORDER_RADIUS.sm,
          height: variant === 'text' ? '1em' : height,
        };
    }
  };

  const getAnimationStyle = (): string => {
    switch (animation) {
      case 'wave':
        return 'wave 1.5s ease-in-out infinite';
      case 'pulse':
        return 'pulse 1.5s ease-in-out infinite';
      case 'none':
      default:
        return 'none';
    }
  };

  const skeletonStyle: CSSProperties = {
    display: 'block',
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    backgroundColor: COLORS.gray[200],
    animation: getAnimationStyle(),
    ...getVariantStyles(),
    ...style,
  };

  if (count > 1) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[...Array(count)].map((_, i) => (
          <div key={i} style={skeletonStyle} />
        ))}
        <style>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }

          @keyframes wave {
            0% {
              transform: translateX(-100%);
            }
            50%, 100% {
              transform: translateX(100%);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <div style={skeletonStyle} />
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes wave {
          0% {
            transform: translateX(-100%);
          }
          50%, 100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </>
  );
};

// Convenience components for common use cases
export const SkeletonText = ({ lines = 3, ...props }: { lines?: number } & Omit<SkeletonProps, 'variant' | 'count'>) => (
  <Skeleton variant="text" count={lines} {...props} />
);

export const SkeletonCard = ({ ...props }: Omit<SkeletonProps, 'variant'>) => (
  <div style={{ padding: '16px', backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg }}>
    <Skeleton variant="text" width="60%" height="24px" style={{ marginBottom: '12px' }} />
    <Skeleton variant="text" width="100%" height="16px" count={3} />
  </div>
);

export const SkeletonAvatar = ({ size = 40, ...props }: { size?: number } & Omit<SkeletonProps, 'variant'>) => (
  <Skeleton variant="circular" width={size} height={size} {...props} />
);

export default Skeleton;
