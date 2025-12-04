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
    if (!str || str.length === 0) {
      console.warn('[Encryption] safeAtob: empty string');
      return '';
    }
    
    // Validate base64 format first
    if (!isValidBase64(str)) {
      console.warn('[Encryption] safeAtob: invalid base64 format, returning original');
      return str;
    }
    
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
  } catch {
    console.warn('[Encryption] safeAtob: decode failed, returning original');
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
    if (!encryptedText || encryptedText.length === 0) {
      return '';
    }
    
    // Check if it's a SHA256 hash (legacy corrupted data)
    // SHA256 hash is 64 characters of hex (0-9, a-f)
    const isHash = /^[a-f0-9]{64}$/i.test(encryptedText);
    if (isHash) {
      console.warn('[Encryption] Detected legacy hash data, treating as corrupted/empty');
      throw new Error('Cannot decrypt legacy hash data');
    }

    // Check if it's valid base64 before attempting decode
    if (!isValidBase64(encryptedText)) {
      console.warn('[Encryption] Not valid base64, treating as plain text');
      return encryptedText;
    }

    console.log('[Encryption] Decrypting text, length:', encryptedText?.length || 0);
    // Try to decode Base64
    const decoded = safeAtob(encryptedText);
    console.log('[Encryption] Decoded length:', decoded?.length || 0);
    return decoded;
  } catch {
    // If decoding fails, it might be plain text or the legacy hash that failed checks
    // If it's valid JSON, return it as is (migration from plain text)
    try {
      JSON.parse(encryptedText);
      return encryptedText;
    } catch {
      // If it's not valid JSON and failed decode, return original
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
// Files are already base64 encoded, so we should NOT double-encode them
// We use a simple reversible transformation that preserves base64 characters
export async function encryptFile(data: string): Promise<EncryptedData> {
  try {
    if (!data || data.length === 0) {
      console.error('[Encryption] Cannot encrypt empty file data');
      return { data: '', iv: '', isBase64: true };
    }
    
    console.log('[Encryption] Encrypting file, data length:', data.length);
    
    // For files that are already base64 encoded, we just store them directly
    // with a marker prefix to indicate they're file data (not double-encoded)
    // This prevents the double-encoding issue that causes InvalidCharacterError
    const marker = 'FILE_B64:';
    const encrypted = marker + data;
    
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
    
    const data = encryptedData.data;
    const marker = 'FILE_B64:';
    
    // Check if this is a file with our marker prefix (new format)
    if (data.startsWith(marker)) {
      const decrypted = data.substring(marker.length);
      console.log('[Encryption] Decrypted file (marker format) length:', decrypted.length);
      return decrypted;
    }
    
    // Legacy handling: try to decrypt using the old method
    // This handles files that were encrypted with the old double-encoding method
    try {
      const decrypted = await decrypt(data);
      
      if (!decrypted || decrypted.length === 0) {
        console.warn('[Encryption] Decryption returned empty, returning original data');
        return data;
      }
      
      console.log('[Encryption] Decrypted file (legacy format) length:', decrypted.length);
      return decrypted;
    } catch {
      // If legacy decryption fails, the data might already be plain base64
      console.warn('[Encryption] Legacy decryption failed, returning original data');
      return data;
    }
  } catch (error) {
    console.error('[Encryption] Error decrypting file:', error);
    // Return raw data if decryption fails - might be unencrypted or corrupted
    console.log('[Encryption] Returning original data as fallback');
    return encryptedData.data || '';
  }
}
