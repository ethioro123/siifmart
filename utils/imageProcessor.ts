/**
 * Image Processor Utility
 * 
 * Handles image format conversion (including HEIC from iPhones),
 * validation, and provides detailed error feedback.
 */

import heic2any from 'heic2any';

export interface ProcessedImage {
  success: boolean;
  dataUrl?: string;
  error?: string;
  originalFormat?: string;
  wasConverted?: boolean;
}

export interface ImageValidation {
  valid: boolean;
  error?: string;
  warning?: string;
}

// Supported image formats
const SUPPORTED_BROWSER_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'];
const HEIC_FORMATS = ['image/heic', 'image/heif'];
const SUPPORTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'tiff', 'tif', 'bmp', 'svg', 'avif', 'jfif'];

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Validate a file before processing
 */
export function validateImageFile(file: File): ImageValidation {
  // Check if file exists
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  // Check file size
  if (file.size === 0) {
    return { valid: false, error: 'The file is empty or corrupted. Please select a different image.' };
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return { 
      valid: false, 
      error: `File is too large (${sizeMB}MB). Maximum size is 10MB. Try using a smaller image or compressing it first.` 
    };
  }

  // Get file extension
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  
  // Check format by MIME type or extension
  const isValidMime = file.type.startsWith('image/') || SUPPORTED_BROWSER_FORMATS.includes(file.type) || HEIC_FORMATS.includes(file.type);
  const isValidExtension = SUPPORTED_EXTENSIONS.includes(extension);
  
  if (!isValidMime && !isValidExtension) {
    return { 
      valid: false, 
      error: `Unsupported file format "${extension || file.type || 'unknown'}". Please use: JPG, PNG, GIF, WebP, or HEIC.` 
    };
  }

  // Check for HEIC format (needs conversion warning)
  const isHeic = HEIC_FORMATS.includes(file.type.toLowerCase()) || ['heic', 'heif'].includes(extension);
  if (isHeic) {
    return { 
      valid: true, 
      warning: 'iPhone photo detected. Converting to compatible format...' 
    };
  }

  return { valid: true };
}

/**
 * Check if a file is HEIC format
 */
export function isHeicFormat(file: File): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  return HEIC_FORMATS.includes(file.type.toLowerCase()) || ['heic', 'heif'].includes(extension);
}

/**
 * Convert HEIC file to JPEG
 */
async function convertHeicToJpeg(file: File): Promise<Blob> {
  try {
    console.log('🔄 Converting HEIC to JPEG...');
    const result = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.85
    });
    
    // heic2any can return an array or single blob
    if (Array.isArray(result)) {
      return result[0];
    }
    return result;
  } catch (error) {
    console.error('HEIC conversion error:', error);
    throw new Error('Failed to convert iPhone photo. The image may be corrupted or in an unsupported format.');
  }
}

/**
 * Read file as data URL with timeout
 */
function readFileAsDataUrl(file: File | Blob, timeout: number = 30000): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    const timeoutId = setTimeout(() => {
      reader.abort();
      reject(new Error('Reading file took too long. The image may be too large or corrupted.'));
    }, timeout);
    
    reader.onload = () => {
      clearTimeout(timeoutId);
      const result = reader.result as string;
      if (!result || !result.startsWith('data:')) {
        reject(new Error('Failed to read image data. The file may be corrupted.'));
        return;
      }
      resolve(result);
    };
    
    reader.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error('Error reading file. Please try a different image.'));
    };
    
    reader.onabort = () => {
      clearTimeout(timeoutId);
      reject(new Error('File reading was cancelled.'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Verify an image can be loaded by the browser
 */
function verifyImageLoadable(dataUrl: string, timeout: number = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    const timeoutId = setTimeout(() => {
      reject(new Error('Image took too long to load. It may be corrupted or in an unsupported format.'));
    }, timeout);
    
    img.onload = () => {
      clearTimeout(timeoutId);
      // Check if image has valid dimensions
      if (img.width === 0 || img.height === 0) {
        reject(new Error('Image has invalid dimensions. Please try a different image.'));
        return;
      }
      resolve();
    };
    
    img.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error('Browser cannot display this image. Please try converting it to JPG or PNG format first.'));
    };
    
    img.src = dataUrl;
  });
}

/**
 * Process an image file - validates, converts if needed, and returns data URL
 */
export async function processImageFile(
  file: File,
  onProgress?: (status: string) => void
): Promise<ProcessedImage> {
  try {
    // Step 1: Validate
    onProgress?.('Validating file...');
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    const originalFormat = file.type || `file extension: ${file.name.split('.').pop()}`;
    let processedFile: File | Blob = file;
    let wasConverted = false;
    
    // Step 2: Convert HEIC if needed
    if (isHeicFormat(file)) {
      onProgress?.('Converting iPhone photo...');
      try {
        processedFile = await convertHeicToJpeg(file);
        wasConverted = true;
        console.log('✅ HEIC conversion successful');
      } catch (error) {
        return { 
          success: false, 
          error: (error as Error).message || 'Failed to convert iPhone photo format.',
          originalFormat
        };
      }
    }
    
    // Step 3: Read as data URL
    onProgress?.('Reading image...');
    let dataUrl: string;
    try {
      dataUrl = await readFileAsDataUrl(processedFile);
    } catch (error) {
      return { 
        success: false, 
        error: (error as Error).message || 'Failed to read image file.',
        originalFormat
      };
    }
    
    // Step 4: Verify image can be loaded
    onProgress?.('Verifying image...');
    try {
      await verifyImageLoadable(dataUrl);
    } catch (error) {
      return { 
        success: false, 
        error: (error as Error).message || 'Image cannot be displayed by your browser.',
        originalFormat
      };
    }
    
    onProgress?.('Ready!');
    return {
      success: true,
      dataUrl,
      originalFormat,
      wasConverted
    };
    
  } catch (error) {
    console.error('Image processing error:', error);
    return {
      success: false,
      error: (error as Error).message || 'An unexpected error occurred while processing the image.'
    };
  }
}

/**
 * Quick check if an image URL/data can be loaded
 */
export async function canLoadImage(src: string): Promise<boolean> {
  try {
    await verifyImageLoadable(src, 5000);
    return true;
  } catch {
    return false;
  }
}

