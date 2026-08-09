import { isValidPhoneNumber, normalizePhoneNumber } from './phoneValidation';

export async function openContactPicker(
  onSelectNumber: (phone: string) => void,
  userPhone?: string,
  toast?: { success: (m: string) => void; info: (m: string) => void; error: (m: string) => void }
) {
  // 1. Try Native Web Contacts API (Android WebViews / Chrome / Mobile Edge)
  if ('contacts' in navigator && 'ContactsManager' in window) {
    try {
      const props = ['tel', 'name'];
      const opts = { multiple: false };
      const contacts = await (navigator as any).contacts.select(props, opts);
      if (contacts && contacts.length > 0 && contacts[0].tel && contacts[0].tel.length > 0) {
        let rawPhone = contacts[0].tel[0];
        let clean = normalizePhoneNumber(rawPhone);
        if (clean.length > 11) {
          clean = clean.slice(-11);
        }
        if (isValidPhoneNumber(clean)) {
          onSelectNumber(clean);
          toast?.success(`Contact selected: ${clean}`);
        } else {
          toast?.error('Selected contact phone number is invalid (11 digits required).');
        }
        return;
      }
    } catch (err: any) {
      // User cancelled picker or browser permissions revoked
      if (err.name === 'SecurityError' || err.name === 'InvalidStateError' || err.name === 'NotAllowedError') {
        return;
      }
    }
  }

  // 2. Fallback: Quick input prompt with optional account phone pre-fill
  const defaultVal = userPhone ? normalizePhoneNumber(userPhone).slice(-11) : '';
  const input = window.prompt('Enter or paste recipient phone number (11 digits):', defaultVal);
  if (input) {
    let clean = normalizePhoneNumber(input);
    if (clean.length > 11) {
      clean = clean.slice(-11);
    }
    if (isValidPhoneNumber(clean)) {
      onSelectNumber(clean);
      toast?.success(`Phone number set: ${clean}`);
    } else if (clean.length > 0) {
      toast?.error('Invalid phone number entered. Standard Nigerian phone numbers must be 11 digits.');
    }
  }
}
