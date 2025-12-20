import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, Link, X, Image as ImageIcon, RefreshCw, Loader2 } from 'lucide-react';

interface ImageUploadProps {
    value?: string;
    onChange: (imageData: string) => void;
    onError?: (error: string) => void;
    placeholder?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB to accommodate larger iPhone photos

// Comprehensive list of image MIME types
const ACCEPTED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/tiff',
    'image/bmp',
    'image/svg+xml',
    'image/avif',
    'image/x-icon',
    'image/vnd.microsoft.icon',
];

// File extensions to accept (for cases where MIME type isn't detected properly)
const ACCEPTED_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif',
    '.tiff', '.tif', '.bmp', '.svg', '.avif', '.ico', '.jfif'
];

// Check if file is a valid image by MIME type or extension
const isValidImageFile = (file: File): boolean => {
    // Check MIME type
    if (file.type && (file.type.startsWith('image/') || ACCEPTED_MIME_TYPES.includes(file.type.toLowerCase()))) {
        return true;
    }
    // Fallback: check file extension (especially for HEIC on some browsers)
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return ACCEPTED_EXTENSIONS.includes(extension);
};

export default function ImageUpload({
    value,
    onChange,
    onError,
    placeholder = 'Upload product image',
    size = 'md',
    className = '',
    disabled = false,
}: ImageUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const sizeClasses = {
        sm: 'w-24 h-24',
        md: 'w-32 h-32',
        lg: 'w-40 h-40',
    };

    const handleError = useCallback((message: string) => {
        setError(message);
        onError?.(message);
        setTimeout(() => setError(null), 3000);
    }, [onError]);

    const compressImage = useCallback(async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new window.Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject('Failed to get canvas context');
                        return;
                    }

                    // Max dimensions
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let { width, height } = img;

                    // Maintain aspect ratio
                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height = (height * MAX_WIDTH) / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width = (width * MAX_HEIGHT) / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);

                    // Compress to JPEG with 0.8 quality
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    resolve(compressedDataUrl);
                };
                img.onerror = () => reject('Failed to load image');
                img.src = e.target?.result as string;
            };
            reader.onerror = () => reject('Failed to read file');
            reader.readAsDataURL(file);
        });
    }, []);

    const processFile = useCallback(async (file: File) => {
        // Validate file type using comprehensive check
        if (!isValidImageFile(file)) {
            handleError('Invalid file type. Please select an image file (JPG, PNG, HEIC, etc.).');
            return;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            handleError('File too large. Maximum size is 10MB.');
            return;
        }

        setIsLoading(true);
        try {
            const compressedImage = await compressImage(file);
            onChange(compressedImage);
            setError(null);
        } catch (err) {
            handleError('Failed to process image. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [compressImage, onChange, handleError]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
        // Reset input
        e.target.value = '';
    }, [processFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setIsDragging(true);
        }
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (disabled) return;

        const file = e.dataTransfer.files?.[0];
        if (file) {
            processFile(file);
        }
    }, [disabled, processFile]);

    const handleUrlSubmit = useCallback(async () => {
        if (!urlInput.trim()) {
            handleError('Please enter a valid URL');
            return;
        }

        // Validate URL format
        try {
            new URL(urlInput);
        } catch {
            handleError('Invalid URL format');
            return;
        }

        setIsLoading(true);
        try {
            // Try to load the image to validate it
            const response = await fetch(urlInput, { mode: 'cors' });
            if (!response.ok) {
                throw new Error('Failed to fetch image');
            }
            const blob = await response.blob();
            if (!blob.type.startsWith('image/')) {
                throw new Error('URL does not point to an image');
            }
            
            // Convert to base64 for consistency
            const file = new File([blob], 'image.jpg', { type: blob.type });
            await processFile(file);
            setShowUrlInput(false);
            setUrlInput('');
        } catch {
            // If CORS fails, just use the URL directly (for external images)
            onChange(urlInput);
            setShowUrlInput(false);
            setUrlInput('');
            setError(null);
        } finally {
            setIsLoading(false);
        }
    }, [urlInput, onChange, processFile, handleError]);

    const handleRemove = useCallback(() => {
        onChange('');
        setError(null);
    }, [onChange]);

    const handleCameraCapture = useCallback(() => {
        cameraInputRef.current?.click();
    }, []);

    const handleBrowse = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    return (
        <div className={`relative ${className}`}>
            {/* Hidden file inputs */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled}
            />
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled}
            />

            {/* Main upload area */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    ${sizeClasses[size]}
                    relative rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden
                    ${isDragging ? 'border-cyber-primary bg-cyber-primary/10 scale-105' : 'border-white/20 hover:border-white/40'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    ${error ? 'border-red-500/50' : ''}
                `}
            >
                {/* Image preview or placeholder */}
                {value ? (
                    <div className="relative w-full h-full group">
                        <img
                            src={value}
                            alt="Product"
                            className="w-full h-full object-cover"
                            onError={() => handleError('Failed to load image')}
                        />
                        {/* Overlay with actions */}
                        {!disabled && (
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleBrowse}
                                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                                    title="Change image"
                                >
                                    <RefreshCw size={16} className="text-white" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRemove}
                                    className="p-2 bg-red-500/50 hover:bg-red-500/70 rounded-lg transition-colors"
                                    title="Remove image"
                                >
                                    <X size={16} className="text-white" />
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div 
                        className="w-full h-full flex flex-col items-center justify-center p-2 text-center"
                        onClick={!disabled ? handleBrowse : undefined}
                    >
                        {isLoading ? (
                            <Loader2 size={24} className="text-cyber-primary animate-spin" />
                        ) : (
                            <>
                                <ImageIcon size={24} className="text-gray-500 mb-1" />
                                <p className="text-[10px] text-gray-400 leading-tight">{placeholder}</p>
                            </>
                        )}
                    </div>
                )}

                {/* Loading overlay */}
                {isLoading && value && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 size={24} className="text-cyber-primary animate-spin" />
                    </div>
                )}
            </div>

            {/* Action buttons */}
            {!value && !disabled && (
                <div className="flex items-center gap-1 mt-2">
                    <button
                        type="button"
                        onClick={handleBrowse}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] text-gray-300 transition-colors"
                        title="Upload from device"
                    >
                        <Upload size={12} /> Browse
                    </button>
                    <button
                        type="button"
                        onClick={handleCameraCapture}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] text-gray-300 transition-colors"
                        title="Take photo"
                    >
                        <Camera size={12} /> Camera
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowUrlInput(true)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] text-gray-300 transition-colors"
                        title="Enter URL"
                    >
                        <Link size={12} /> URL
                    </button>
                </div>
            )}

            {/* URL input modal */}
            {showUrlInput && (
                <div className="absolute top-0 left-0 right-0 z-10 bg-cyber-gray border border-white/10 rounded-xl p-3 shadow-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <Link size={14} className="text-gray-400" />
                        <span className="text-xs text-white font-medium">Image URL</span>
                        <button
                            type="button"
                            onClick={() => { setShowUrlInput(false); setUrlInput(''); }}
                            className="ml-auto p-1 hover:bg-white/10 rounded"
                        >
                            <X size={14} className="text-gray-400" />
                        </button>
                    </div>
                    <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-xs mb-2"
                        onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                        autoFocus
                    />
                    <button
                        type="button"
                        onClick={handleUrlSubmit}
                        disabled={isLoading || !urlInput.trim()}
                        className="w-full py-1.5 bg-cyber-primary/20 hover:bg-cyber-primary/30 text-cyber-primary rounded-lg text-xs font-bold disabled:opacity-50 transition-colors"
                    >
                        {isLoading ? 'Loading...' : 'Add Image'}
                    </button>
                </div>
            )}

            {/* Error message */}
            {error && (
                <p className="text-[10px] text-red-400 mt-1 text-center">{error}</p>
            )}
        </div>
    );
}

