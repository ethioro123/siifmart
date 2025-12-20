
import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Area } from 'react-easy-crop';
import Modal from './Modal';
import { Check, X, AlertTriangle, RefreshCw } from 'lucide-react';

interface ImageCropperProps {
    imageSrc: string;
    onCropComplete: (croppedImage: string) => void;
    onCancel: () => void;
    open: boolean;
    loading?: boolean;
    onError?: (error: string) => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCropComplete, onCancel, open, loading = false, onError }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [imageLoadError, setImageLoadError] = useState<string | null>(null);
    const [imageLoading, setImageLoading] = useState(true);

    // Reset states when image changes
    useEffect(() => {
        if (imageSrc && open) {
            setImageLoadError(null);
            setImageLoading(true);
            setCrop({ x: 0, y: 0 });
            setZoom(1);

            // Pre-verify the image can load
            const img = new Image();
            const timeout = setTimeout(() => {
                setImageLoadError('Image is taking too long to load. It may be corrupted or too large.');
                setImageLoading(false);
            }, 15000);

            img.onload = () => {
                clearTimeout(timeout);
                setImageLoading(false);
                console.log('✅ Image pre-verified:', img.width, 'x', img.height);
            };

            img.onerror = () => {
                clearTimeout(timeout);
                setImageLoadError('Unable to load this image. It may be in an unsupported format or corrupted. Try a different photo.');
                setImageLoading(false);
                onError?.('Image failed to load');
            };

            img.src = imageSrc;
        }
    }, [imageSrc, open, onError]);

    const onCropChange = (location: { x: number; y: number }) => {
        setCrop(location);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropAreaChange = useCallback((_: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleMediaLoaded = () => {
        setImageLoading(false);
        setImageLoadError(null);
    };

    const createCroppedImage = async () => {
        console.log('✂️ createCroppedImage called');
        if (!croppedAreaPixels || loading || imageLoadError) return;

        try {
            console.log('✂️ Calling getCroppedImg with:', imageSrc.substring(0, 50) + '...', croppedAreaPixels);
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (croppedImage) {
                console.log('✂️ Crop success, returned length:', croppedImage.length);
                onCropComplete(croppedImage);
            } else {
                setImageLoadError('Failed to create cropped image. Please try again.');
                console.error('✂️ getCroppedImg returned null');
            }
        } catch (e) {
            console.error('✂️ Error creating cropped image:', e);
            setImageLoadError('Error processing image. The format may not be supported.');
        }
    };

    return (
        <Modal
            isOpen={open}
            onClose={loading ? () => { } : onCancel}
            title="Crop Profile Photo"
            size="lg"
            zIndex="z-[10000]"
            footer={
                <div className="flex justify-between items-center w-full">
                    <div className="text-sm text-gray-400">
                        {imageLoadError ? (
                            <span className="text-red-400">⚠️ Error occurred</span>
                        ) : imageLoading ? (
                            <span className="text-yellow-400">Loading image...</span>
                        ) : (
                            'Drag to move, scroll to zoom'
                        )}
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={onCancel}
                            disabled={loading}
                            className={`px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <X size={18} />
                            Cancel
                        </button>
                        <button
                            onClick={createCroppedImage}
                            disabled={loading || !!imageLoadError || imageLoading}
                            className={`px-4 py-2 rounded-xl bg-cyber-primary text-cyber-dark font-bold hover:bg-cyber-primary/90 transition-all flex items-center gap-2 ${(loading || imageLoadError || imageLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyber-dark" />
                            ) : (
                                <Check size={18} />
                            )}
                            {loading ? 'Saving...' : 'Set Photo'}
                        </button>
                    </div>
                </div>
            }
        >
            <div className="relative w-full h-80 bg-black rounded-xl overflow-hidden">
                {imageLoadError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
                        <p className="text-red-400 font-medium mb-2">Image Load Failed</p>
                        <p className="text-gray-400 text-sm max-w-xs">{imageLoadError}</p>
                        <button
                            onClick={onCancel}
                            className="mt-4 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 flex items-center gap-2"
                        >
                            <RefreshCw size={16} />
                            Try Different Image
                        </button>
                    </div>
                ) : imageLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyber-primary mb-4" />
                        <p className="text-gray-400 text-sm">Loading image...</p>
                    </div>
                ) : (
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={onCropChange}
                        onCropComplete={onCropAreaChange}
                        onZoomChange={onZoomChange}
                        onMediaLoaded={handleMediaLoaded}
                    />
                )}
            </div>
            {!imageLoadError && !imageLoading && (
                <div className="mt-4 flex flex-col gap-2">
                    <div className="flex justify-between text-xs text-gray-400 uppercase font-bold tracking-wider">
                        <span>Zoom</span>
                        <span>{Math.round(zoom * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyber-primary"
                    />
                </div>
            )}
        </Modal>
    );
};

export default ImageCropper;

// --- UTILS ---

const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        // Enable cross-origin resource sharing
        image.setAttribute('crossOrigin', 'anonymous');
        image.onload = () => resolve(image);
        image.onerror = (error) => reject(error);
        image.src = url;
    });

// Returns the new image URL (base64)
async function getCroppedImg(
    imageSrc: string,
    pixelCrop: Area,
): Promise<string | null> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return null;
    }

    // set canvas size to match the bounding box
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // draw image on canvas
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return canvas.toDataURL('image/jpeg');
}
