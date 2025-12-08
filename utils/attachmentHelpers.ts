import { Platform, Alert, Share } from 'react-native';
import type { Attachment } from '@/contexts/CalendarContext';

export type AttachmentSourceFeature = 'analytics' | 'planner' | 'notes' | 'mindmap' | 'external';

export interface CreateAttachmentParams {
  name: string;
  type: string;
  uri: string;
  size: number;
  sourceFeature?: AttachmentSourceFeature;
  sourceId?: string;
  metadata?: {
    trackerType?: string;
    taskId?: string;
    noteId?: string;
    mindmapId?: string;
    [key: string]: any;
  };
  permissions?: 'edit_download' | 'view_download' | 'view_only';
}

export function createAttachmentWithMetadata(params: CreateAttachmentParams): Attachment {
  return {
    id: `attachment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: params.name,
    type: params.type,
    uri: params.uri,
    size: params.size,
    uploadedAt: new Date().toISOString(),
    sourceFeature: params.sourceFeature || 'external',
    sourceId: params.sourceId,
    metadata: params.metadata,
    permissions: params.permissions || 'edit_download',
  };
}

export function createAnalyticsAttachment(
  name: string,
  uri: string,
  size: number,
  trackerId?: string,
  trackerType?: string
): Attachment {
  return createAttachmentWithMetadata({
    name,
    type: name.endsWith('.csv') ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uri,
    size,
    sourceFeature: 'analytics',
    sourceId: trackerId,
    metadata: {
      trackerType,
    },
  });
}

export function createPlannerAttachment(
  name: string,
  uri: string,
  size: number,
  taskId?: string
): Attachment {
  return createAttachmentWithMetadata({
    name,
    type: 'application/json',
    uri,
    size,
    sourceFeature: 'planner',
    sourceId: taskId,
    metadata: {
      taskId,
    },
  });
}

export function createNoteAttachment(
  name: string,
  uri: string,
  size: number,
  noteId?: string
): Attachment {
  return createAttachmentWithMetadata({
    name,
    type: 'text/plain',
    uri,
    size,
    sourceFeature: 'notes',
    sourceId: noteId,
    metadata: {
      noteId,
    },
  });
}

export function createMindMapAttachment(
  name: string,
  uri: string,
  size: number,
  mindmapId?: string
): Attachment {
  return createAttachmentWithMetadata({
    name,
    type: 'application/json',
    uri,
    size,
    sourceFeature: 'mindmap',
    sourceId: mindmapId,
    metadata: {
      mindmapId,
    },
  });
}

export interface DownloadOptions {
  fileName: string;
  fileData: string;
  fileType: string;
  showSuccessAlert?: boolean;
}

export async function downloadAttachmentToDevice(options: DownloadOptions): Promise<boolean> {
  const { fileName, fileData, fileType, showSuccessAlert = true } = options;

  console.log('[Download] Starting download:', fileName);
  console.log('[Download] File type:', fileType);
  console.log('[Download] Data length:', fileData?.length || 0);

  try {
    if (Platform.OS === 'web') {
      return downloadForWeb(fileName, fileData, fileType);
    } else {
      return downloadForNative(fileName, fileData, fileType, showSuccessAlert);
    }
  } catch (error) {
    console.error('[Download] Error:', error);
    Alert.alert('Download Error', 'Failed to download the file. Please try again.');
    return false;
  }
}

function downloadForWeb(fileName: string, fileData: string, fileType: string): boolean {
  try {
    console.log('[Download Web] Creating blob for:', fileName);
    
    let blob: Blob;
    
    if (isBase64Data(fileData)) {
      const byteCharacters = atob(fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: fileType });
    } else {
      blob = new Blob([fileData], { type: fileType });
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('[Download Web] Success:', fileName);
    Alert.alert('Success', 'File downloaded successfully');
    return true;
  } catch (error) {
    console.error('[Download Web] Error:', error);
    Alert.alert('Download Error', 'Failed to download the file on web.');
    return false;
  }
}

async function downloadForNative(fileName: string, fileData: string, fileType: string, _showSuccessAlert: boolean): Promise<boolean> {
  try {
    console.log('[Download Native] Preparing file:', fileName);
    
    const FileSystemModule = await import('expo-file-system') as any;
    const SharingModule = await import('expo-sharing') as any;
    
    const cacheDir = FileSystemModule.cacheDirectory || '';
    const fileUri = `${cacheDir}${fileName}`;
    
    const base64Encoding = FileSystemModule.EncodingType?.Base64 || 'base64';
    const utf8Encoding = FileSystemModule.EncodingType?.UTF8 || 'utf8';
    
    const writeAsync = FileSystemModule.writeAsStringAsync;
    const isAvailable = SharingModule.isAvailableAsync;
    const shareAsync = SharingModule.shareAsync;
    
    if (isBase64Data(fileData)) {
      await writeAsync(fileUri, fileData, {
        encoding: base64Encoding,
      });
    } else {
      await writeAsync(fileUri, fileData, {
        encoding: utf8Encoding,
      });
    }

    console.log('[Download Native] File written to:', fileUri);

    const canShare = await isAvailable();
    
    if (canShare) {
      await shareAsync(fileUri, {
        mimeType: fileType,
        dialogTitle: `Save ${fileName}`,
        UTI: getUTIForMimeType(fileType),
      });
      console.log('[Download Native] Share dialog opened');
      return true;
    } else {
      await Share.share({
        title: fileName,
        message: `Saving file: ${fileName}`,
        url: fileUri,
      });
      console.log('[Download Native] Share fallback used');
      return true;
    }
  } catch (error) {
    console.error('[Download Native] Error:', error);
    
    try {
      console.log('[Download Native] Trying Share API fallback');
      await Share.share({
        title: fileName,
        message: fileData.substring(0, 500),
      });
      return true;
    } catch (fallbackError) {
      console.error('[Download Native] Fallback error:', fallbackError);
      Alert.alert('Download Error', 'Failed to save the file. Please try again.');
      return false;
    }
  }
}

function isBase64Data(data: string): boolean {
  if (!data || data.length === 0) return false;
  
  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  const isLikelyBase64 = base64Regex.test(data.substring(0, Math.min(1000, data.length)));
  
  if (data.startsWith('data:')) return false;
  
  return isLikelyBase64 && data.length > 100;
}

function getUTIForMimeType(mimeType: string): string {
  const utiMap: { [key: string]: string } = {
    'application/pdf': 'com.adobe.pdf',
    'image/png': 'public.png',
    'image/jpeg': 'public.jpeg',
    'image/jpg': 'public.jpeg',
    'image/gif': 'com.compuserve.gif',
    'text/plain': 'public.plain-text',
    'text/csv': 'public.comma-separated-values-text',
    'application/json': 'public.json',
    'audio/mpeg': 'public.mp3',
    'audio/mp4': 'public.mpeg-4-audio',
    'audio/m4a': 'public.mpeg-4-audio',
    'audio/wav': 'com.microsoft.waveform-audio',
    'audio/webm': 'public.audio',
    'video/mp4': 'public.mpeg-4',
    'video/webm': 'public.movie',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'org.openxmlformats.spreadsheetml.sheet',
    'application/vnd.ms-excel': 'com.microsoft.excel.xls',
  };
  
  return utiMap[mimeType] || 'public.data';
}

export function getMimeTypeFromFileName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  const mimeTypes: { [key: string]: string } = {
    'pdf': 'application/pdf',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'json': 'application/json',
    'mp3': 'audio/mpeg',
    'mp4': 'video/mp4',
    'm4a': 'audio/m4a',
    'wav': 'audio/wav',
    'webm': 'audio/webm',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls': 'application/vnd.ms-excel',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

export async function shareAttachment(options: DownloadOptions): Promise<boolean> {
  const { fileName, fileData, fileType } = options;

  console.log('[Share] Starting share:', fileName);

  try {
    if (Platform.OS === 'web') {
      return downloadForWeb(fileName, fileData, fileType);
    }

    const FileSystemModule = await import('expo-file-system') as any;
    const SharingModule = await import('expo-sharing') as any;
    
    const cacheDir = FileSystemModule.cacheDirectory || '';
    const fileUri = `${cacheDir}${fileName}`;
    
    const base64Encoding = FileSystemModule.EncodingType?.Base64 || 'base64';
    const utf8Encoding = FileSystemModule.EncodingType?.UTF8 || 'utf8';
    
    const writeAsync = FileSystemModule.writeAsStringAsync;
    const isAvailable = SharingModule.isAvailableAsync;
    const shareAsync = SharingModule.shareAsync;
    
    if (isBase64Data(fileData)) {
      await writeAsync(fileUri, fileData, {
        encoding: base64Encoding,
      });
    } else {
      await writeAsync(fileUri, fileData, {
        encoding: utf8Encoding,
      });
    }

    const canShare = await isAvailable();
    
    if (canShare) {
      await shareAsync(fileUri, {
        mimeType: fileType,
        dialogTitle: `Share ${fileName}`,
      });
      return true;
    } else {
      await Share.share({
        title: fileName,
        url: fileUri,
      });
      return true;
    }
  } catch (error) {
    console.error('[Share] Error:', error);
    Alert.alert('Share Error', 'Failed to share the file. Please try again.');
    return false;
  }
}

export interface ShareViaEmailOptions {
  fileName: string;
  fileData: string;
  fileType: string;
  recipientEmail?: string;
  subject?: string;
  body?: string;
}

export async function shareViaEmail(options: ShareViaEmailOptions): Promise<boolean> {
  const { fileName, fileData, fileType, recipientEmail = '', subject = 'Shared File', body = 'Please find the attached file.' } = options;

  console.log('[Email Share] Preparing to share via email:', fileName);

  try {
    if (Platform.OS === 'web') {
      const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body + '\n\nNote: File attachment not supported in web mailto links. Please download the file and attach manually.')}`;
      const win = window.open(mailtoLink, '_blank');
      if (win) {
        win.focus();
      }
      await downloadForWeb(fileName, fileData, fileType);
      return true;
    }

    const MailComposerModule = await import('expo-mail-composer') as any;
    const FileSystemModule = await import('expo-file-system') as any;
    
    const isAvailableAsync = MailComposerModule.isAvailableAsync;
    const composeAsync = MailComposerModule.composeAsync;
    
    const isAvailable = await isAvailableAsync();
    
    if (!isAvailable) {
      Alert.alert('Email Not Available', 'Email is not configured on this device.');
      return false;
    }

    const cacheDir = FileSystemModule.cacheDirectory || '';
    const fileUri = `${cacheDir}${fileName}`;
    
    const base64Encoding = FileSystemModule.EncodingType?.Base64 || 'base64';
    const utf8Encoding = FileSystemModule.EncodingType?.UTF8 || 'utf8';
    const writeAsync = FileSystemModule.writeAsStringAsync;
    
    if (isBase64Data(fileData)) {
      await writeAsync(fileUri, fileData, {
        encoding: base64Encoding,
      });
    } else {
      await writeAsync(fileUri, fileData, {
        encoding: utf8Encoding,
      });
    }

    const emailOptions: any = {
      recipients: recipientEmail ? [recipientEmail] : [],
      subject,
      body,
      attachments: [fileUri],
    };

    const result = await composeAsync(emailOptions);
    
    console.log('[Email Share] Email composer result:', result);
    return result.status === 'sent' || result.status === 'saved';
  } catch (error) {
    console.error('[Email Share] Error:', error);
    Alert.alert('Email Error', 'Failed to share via email. Please try again.');
    return false;
  }
}

export interface PickFileOptions {
  type?: 'image' | 'video' | 'audio' | 'document' | 'any';
  allowMultiple?: boolean;
  maxSizeInMB?: number;
}

export interface PickedFile {
  name: string;
  uri: string;
  type: string;
  size: number;
  base64Data: string;
}

export async function pickFileFromDevice(options: PickFileOptions = {}): Promise<PickedFile | null> {
  const { type = 'any', allowMultiple = false, maxSizeInMB = 10 } = options;

  try {
    console.log('[Pick File] ====== Starting file picker ======');
    console.log('[Pick File] Type requested:', type);
    console.log('[Pick File] Platform:', Platform.OS);
    console.log('[Pick File] Max size:', maxSizeInMB, 'MB');
    
    let DocumentPicker;
    try {
      DocumentPicker = await import('expo-document-picker');
      console.log('[Pick File] Document picker module loaded');
      console.log('[Pick File] Module exports:', Object.keys(DocumentPicker));
    } catch (importError) {
      console.error('[Pick File] Failed to import expo-document-picker:', importError);
      Alert.alert('Module Error', 'Document picker module could not be loaded. Please ensure expo-document-picker is installed.');
      return null;
    }

    const getDocumentAsync = DocumentPicker.getDocumentAsync || (DocumentPicker as any).default?.getDocumentAsync;

    if (!getDocumentAsync) {
      console.error('[Pick File] getDocumentAsync not found in module');
      console.log('[Pick File] Available exports:', Object.keys(DocumentPicker));
      Alert.alert('File Picker Error', 'File picker is not available. Try updating the app.');
      return null;
    }

    let mimeType: string | string[] = '*/*';
    
    if (type === 'image') {
      mimeType = Platform.OS === 'web' ? 'image/*' : ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/*'];
    } else if (type === 'video') {
      mimeType = Platform.OS === 'web' ? 'video/*' : ['video/mp4', 'video/quicktime', 'video/x-m4v', 'video/*'];
    } else if (type === 'audio') {
      mimeType = Platform.OS === 'web' ? 'audio/*' : ['audio/mpeg', 'audio/mp4', 'audio/m4a', 'audio/wav', 'audio/*'];
    } else if (type === 'document') {
      mimeType = Platform.OS === 'web' 
        ? 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
    }
    
    console.log('[Pick File] Opening picker with mimeType:', mimeType);
    
    let result;
    try {
      result = await getDocumentAsync({
        type: mimeType,
        copyToCacheDirectory: Platform.OS !== 'web',
        multiple: allowMultiple,
      });
      console.log('[Pick File] Picker returned successfully');
      console.log('[Pick File] Picker result canceled status:', result.canceled);
    } catch (pickerError) {
      console.error('[Pick File] Document picker error:', pickerError);
      const errorMsg = pickerError instanceof Error ? pickerError.message : 'Unknown error';
      console.error('[Pick File] Error message:', errorMsg);
      Alert.alert('Picker Error', `Failed to open file picker: ${errorMsg}`);
      return null;
    }

    console.log('[Pick File] Picker result:', result.canceled ? 'CANCELED' : 'FILE SELECTED');
    console.log('[Pick File] Full result object keys:', Object.keys(result));

    if (result.canceled || (result as any).type === 'cancel') {
      console.log('[Pick File] User cancelled file picker');
      return null;
    }
    
    if (!result.assets || result.assets.length === 0) {
      console.log('[Pick File] No assets in result');
      console.log('[Pick File] Checking if result has direct file properties...');
      
      if ((result as any).uri && (result as any).name) {
        console.log('[Pick File] Found legacy format, converting to assets format');
        result = {
          ...result,
          assets: [{
            uri: (result as any).uri,
            name: (result as any).name,
            mimeType: (result as any).mimeType,
            size: (result as any).size,
          }]
        };
      } else {
        Alert.alert('No File Selected', 'No file was selected. Please try again.');
        return null;
      }
    }

    const file = result.assets[0];
    console.log('[Pick File] ====== File Details ======');
    console.log('[Pick File] Name:', file.name);
    console.log('[Pick File] URI:', file.uri);
    console.log('[Pick File] MIME Type:', file.mimeType);
    console.log('[Pick File] Size:', file.size, 'bytes');
    
    if (file.size && file.size > maxSizeInMB * 1024 * 1024) {
      Alert.alert('File Too Large', `Please select a file smaller than ${maxSizeInMB}MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`);
      return null;
    }

    if (!file.uri) {
      console.error('[Pick File] No URI in file result');
      Alert.alert('File Error', 'Failed to get file location. Please try again.');
      return null;
    }

    console.log('[Pick File] ====== Reading File Content ======');

    if (Platform.OS === 'web') {
      console.log('[Pick File] Using Web file reading method');
      let blob: Blob;
      
      try {
        console.log('[Pick File] Fetching file from URI:', file.uri);
        
        if (file.uri.startsWith('blob:') || file.uri.startsWith('data:')) {
          const response = await fetch(file.uri);
          console.log('[Pick File] Fetch response status:', response.status);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
          }
          blob = await response.blob();
          console.log('[Pick File] Blob created - size:', blob.size, 'type:', blob.type);
        } else if ((file as any).file instanceof Blob) {
          console.log('[Pick File] Using file.file Blob directly');
          blob = (file as any).file;
          console.log('[Pick File] Blob size:', blob.size, 'type:', blob.type);
        } else {
          throw new Error('Unsupported file URI format for web');
        }
      } catch (fetchError) {
        console.error('[Pick File] Fetch error:', fetchError);
        const errMsg = fetchError instanceof Error ? fetchError.message : 'Unknown error';
        Alert.alert('Read Error', `Failed to read the selected file: ${errMsg}`);
        return null;
      }
      
      if (blob.size === 0) {
        console.error('[Pick File] Empty blob received');
        Alert.alert('Empty File', 'The selected file appears to be empty.');
        return null;
      }
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onloadend = () => {
          try {
            console.log('[Pick File] FileReader finished reading');
            const base64data = reader.result as string;
            
            if (!base64data) {
              console.error('[Pick File] No data from FileReader');
              Alert.alert('Read Error', 'Failed to read file data.');
              resolve(null);
              return;
            }
            
            const base64 = base64data.includes(',') ? base64data.split(',')[1] : base64data;
            
            if (!base64 || base64.length === 0) {
              console.error('[Pick File] Empty base64 data');
              resolve(null);
              return;
            }
            
            const detectedMimeType = file.mimeType || getMimeTypeFromFileName(file.name || '');
            console.log('[Pick File] ====== File Processed Successfully ======');
            console.log('[Pick File] Base64 length:', base64.length);
            console.log('[Pick File] MIME type:', detectedMimeType);
            
            resolve({
              name: file.name || `file_${Date.now()}`,
              uri: file.uri,
              type: detectedMimeType,
              size: file.size || blob.size || base64.length,
              base64Data: base64,
            });
          } catch (processError) {
            console.error('[Pick File] Processing error:', processError);
            resolve(null);
          }
        };
        
        reader.onerror = (error) => {
          console.error('[Pick File] FileReader error:', error);
          Alert.alert('Read Error', 'An error occurred while reading the file.');
          resolve(null);
        };
        
        reader.readAsDataURL(blob);
      });
    } else {
      console.log('[Pick File] Using Native file reading method');
      try {
        const FileSystem = await import('expo-file-system');
        console.log('[Pick File] FileSystem module loaded');
        
        console.log('[Pick File] Getting file info for URI:', file.uri);
        const fileInfo = await FileSystem.getInfoAsync(file.uri);
        console.log('[Pick File] File info:', JSON.stringify(fileInfo, null, 2));
        
        if (!fileInfo.exists) {
          console.error('[Pick File] File does not exist at URI:', file.uri);
          Alert.alert('File Not Found', 'File could not be found. Please try again.');
          return null;
        }
        
        const fileContent = await FileSystem.readAsStringAsync(file.uri, {
          encoding: 'base64' as any,
        });
        
        if (!fileContent || fileContent.length === 0) {
          console.error('[Pick File] FileSystem returned empty content');
          Alert.alert('Empty File', 'File appears to be empty. Please try a different file.');
          return null;
        }
        
        console.log('[Pick File] ====== File Processed Successfully ======');
        console.log('[Pick File] Content length:', fileContent.length);
        
        const detectedMimeType = file.mimeType || getMimeTypeFromFileName(file.name || '');
        
        return {
          name: file.name || `file_${Date.now()}`,
          uri: file.uri,
          type: detectedMimeType,
          size: file.size || fileContent.length,
          base64Data: fileContent,
        };
      } catch (fsError) {
        console.error('[Pick File] FileSystem read error:', fsError);
        Alert.alert('Read Error', 'Failed to read the selected file. Please try again.');
        return null;
      }
    }
  } catch (error) {
    console.error('[Pick File] Unexpected error:', error);
    Alert.alert('Unexpected Error', 'An unexpected error occurred while selecting file. Please try again.');
    return null;
  }
}
