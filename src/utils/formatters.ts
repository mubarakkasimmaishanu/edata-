/**
 * Utility functions to format monetary amounts reliably across Android WebView, iOS, and Web.
 * Avoids Intl.NumberFormat ('en-NG') quirks where Android ICU data defaults to 'NGN' string or garbled unicode.
 */

export const formatMoney = (amount: number | string, options?: { useCode?: boolean }): string => {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0;
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (options?.useCode) {
    return `NGN ${formatted}`;
  }

  return `₦${formatted}`;
};

export const formatMoneyCompact = (amount: number | string): string => {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0;
  const formatted = num.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });

  return `₦${formatted}`;
};
