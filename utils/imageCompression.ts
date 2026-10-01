/**
 * Image & Document Utilities for Employee Onboarding
 * Handles client-side image compression (HTML5 Canvas) to downscale 5MB ID photos
 * to a lightweight, highly-compressed footprint (~100-250KB) while preserving readability.
 */

export const MAX_DOCUMENT_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB Max
export const MAX_DOCUMENT_FILE_SIZE_MB = 5;

export interface CompressedImageResult {
    dataUrl: string;
    originalSizeBytes: number;
    compressedSizeBytes: number;
    compressionRatioPercent: number;
    originalSizeFormatted: string;
    compressedSizeFormatted: string;
    fileName: string;
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function validateFileSize(file: File, maxBytes: number = MAX_DOCUMENT_FILE_SIZE_BYTES): { valid: boolean; error?: string } {
    if (file.size > maxBytes) {
        return {
            valid: false,
            error: `File "${file.name}" exceeds the maximum allowed size of ${formatFileSize(maxBytes)} (Selected: ${formatFileSize(file.size)}).`
        };
    }
    return { valid: true };
}

/**
 * Compresses an image file (e.g. National ID card photo) down to a lightweight data URL.
 * Automatically resizes image dimensions (max 1280px) and applies JPEG compression.
 */
export async function compressImageFile(
    file: File,
    maxWidth: number = 1280,
    maxHeight: number = 1280,
    quality: number = 0.78
): Promise<CompressedImageResult> {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            return reject(new Error('Selected file is not an image. Please upload a JPG or PNG file.'));
        }

        const sizeCheck = validateFileSize(file);
        if (!sizeCheck.valid) {
            return reject(new Error(sizeCheck.error));
        }

        if (typeof window === 'undefined' || typeof document === 'undefined') {
            // Server-side or non-DOM fallback
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                resolve({
                    dataUrl,
                    originalSizeBytes: file.size,
                    compressedSizeBytes: file.size,
                    compressionRatioPercent: 0,
                    originalSizeFormatted: formatFileSize(file.size),
                    compressedSizeFormatted: formatFileSize(file.size),
                    fileName: file.name
                });
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
            return;
        }

        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = () => reject(new Error('Failed to parse image file'));
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Scale down dimensions if exceeding max bounds while preserving aspect ratio
                if (width > maxWidth || height > maxHeight) {
                    if (width / height > maxWidth / maxHeight) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, width);
                canvas.height = Math.max(1, height);

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not initialize image processing canvas'));
                }

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                // Export as JPEG with controlled quality
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

                // Approximate binary size from base64 string
                const base64Content = compressedDataUrl.split(',')[1] || '';
                const compressedSizeBytes = Math.round((base64Content.length * 3) / 4);

                const originalSizeBytes = file.size;
                const compressionRatioPercent = Math.max(
                    0,
                    Math.round(((originalSizeBytes - compressedSizeBytes) / originalSizeBytes) * 100)
                );

                resolve({
                    dataUrl: compressedDataUrl,
                    originalSizeBytes,
                    compressedSizeBytes,
                    compressionRatioPercent,
                    originalSizeFormatted: formatFileSize(originalSizeBytes),
                    compressedSizeFormatted: formatFileSize(compressedSizeBytes),
                    fileName: file.name
                });
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Reads a non-image document (e.g. PDF, DOCX resume or certificate) as DataURL.
 */
export async function readDocumentFile(file: File): Promise<{
    dataUrl: string;
    name: string;
    size: string;
    sizeBytes: number;
    type: string;
}> {
    const sizeCheck = validateFileSize(file);
    if (!sizeCheck.valid) {
        throw new Error(sizeCheck.error);
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error(`Failed to read document "${file.name}"`));
        reader.onload = (e) => {
            resolve({
                dataUrl: e.target?.result as string,
                name: file.name,
                size: formatFileSize(file.size),
                sizeBytes: file.size,
                type: file.name.split('.').pop()?.toLowerCase() || 'pdf'
            });
        };
        reader.readAsDataURL(file);
    });
}

export interface CompressImageOptions {
    targetSizeKB?: number;
    maxDimension?: number;
    initialQuality?: number;
}

/**
 * Legacy & helper image compression that returns a File object (used by UnknownBarcodeModal, etc.)
 */
export async function compressImage(
    input: Blob | File,
    fileName: string = 'compressed.jpg',
    options: CompressImageOptions = {}
): Promise<File> {
    const { maxDimension = 1280, initialQuality = 0.82 } = options;

    if (typeof window === 'undefined' || typeof document === 'undefined') {
        if (input instanceof File && input.name === fileName) {
            return input;
        }
        return new File([input], fileName, { type: input.type || 'image/jpeg' });
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed to read image source'));
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = () => reject(new Error('Failed to parse image blob'));
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, width);
                canvas.height = Math.max(1, height);

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas 2d context'));
                }

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (resultBlob) => {
                        if (!resultBlob) {
                            return reject(new Error('Canvas compression returned empty blob'));
                        }
                        const compressedFile = new File([resultBlob], fileName, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    },
                    'image/jpeg',
                    initialQuality
                );
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(input);
    });
}
