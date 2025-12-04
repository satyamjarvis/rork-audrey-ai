import * as Crypto from 'expo-crypto';

// NOTE: We cannot use SHA256 for encryption as it is a one-way hash.
// We are switching to simple Base64 encoding for obfuscation as we don't have
// a native encryption library available in this environment.
// In a real app, you would use expo-secure-store or a proper encryption library.

export type EncryptedData = {
  data: string;
  iv: string;
};

export async function encrypt(text: string): Promise<string> {
  try {
    // Simple Base64 encoding for obfuscation
    const encoded = btoa(text);
    return encoded;
  } catch (error) {
    console.error('Error encrypting:', error);
    return text;
  }
}

export async function decrypt(encryptedText: string): Promise<string> {
  try {
    // Check if it's a SHA256 hash (legacy corrupted data)
    // SHA256 hash is 64 characters of hex (0-9, a-f)
    const isHash = /^[a-f0-9]{64}$/i.test(encryptedText);
    if (isHash) {
      console.warn('Detected legacy hash data, treating as corrupted/empty');
      throw new Error('Cannot decrypt legacy hash data');
    }

    // Try to decode Base64
    const decoded = atob(encryptedText);
    return decoded;
  } catch (error) {
    // If decoding fails, it might be plain text or the legacy hash that failed checks
    // If it's valid JSON, return it as is (migration from plain text)
    try {
      JSON.parse(encryptedText);
      return encryptedText;
    } catch {
      // If it's not valid JSON and failed decode, throw
      console.warn('Failed to decrypt data, returning original');
      return encryptedText;
    }
  }
}

export async function encryptMessage(text: string): Promise<EncryptedData> {
  try {
    const data = await encrypt(text);
    return { data, iv: '' };
  } catch (error) {
    console.error('Error encrypting message:', error);
    return { data: text, iv: '' };
  }
}

export async function decryptMessage(encryptedData: EncryptedData): Promise<string> {
  try {
    return await decrypt(encryptedData.data);
  } catch (error) {
    console.error('Error decrypting message:', error);
    return encryptedData.data;
  }
}

export async function encryptFile(data: string): Promise<EncryptedData> {
  return encryptMessage(data);
}

export async function decryptFile(encryptedData: EncryptedData): Promise<string> {
  return decryptMessage(encryptedData);
}
