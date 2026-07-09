/**
 * Smart image compression - targets 2MB with good quality
 */
export const compressImage = async (file: File | Blob, fileName?: string): Promise<File> => {
    const TARGET_SIZE_MB = 2;
    const TARGET_SIZE = TARGET_SIZE_MB * 1024 * 1024;

    // If already under target, return as-is
    if (file.size <= TARGET_SIZE && file instanceof File) {
        return file;
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(img.src); // Clean up

            // Calculate optimal dimensions based on file size ratio
            const sizeRatio = (file.size || (1024 * 1024)) / TARGET_SIZE;
            let scaleFactor = Math.min(1, 1 / Math.sqrt(sizeRatio));

            // Ensure minimum quality - don't scale below 30% of original
            scaleFactor = Math.max(scaleFactor, 0.3);

            // Cap max dimension at 2560px (good for 2K displays)
            const MAX_DIMENSION = 2560;
            let width = Math.round(img.width * scaleFactor);
            let height = Math.round(img.height * scaleFactor);

            // Apply max dimension cap
            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                if (width > height) {
                    height = Math.round((height * MAX_DIMENSION) / width);
                    width = MAX_DIMENSION;
                } else {
                    width = Math.round((width * MAX_DIMENSION) / height);
                    height = MAX_DIMENSION;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }

            // Use high-quality image smoothing
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            // Progressive quality reduction to hit target
            const tryCompress = (quality: number) => {
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Compression failed'));
                            return;
                        }

                        // If still too large and quality can be reduced
                        if (blob.size > TARGET_SIZE && quality > 0.5) {
                            tryCompress(quality - 0.1);
                            return;
                        }

                        const finalFileName = fileName || (file instanceof File ? file.name : `capture_${Date.now()}.jpg`);
                        const compressedFile = new File([blob], finalFileName.replace(/\.[^.]+$/, '.jpg'), {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });

                        resolve(compressedFile);
                    },
                    'image/jpeg',
                    quality
                );
            };

            // Start with high quality (0.85) and reduce if needed
            tryCompress(0.85);
        };
        img.onerror = (error) => reject(error);
    });
};
