/**
 * Utility functions for validating and normalizing Nigerian phone numbers
 * and recipient fields across eData VTU service flows.
 */

/**
 * Validates whether a given string is a valid Nigerian phone number.
 * - Local format: 11 digits starting with '0' (e.g. 09033530088, 08012345678, 07012345678, 08112345678, 09112345678)
 * - International format: 13 digits starting with '234' (e.g. 2349033530088)
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false;
  const clean = phone.replace(/\D/g, '');
  if (clean.startsWith('234')) {
    return clean.length === 13;
  }
  return clean.startsWith('0') && clean.length === 11;
}

/**
 * Normalizes any valid Nigerian phone string to standard 11-digit local format ('080...', '090...').
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('234') && clean.length === 13) {
    clean = '0' + clean.slice(3);
  }
  return clean;
}

/**
 * Validates recipient input based on service type.
 * - Telecom services ('airtime', 'data', 'a2c'): requires valid 11-digit phone number.
 * - Utility services ('cable', 'electricity'): requires non-empty string between 8 and 15 digits.
 * - Scratch cards / System features ('exam', 'upgrade'): no recipient needed.
 */
export function isValidRecipient(serviceType: string, recipient?: string): boolean {
  const st = (serviceType || '').toLowerCase();
  if (st === 'exam' || st === 'exams' || st === 'upgrade') {
    return true;
  }
  if (!recipient || !recipient.trim()) {
    return false;
  }
  const clean = recipient.trim().replace(/\D/g, '');
  if (st === 'airtime' || st === 'data' || st === 'a2c') {
    return isValidPhoneNumber(clean);
  }
  if (st === 'cable' || st === 'electricity') {
    return clean.length >= 8 && clean.length <= 15;
  }
  return clean.length >= 5;
}
