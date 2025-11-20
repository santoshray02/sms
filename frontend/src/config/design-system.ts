/**
 * Design System Configuration
 * Comprehensive design tokens for the School Management System
 * Based on UI/UX improvements report
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const COLORS = {
  // Primary Colors
  primary: {
    50: '#e7f1ff',
    100: '#cfe3ff',
    200: '#a6d0ff',
    300: '#75b7ff',
    400: '#4a9aff',
    500: '#0052CC', // Main primary color
    600: '#0047b3',
    700: '#003d99',
    800: '#003380',
    900: '#002966',
  },

  // Success Colors
  success: {
    50: '#d4edda',
    100: '#c3e6cb',
    200: '#b1dfbb',
    300: '#8fd19e',
    400: '#6ec381',
    500: '#28A745', // Main success color
    600: '#218838',
    700: '#1e7e34',
    800: '#1c7430',
    900: '#155724',
  },

  // Danger/Error Colors
  danger: {
    50: '#f8d7da',
    100: '#f5c6cb',
    200: '#f1b0b7',
    300: '#ea868f',
    400: '#e35d6a',
    500: '#DC3545', // Main danger color
    600: '#c82333',
    700: '#bd2130',
    800: '#b21f2d',
    900: '#a71d2a',
  },

  // Warning Colors
  warning: {
    50: '#fff3cd',
    100: '#ffeeba',
    200: '#ffe69c',
    300: '#ffda6a',
    400: '#ffc720',
    500: '#FF9800', // Main warning color
    600: '#e67e00',
    700: '#cc7000',
    800: '#b36200',
    900: '#995400',
  },

  // Info Colors
  info: {
    50: '#d1ecf1',
    100: '#bee5eb',
    200: '#a8dbe4',
    300: '#7cc9d7',
    400: '#4fb3c4',
    500: '#17A2B8', // Main info color
    600: '#138496',
    700: '#117a8b',
    800: '#0f6674',
    900: '#0c525d',
  },

  // Gray Scale
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Semantic Colors
  white: '#ffffff',
  black: '#000000',
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const TYPOGRAPHY = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'Monaco, Courier, monospace',
  },

  fontSize: {
    xs: '11px',      // Caption
    sm: '12px',      // Label
    base: '14px',    // Body
    lg: '16px',      // H3
    xl: '18px',      // Subtitle
    '2xl': '22px',   // H2
    '3xl': '28px',   // H1
    '4xl': '36px',   // Display
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// ============================================================================
// SPACING
// ============================================================================

export const SPACING = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
} as const;

// ============================================================================
// ELEVATION (SHADOWS)
// ============================================================================

export const ELEVATION = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
  md: '0 3px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12)',
  lg: '0 5px 15px rgba(0, 0, 0, 0.18)',
  xl: '0 10px 25px rgba(0, 0, 0, 0.2)',
  '2xl': '0 20px 40px rgba(0, 0, 0, 0.25)',
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const BORDER_RADIUS = {
  none: '0',
  sm: '2px',
  base: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  full: '9999px',
} as const;

// ============================================================================
// TRANSITIONS
// ============================================================================

export const TRANSITIONS = {
  fast: '100ms',
  base: '200ms',
  slow: '300ms',
  slower: '500ms',
} as const;

export const EASINGS = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const BREAKPOINTS = {
  sm: '480px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================================
// Z-INDEX
// ============================================================================

export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

// ============================================================================
// COMPONENT SIZES
// ============================================================================

export const COMPONENT_SIZES = {
  button: {
    sm: { height: '32px', padding: '0 12px', fontSize: '12px' },
    base: { height: '40px', padding: '0 16px', fontSize: '14px' },
    lg: { height: '48px', padding: '0 20px', fontSize: '16px' },
  },

  input: {
    sm: { height: '32px', padding: '0 12px', fontSize: '12px' },
    base: { height: '40px', padding: '0 12px', fontSize: '14px' },
    lg: { height: '48px', padding: '0 16px', fontSize: '16px' },
  },

  icon: {
    xs: '12px',
    sm: '16px',
    base: '18px',
    lg: '24px',
    xl: '32px',
  },

  touchTarget: '44px', // Minimum size for mobile touch targets
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get color with opacity
 */
export const withOpacity = (color: string, opacity: number): string => {
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

/**
 * Get transition CSS string
 */
export const getTransition = (
  properties: string[],
  duration: keyof typeof TRANSITIONS = 'base',
  easing: keyof typeof EASINGS = 'easeInOut'
): string => {
  return properties
    .map((prop) => `${prop} ${TRANSITIONS[duration]} ${EASINGS[easing]}`)
    .join(', ');
};

/**
 * Get box shadow for elevation level
 */
export const getElevation = (level: keyof typeof ELEVATION): string => {
  return ELEVATION[level];
};

/**
 * Get responsive value based on screen size
 */
export const getResponsiveValue = <T>(values: {
  base: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
}): string => {
  return `
    ${values.base}
    ${values.sm ? `@media (min-width: ${BREAKPOINTS.sm}) { ${values.sm} }` : ''}
    ${values.md ? `@media (min-width: ${BREAKPOINTS.md}) { ${values.md} }` : ''}
    ${values.lg ? `@media (min-width: ${BREAKPOINTS.lg}) { ${values.lg} }` : ''}
    ${values.xl ? `@media (min-width: ${BREAKPOINTS.xl}) { ${values.xl} }` : ''}
  `.trim();
};

// ============================================================================
// FOCUS STYLES (ACCESSIBILITY)
// ============================================================================

export const FOCUS_STYLES = {
  ring: {
    width: '2px',
    color: COLORS.primary[500],
    offset: '2px',
    style: 'solid',
  },

  getCss: (): string => {
    return `
      outline: ${FOCUS_STYLES.ring.width} ${FOCUS_STYLES.ring.style} ${FOCUS_STYLES.ring.color};
      outline-offset: ${FOCUS_STYLES.ring.offset};
    `;
  },
} as const;

// ============================================================================
// STATUS COLORS
// ============================================================================

export const STATUS_COLORS = {
  active: COLORS.success[500],
  inactive: COLORS.gray[500],
  pending: COLORS.warning[500],
  paid: COLORS.success[500],
  partial: COLORS.warning[500],
  overdue: COLORS.danger[500],
} as const;

// ============================================================================
// ANIMATION PRESETS
// ============================================================================

export const ANIMATIONS = {
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    animation: fadeIn ${TRANSITIONS.base} ${EASINGS.easeOut};
  `,

  slideUp: `
    @keyframes slideUp {
      from { transform: translateY(10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    animation: slideUp ${TRANSITIONS.slow} ${EASINGS.easeOut};
  `,

  spin: `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    animation: spin 1s linear infinite;
  `,

  pulse: `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    animation: pulse 2s ${EASINGS.easeInOut} infinite;
  `,

  ripple: `
    @keyframes ripple {
      from {
        transform: scale(0);
        opacity: 1;
      }
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
    animation: ripple 600ms ${EASINGS.easeOut};
  `,
} as const;

// ============================================================================
// EXPORT ALL
// ============================================================================

export const DESIGN_SYSTEM = {
  colors: COLORS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  elevation: ELEVATION,
  borderRadius: BORDER_RADIUS,
  transitions: TRANSITIONS,
  easings: EASINGS,
  breakpoints: BREAKPOINTS,
  zIndex: Z_INDEX,
  componentSizes: COMPONENT_SIZES,
  focusStyles: FOCUS_STYLES,
  statusColors: STATUS_COLORS,
  animations: ANIMATIONS,
} as const;

export default DESIGN_SYSTEM;
