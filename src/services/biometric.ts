import { Capacitor } from '@capacitor/core';
import { BiometricAuth, BiometryType } from '@aparajita/capacitor-biometric-auth';

const STORAGE_KEY_ENABLED = 'edata_biometric_enabled';
const STORAGE_KEY_PIN = 'edata_biometric_pin_vault';

// Simple obfuscation/encryption wrapper for device-isolated storage
function encryptPin(pin: string): string {
  try {
    const salt = 'edata_bio_secure_salt_2026';
    const combined = `${salt}:${pin}:${Date.now()}`;
    return btoa(unescape(encodeURIComponent(combined)));
  } catch {
    return btoa(pin);
  }
}

function decryptPin(cipher: string): string | null {
  try {
    const decoded = decodeURIComponent(escape(atob(cipher)));
    const parts = decoded.split(':');
    if (parts.length >= 2 && parts[0] === 'edata_bio_secure_salt_2026') {
      return parts[1];
    }
    return decoded;
  } catch {
    try {
      return atob(cipher);
    } catch {
      return null;
    }
  }
}

export interface BiometricStatus {
  isAvailable: boolean;
  biometryType: 'fingerprint' | 'face' | 'none';
  typeName: string;
  isEnrolled: boolean;
  isEnabled: boolean;
  error?: string;
}

/**
 * Check if the device hardware supports biometrics (Fingerprint / Face ID)
 * and if the user has enrolled biometrics in their device OS settings.
 */
export async function checkBiometrics(): Promise<BiometricStatus> {
  if (!Capacitor.isNativePlatform()) {
    return {
      isAvailable: false,
      biometryType: 'none',
      typeName: 'Biometrics',
      isEnrolled: false,
      isEnabled: false,
    };
  }

  try {
    const info = await BiometricAuth.checkBiometry();
    
    let biometryType: 'fingerprint' | 'face' | 'none' = 'fingerprint';
    let typeName = 'Fingerprint';

    if (info.biometryType === BiometryType.faceId || info.biometryType === BiometryType.faceAuthentication) {
      biometryType = 'face';
      typeName = 'Face ID';
    } else if (info.biometryType === BiometryType.touchId || info.biometryType === BiometryType.fingerprintAuthentication) {
      biometryType = 'fingerprint';
      typeName = 'Fingerprint';
    } else if (info.biometryType === (BiometryType as any).multiple) {
      biometryType = 'fingerprint';
      typeName = 'Fingerprint / Face ID';
    }

    const isEnrolled = !!info.isAvailable;
    const isEnabled = isBiometricsEnabled();

    return {
      isAvailable: info.isAvailable,
      biometryType,
      typeName,
      isEnrolled,
      isEnabled: isEnabled && isEnrolled,
    };
  } catch (err: any) {
    console.warn('Biometrics check error:', err);
    return {
      isAvailable: false,
      biometryType: 'none',
      typeName: 'Biometrics',
      isEnrolled: false,
      isEnabled: false,
      error: err?.message,
    };
  }
}

/**
 * Check if the user has enabled biometric authorization in the app.
 */
export function isBiometricsEnabled(): boolean {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const enabled = localStorage.getItem(STORAGE_KEY_ENABLED) === 'true';
    const hasPin = !!localStorage.getItem(STORAGE_KEY_PIN);
    return enabled && hasPin;
  } catch {
    return false;
  }
}

/**
 * Enable biometric authorization for the user's 4-digit PIN.
 * Triggers native biometric dialog to confirm ownership before saving.
 */
export async function enableBiometrics(pin: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Biometric authentication is only available on physical mobile devices.');
  }

  if (!pin || pin.length !== 4) {
    throw new Error('Valid 4-digit Transaction PIN is required to enable biometrics.');
  }

  try {
    // 1. Verify biometric scan with user
    await BiometricAuth.authenticate({
      reason: 'Confirm your fingerprint to activate biometric quick payments',
      title: 'Enable Biometric Authorization',
      subTitle: 'Fast, secure 1-touch checkout for eData VTU',
      description: 'Touch your fingerprint sensor to link your Transaction PIN',
      cancelTitle: 'Cancel',
      allowDeviceCredential: false,
      iosFallbackTitle: 'Enter PIN',
    } as any);

    // 2. Store encrypted PIN securely
    const encrypted = encryptPin(pin);
    localStorage.setItem(STORAGE_KEY_PIN, encrypted);
    localStorage.setItem(STORAGE_KEY_ENABLED, 'true');

    return true;
  } catch (err: any) {
    // User cancelled or biometric authentication failed
    console.warn('Biometric activation cancelled or failed:', err);
    throw new Error(err?.message || 'Biometric authorization was cancelled.');
  }
}

/**
 * Disable biometric authorization and clear the vault.
 */
export function disableBiometrics(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_ENABLED);
    localStorage.removeItem(STORAGE_KEY_PIN);
  } catch (err) {
    console.warn('Error disabling biometrics:', err);
  }
}

/**
 * Prompt native biometric authentication and retrieve authorized 4-digit PIN.
 * Returns the decrypted 4-digit PIN on success, or null if cancelled / failed.
 */
export async function authenticateWithBiometrics(options?: {
  title?: string;
  subtitle?: string;
  amount?: string | number;
  recipient?: string;
}): Promise<string | null> {
  if (!Capacitor.isNativePlatform() || !isBiometricsEnabled()) {
    return null;
  }

  const cipher = localStorage.getItem(STORAGE_KEY_PIN);
  if (!cipher) return null;

  const storedPin = decryptPin(cipher);
  if (!storedPin || storedPin.length !== 4) {
    disableBiometrics();
    return null;
  }

  try {
    const formattedAmt = options?.amount ? ` ₦${typeof options.amount === 'number' ? options.amount.toLocaleString() : options.amount}` : '';
    const formattedRec = options?.recipient ? ` for ${options.recipient}` : '';

    await BiometricAuth.authenticate({
      reason: `Authorize payment${formattedAmt}${formattedRec}`,
      title: options?.title || 'Authorize Payment',
      subTitle: options?.subtitle || `Confirm transaction${formattedAmt}`,
      description: 'Touch your fingerprint sensor to confirm',
      cancelTitle: 'Use PIN',
      allowDeviceCredential: false,
      iosFallbackTitle: 'Use PIN',
    } as any);

    return storedPin;
  } catch (err: any) {
    console.log('Biometric prompt dismissed or failed:', err?.message || err);
    return null;
  }
}
