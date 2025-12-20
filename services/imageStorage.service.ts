/**
 * Image Storage Service
 * 
 * Handles uploading and deleting profile photos using Supabase Storage.
 * Ensures old photos are permanently deleted when new ones are uploaded.
 */

import { supabase } from '../lib/supabase';

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
export async function deleteProfilePhoto(imageUrl: string): Promise<DeleteResult> {
  try {
    // Only attempt to delete if it's a Supabase storage URL
    if (!isSupabaseStorageUrl(imageUrl)) {
      console.log('Image is not in Supabase storage, skipping delete:', imageUrl?.substring(0, 50));
      return { success: true }; // Not a storage URL, nothing to delete
    }

    const path = extractPathFromUrl(imageUrl);
    if (!path) {
      console.log('Could not extract path from URL:', imageUrl?.substring(0, 50));
      return { success: true }; // Couldn't extract path, treat as success
    }

    console.log('Deleting old profile photo from storage:', path);

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error('Error deleting profile photo:', error);
      // Don't fail the whole operation if delete fails
      return { success: false, error: error.message };
    }

    console.log('Successfully deleted old profile photo');
    return { success: true };
  } catch (error) {
    console.error('Exception deleting profile photo:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Upload a new profile photo to Supabase Storage
 * Automatically deletes the old photo if provided
 */
export async function uploadProfilePhoto(
  employeeId: string,
  imageData: string, // base64 or blob URL
  oldImageUrl?: string
): Promise<UploadResult> {
  try {
    // First, delete the old photo if it exists and is in storage
    if (oldImageUrl) {
      const deleteResult = await deleteProfilePhoto(oldImageUrl);
      if (!deleteResult.success) {
        console.warn('Failed to delete old photo, continuing with upload:', deleteResult.error);
      }
    }

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
    if (!allowedMimeTypes.some(type => mimeType.startsWith(type.split('/')[0]))) {
      return {
        success: false,
        error: `Unsupported image format: ${mimeType}. Please use JPG, PNG, GIF, or WebP.`
      };
    }

    // Generate filename
    const extension = mimeType.split('/')[1] || 'jpg';
    const fileName = generateFileName(employeeId, extension);

    console.log('Uploading new profile photo:', fileName, 'Size:', (imageBlob.size / 1024).toFixed(1), 'KB');

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, imageBlob, {
        contentType: mimeType,
        upsert: false // Don't overwrite, use unique names
      });

    if (error) {
      console.error('Error uploading profile photo:', error);
      
      // Parse specific Supabase errors for better feedback
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('bucket') && errorMessage.includes('not found')) {
        return { success: false, error: 'Storage not configured. Please contact your administrator to set up the avatars storage bucket.' };
      } else if (errorMessage.includes('payload too large') || errorMessage.includes('413')) {
        return { success: false, error: 'Image file is too large for upload. Please reduce the file size and try again.' };
      } else if (errorMessage.includes('unauthorized') || errorMessage.includes('403')) {
        return { success: false, error: 'Storage access denied. You may not have permission to upload photos.' };
      } else if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('fetch')) {
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

    console.log('Successfully uploaded profile photo:', urlData.publicUrl);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path
    };
  } catch (error) {
    console.error('Exception uploading profile photo:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Clean up all profile photos for an employee (used when deleting employee)
 */
export async function deleteAllEmployeePhotos(employeeId: string): Promise<DeleteResult> {
  try {
    const folderPath = `profile-photos/${employeeId}`;
    
    // List all files in the employee's folder
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list(folderPath);

    if (listError) {
      console.error('Error listing employee photos:', listError);
      return { success: false, error: listError.message };
    }

    if (!files || files.length === 0) {
      return { success: true }; // No files to delete
    }

    // Delete all files
    const filePaths = files.map(file => `${folderPath}/${file.name}`);
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(filePaths);

    if (deleteError) {
      console.error('Error deleting employee photos:', deleteError);
      return { success: false, error: deleteError.message };
    }

    console.log(`Deleted ${filePaths.length} photos for employee ${employeeId}`);
    return { success: true };
  } catch (error) {
    console.error('Exception deleting employee photos:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Initialize the storage bucket if it doesn't exist
 * This should be called once during app initialization
 */
export async function initializeAvatarsBucket(): Promise<void> {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.warn('Could not list buckets:', listError.message);
      return;
    }

    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);
    
    if (!bucketExists) {
      console.log('Creating avatars bucket...');
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true, // Make avatars publicly accessible
        fileSizeLimit: MAX_FILE_SIZE
      });

      if (createError) {
        console.warn('Could not create avatars bucket:', createError.message);
      } else {
        console.log('Avatars bucket created successfully');
      }
    }
  } catch (error) {
    console.warn('Error initializing avatars bucket:', error);
  }
}

export const imageStorageService = {
  uploadProfilePhoto,
  deleteProfilePhoto,
  deleteAllEmployeePhotos,
  initializeAvatarsBucket,
  isSupabaseStorageUrl,
  extractPathFromUrl
};

