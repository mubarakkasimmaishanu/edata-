/**
 * Universal Mobile & Web Contact Picker Utility
 * Automatically invokes native Android/iOS Contact Picker API via Web Contacts API
 * with graceful fallbacks for WebViews and manual paste inputs.
 */

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
        let clean = rawPhone.replace(/\D/g, '');
        if (clean.startsWith('234') && clean.length >= 13) {
          clean = '0' + clean.slice(3);
        }
        if (clean.length > 11) {
          clean = clean.slice(-11);
        }
        onSelectNumber(clean);
        toast?.success(`Contact selected: ${clean}`);
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
  const defaultVal = userPhone ? userPhone.replace(/\D/g, '').slice(-11) : '';
  const input = window.prompt('Enter or paste recipient phone number:', defaultVal);
  if (input) {
    let clean = input.replace(/\D/g, '');
    if (clean.startsWith('234') && clean.length >= 13) {
      clean = '0' + clean.slice(3);
    }
    if (clean.length > 11) {
      clean = clean.slice(-11);
    }
    if (clean.length >= 10) {
      onSelectNumber(clean);
      toast?.success(`Phone number set: ${clean}`);
    } else if (clean.length > 0) {
      toast?.error('Invalid phone number entered. Minimum 10 digits required.');
    }
  }
}
