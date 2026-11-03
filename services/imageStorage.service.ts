/**
 * Image Storage Service
 * 
 * Handles uploading and deleting profile photos using Supabase Storage.
 * Preserves earlier identity images when a new photo is uploaded.
 */

import { supabase } from '../lib/supabase';
import { employeeAvatarSchema } from '../schemas/employee-avatar.schema';
import { logger } from '../utils/logger';

const BUCKET_NAME = 'avatars';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  path?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Extract the storage path from a Supabase storage URL
 */
function extractPathFromUrl(url: string): string | null {
  if (!url) return null;

  // Check if it's a Supabase storage URL
  if (url.includes('/storage/v1/object/public/')) {
    const match = url.match(/\/storage\/v1\/object\/public\/avatars\/(.+)/);
    return match ? match[1] : null;
  }

  // Check if it's already just a path
  if (url.startsWith('avatars/') || url.startsWith('profile-photos/')) {
    return url.replace('avatars/', '');
  }

  return null;
}

/**
 * Check if a URL is a Supabase storage URL (not an external URL or base64)
 */
function isSupabaseStorageUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('/storage/v1/object/public/avatars/');
}

/**
 * Convert base64 to Blob
 */
function base64ToBlob(base64: string, mimeType: string = 'image/jpeg'): Blob {
  const base64Data = base64.split(',')[1] || base64;
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Generate a unique filename for the image
 */
function generateFileName(employeeId: string, extension: string = 'jpg'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `profile-photos/${employeeId}/${timestamp}-${random}.${extension}`;
}

/**
 * Delete a profile photo from Supabase Storage
 */
export async function deleteProfilePhoto(_imageUrl: string): Promise<DeleteResult> {
  return { success: false, error: 'Profile photos are retained identity evidence and cannot be permanently deleted.' };
}

/**
 * Upload a new profile photo to Supabase Storage
 * Retains earlier versions and uploads a new uniquely named photo
 */
export async function uploadProfilePhoto(
  employeeId: string,
  imageData: string, // base64 or blob URL
  _oldImageUrl?: string
): Promise<UploadResult> {
  try {
    if (!employeeAvatarSchema.safeParse({ employeeId, imageData }).success) return { success: false, error: 'A valid employee and an image within the upload size limit are required.' };
    // Convert base64 to blob if necessary
    let imageBlob: Blob;
    let mimeType = 'image/jpeg';

    if (imageData.startsWith('data:')) {
      // Extract MIME type from base64
      const mimeMatch = imageData.match(/data:([^;]+);/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
      imageBlob = base64ToBlob(imageData, mimeType);
    } else if (imageData.startsWith('blob:')) {
      // Fetch blob URL
      const response = await fetch(imageData);
      imageBlob = await response.blob();
      mimeType = imageBlob.type || 'image/jpeg';
    } else {
      // Assume it's already base64 without prefix
      imageBlob = base64ToBlob(imageData, mimeType);
    }

    // Check file size with detailed feedback
    if (imageBlob.size > MAX_FILE_SIZE) {
      const actualSizeMB = (imageBlob.size / (1024 * 1024)).toFixed(1);
      const maxSizeMB = MAX_FILE_SIZE / 1024 / 1024;
      return {
        success: false,
        error: `Image size (${actualSizeMB}MB) exceeds maximum (${maxSizeMB}MB). Please compress the image or use a lower resolution.`
      };
    }

    // Check for empty or corrupted data
    if (imageBlob.size === 0) {
      return {
        success: false,
        error: 'Image data is empty or corrupted. Please try selecting a different image.'
      };
    }

    // Validate MIME type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];
    if (!allowedMimeTypes.includes(mimeType)) {
      return {
        success: false,
        error: `Unsupported image format: ${mimeType}. Please use JPG, PNG, GIF, or WebP.`
      };
    }

    // Generate filename
    const extension = mimeType.split('/')[1] || 'jpg';
    const fileName = generateFileName(employeeId, extension);


    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, imageBlob, {
        contentType: mimeType,
        upsert: false // Don't overwrite, use unique names
      });

    if (error) {
      logger.error('imageStorage', 'Error uploading profile photo:', error);

      // Parse specific Supabase errors for better feedback
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('bucket') && errorMessage.includes('not found')) {
        return { success: false, error: 'Storage not configured. Please contact your administrator to set up the avatars storage bucket.' };
      } else if (errorMessage.includes('payload too large') || errorMessage.includes('413')) {
        return { success: false, error: 'Image file is too large for upload. Please reduce the file size and try again.' };
      } else if (errorMessage.includes('row-level security') || errorMessage.includes('policy')) {
        return { success: false, error: 'Storage permission error. Please ensure the avatars bucket policy is configured (run any pending SQL migrations if you haven\'t already).' };
      }
 else if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('fetch')) {
        return { success: false, error: 'Network error during upload. Please check your connection and try again.' };
      } else if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
        return { success: false, error: 'A file with this name already exists. Please try again.' };
      }

      return { success: false, error: error.message };
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);


    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path
    };
  } catch (error) {
    logger.error('imageStorage', 'Exception uploading profile photo:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Clean up all profile photos for an employee (used when deleting employee)
 */
export async function deleteAllEmployeePhotos(_employeeId: string): Promise<DeleteResult> {
  return { success: false, error: 'Employee photo history is retained and cannot be permanently deleted.' };
}

/**
 * Initialize the storage bucket if it doesn't exist
 * This should be called once during app initialization
 */
export async function initializeAvatarsBucket(): Promise<void> {
  // Buckets and their permissions are provisioned by trusted migrations.
}

export const imageStorageService = {
  uploadProfilePhoto,
  deleteProfilePhoto,
  deleteAllEmployeePhotos,
  initializeAvatarsBucket,
  isSupabaseStorageUrl,
  extractPathFromUrl
};

