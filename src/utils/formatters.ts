/**
 * Utility functions to format monetary amounts reliably across Android WebView, iOS, and Web.
 * Uses explicit Unicode \u20A6 for Naira symbol and en-US numerical formatting.
 */

export const NAIRA_SYMBOL = '\u20A6';

export const formatMoney = (amount: number | string, options?: { useCode?: boolean }): string => {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0;
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (options?.useCode) {
    return `NGN ${formatted}`;
  }

  return `${NAIRA_SYMBOL}${formatted}`;
};

export const formatMoneyCompact = (amount: number | string): string => {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0;
  const formatted = num.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });

  return `${NAIRA_SYMBOL}${formatted}`;
};
