/**
 * Application Configuration
 * General app settings and formatting utilities
 */

export const APP_CONFIG = {
  // App Info
  name: 'School Management System',
  shortName: 'SMS',
  version: '2.0.0',
  description: 'Rural Bihar CBSE School Management System',

  // Currency
  currency: {
    symbol: '₹',
    code: 'INR',
    locale: 'en-IN',
  },

  // Date & Time
  dateFormat: {
    short: { year: 'numeric', month: 'short', day: 'numeric' } as const,
    long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' } as const,
    numeric: { year: 'numeric', month: '2-digit', day: '2-digit' } as const,
  },

  // Phone Validation
  phone: {
    pattern: /^[6-9]\d{9}$/,
    minLength: 10,
    maxLength: 10,
    prefix: '+91',
  },

  // Academic Year
  academic: {
    startMonth: 4, // April
    endMonth: 3, // March (next year)
  },
} as const;

/**
 * Format currency amount from paise to rupees
 */
export const formatCurrency = (amountInPaise: number, showSymbol = true): string => {
  const amount = amountInPaise / 100;
  const formatted = amount.toLocaleString(APP_CONFIG.currency.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return showSymbol ? `${APP_CONFIG.currency.symbol}${formatted}` : formatted;
};

/**
 * Format date with specified format
 */
export const formatDate = (
  date: string | Date,
  format: 'short' | 'long' | 'numeric' = 'short'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(
    APP_CONFIG.currency.locale,
    APP_CONFIG.dateFormat[format]
  );
};

/**
 * Format phone number
 */
export const formatPhone = (phone: string, includePrefix = false): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    const formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    return includePrefix ? `${APP_CONFIG.phone.prefix} ${formatted}` : formatted;
  }
  return phone;
};

/**
 * Validate phone number
 */
export const isValidPhone = (phone: string): boolean => {
  return APP_CONFIG.phone.pattern.test(phone);
};

/**
 * Get current academic year
 */
export const getCurrentAcademicYear = (): string => {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();

  if (month >= APP_CONFIG.academic.startMonth) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

/**
 * Parse academic year string to start and end years
 */
export const parseAcademicYear = (yearString: string): { start: number; end: number } => {
  const [start, end] = yearString.split('-').map(Number);
  return { start, end };
};
