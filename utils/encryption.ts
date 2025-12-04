import * as Crypto from 'expo-crypto';

// NOTE: We cannot use SHA256 for encryption as it is a one-way hash.
// We are switching to simple Base64 encoding for obfuscation as we don't have
// a native encryption library available in this environment.
// In a real app, you would use expo-secure-store or a proper encryption library.

export type EncryptedData = {
  data: string;
  iv: string;
  isBase64?: boolean; // Flag to indicate if data was originally base64
};

// Helper to check if string is valid base64
function isValidBase64(str: string): boolean {
  if (!str || str.length === 0) return false;
  // Base64 strings should only contain A-Z, a-z, 0-9, +, /, and = for padding
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(str) && str.length % 4 === 0;
}

// Safe btoa that handles unicode
function safeBtoa(str: string): string {
  try {
    // First encode to handle unicode characters
    const utf8Bytes = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => 
      String.fromCharCode(parseInt(p1, 16))
    );
    return btoa(utf8Bytes);
  } catch (error) {
    console.error('[Encryption] safeBtoa error:', error);
    // Fallback: try direct btoa
    return btoa(str);
  }
}

// Safe atob that handles unicode
function safeAtob(str: string): string {
  try {
    const decoded = atob(str);
    // Try to decode URI component for unicode support
    try {
      return decodeURIComponent(decoded.split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
    } catch {
      // If decode fails, return the direct atob result
      return decoded;
    }
  } catch (error) {
    console.error('[Encryption] safeAtob error:', error);
    return str;
  }
}

export async function encrypt(text: string): Promise<string> {
  try {
    console.log('[Encryption] Encrypting text, length:', text?.length || 0);
    // Simple Base64 encoding for obfuscation
    const encoded = safeBtoa(text);
    console.log('[Encryption] Encoded length:', encoded?.length || 0);
    return encoded;
  } catch (error) {
    console.error('[Encryption] Error encrypting:', error);
    return text;
  }
}

export async function decrypt(encryptedText: string): Promise<string> {
  try {
    // Check if it's a SHA256 hash (legacy corrupted data)
    // SHA256 hash is 64 characters of hex (0-9, a-f)
    const isHash = /^[a-f0-9]{64}$/i.test(encryptedText);
    if (isHash) {
      console.warn('[Encryption] Detected legacy hash data, treating as corrupted/empty');
      throw new Error('Cannot decrypt legacy hash data');
    }

    console.log('[Encryption] Decrypting text, length:', encryptedText?.length || 0);
    // Try to decode Base64
    const decoded = safeAtob(encryptedText);
    console.log('[Encryption] Decoded length:', decoded?.length || 0);
    return decoded;
  } catch (error) {
    // If decoding fails, it might be plain text or the legacy hash that failed checks
    // If it's valid JSON, return it as is (migration from plain text)
    try {
      JSON.parse(encryptedText);
      return encryptedText;
    } catch {
      // If it's not valid JSON and failed decode, throw
      console.warn('[Encryption] Failed to decrypt data, returning original');
      return encryptedText;
    }
  }
}

export async function encryptMessage(text: string): Promise<EncryptedData> {
  try {
    const data = await encrypt(text);
    return { data, iv: '' };
  } catch (error) {
    console.error('[Encryption] Error encrypting message:', error);
    return { data: text, iv: '' };
  }
}

export async function decryptMessage(encryptedData: EncryptedData): Promise<string> {
  try {
    return await decrypt(encryptedData.data);
  } catch (error) {
    console.error('[Encryption] Error decrypting message:', error);
    return encryptedData.data;
  }
}

// For file attachments, we need to be more careful with base64 data
// Files are already base64 encoded, so we encode the base64 string itself
export async function encryptFile(data: string): Promise<EncryptedData> {
  try {
    if (!data || data.length === 0) {
      console.error('[Encryption] Cannot encrypt empty file data');
      return { data: '', iv: '', isBase64: true };
    }
    
    console.log('[Encryption] Encrypting file, data length:', data.length);
    // For files, the data is already base64 encoded from the file picker
    // We'll encode it again for "encryption" but mark it
    const encrypted = await encrypt(data);
    console.log('[Encryption] Encrypted file length:', encrypted?.length || 0);
    return { data: encrypted, iv: '', isBase64: true };
  } catch (error) {
    console.error('[Encryption] Error encrypting file:', error);
    // Return original data on error to preserve it
    return { data: data, iv: '', isBase64: true };
  }
}

export async function decryptFile(encryptedData: EncryptedData): Promise<string> {
  try {
    if (!encryptedData || !encryptedData.data) {
      console.error('[Encryption] No encrypted data to decrypt');
      return '';
    }
    
    console.log('[Encryption] Decrypting file, data length:', encryptedData.data.length);
    
    // Try to decrypt
    const decrypted = await decrypt(encryptedData.data);
    
    if (!decrypted || decrypted.length === 0) {
      console.warn('[Encryption] Decryption returned empty, returning original data');
      return encryptedData.data;
    }
    
    console.log('[Encryption] Decrypted file length:', decrypted.length);
    return decrypted;
  } catch (error) {
    console.error('[Encryption] Error decrypting file:', error);
    // Return raw data if decryption fails - might be unencrypted or corrupted
    console.log('[Encryption] Returning original data as fallback');
    return encryptedData.data || '';
  }
}
