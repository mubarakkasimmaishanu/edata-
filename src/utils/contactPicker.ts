import { isValidPhoneNumber, normalizePhoneNumber } from './phoneValidation';

export async function openContactPicker(
  onSelectNumber: (phone: string) => void,
  userPhone?: string,
  toast?: { success: (m: string) => void; info: (m: string) => void; error: (m: string) => void },
  onOpenFallbackModal?: () => void
): Promise<boolean> {
  // 1. Try Native Capacitor Device Contacts Picker (Android & iOS Phone Contacts App)
  try {
    const { Contacts } = await import('@capacitor-community/contacts');
    if (Contacts && typeof Contacts.pickContact === 'function') {
      try {
        const permStatus = await Contacts.checkPermissions();
        if (permStatus.contacts !== 'granted') {
          const reqStatus = await Contacts.requestPermissions();
          if (reqStatus.contacts !== 'granted') {
            toast?.error('Permission to access device contacts was denied.');
            if (onOpenFallbackModal) onOpenFallbackModal();
            return false;
          }
        }
      } catch {}

      const res = await Contacts.pickContact({
        projection: {
          phones: true,
          name: true,
        },
      });

      if (res && res.contact && res.contact.phones && res.contact.phones.length > 0) {
        const phoneObj = res.contact.phones[0];
        const rawNumber = phoneObj?.number || '';
        if (rawNumber) {
          let clean = normalizePhoneNumber(rawNumber);
          if (clean.length > 11) clean = clean.slice(-11);

          if (isValidPhoneNumber(clean)) {
            const displayName = res.contact.name?.display || res.contact.name?.given || '';
            onSelectNumber(clean);
            toast?.success(`Contact selected: ${clean}${displayName ? ` (${displayName})` : ''}`);
            return true;
          } else {
            toast?.error(`Selected contact phone number (${rawNumber}) is invalid. Must be an 11-digit number.`);
            return false;
          }
        }
      }
    }
  } catch (err: any) {
    console.log('Capacitor Contacts Plugin Notice:', err?.message || err);
  }

  // 2. Try Native Web Contacts API (Android Chrome / Mobile Browsers)
  if (typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window) {
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
          return true;
        } else {
          toast?.error('Selected contact phone number is invalid (11 digits required).');
          return false;
        }
      }
    } catch (err: any) {
      if (err.name === 'SecurityError' || err.name === 'InvalidStateError' || err.name === 'NotAllowedError') {
        // Fall through to fallback options
      }
    }
  }

  // 3. Try Clipboard Auto-Read if clipboard contains a valid phone number
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        let cleanClip = normalizePhoneNumber(clipText);
        if (cleanClip.length > 11) cleanClip = cleanClip.slice(-11);
        if (isValidPhoneNumber(cleanClip)) {
          onSelectNumber(cleanClip);
          toast?.success(`Pasted phone number from clipboard: ${cleanClip}`);
          return true;
        }
      }
    } catch {}
  }

  // 4. Open Fallback Modal if provided
  if (onOpenFallbackModal) {
    onOpenFallbackModal();
    return true;
  }

  // 5. Standard Browser Prompt Fallback
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
      return true;
    } else if (clean.length > 0) {
      toast?.error('Invalid phone number entered. Standard Nigerian phone numbers must be 11 digits.');
    }
  }

  return false;
}
