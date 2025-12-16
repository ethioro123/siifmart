
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Area } from 'react-easy-crop/types';
import Modal from './Modal';
import { Check, X } from 'lucide-react';

interface ImageCropperProps {
    imageSrc: string;
    onCropComplete: (croppedImage: string) => void;
    onCancel: () => void;
    open: boolean;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCropComplete, onCancel, open }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropChange = (location: { x: number; y: number }) => {
        setCrop(location);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropAreaChange = useCallback((_: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createCroppedImage = async () => {
        if (!croppedAreaPixels) return;

        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (croppedImage) {
                onCropComplete(croppedImage);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Modal
            isOpen={open}
            onClose={onCancel}
            title="Crop Profile Photo"
            size="lg"
            footer={
                <div className="flex justify-between items-center w-full">
                    <div className="text-sm text-gray-400">
                        Drag to move, scroll to zoom
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                        >
                            <X size={18} />
                            Cancel
                        </button>
                        <button
                            onClick={createCroppedImage}
                            className="px-4 py-2 rounded-xl bg-cyber-primary text-cyber-dark font-bold hover:bg-cyber-primary/90 transition-all flex items-center gap-2"
                        >
                            <Check size={18} />
                            Set Photo
                        </button>
                    </div>
                </div>
            }
        >
            <div className="relative w-full h-80 bg-black rounded-xl overflow-hidden">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={onCropChange}
                    onCropComplete={onCropAreaChange}
                    onZoomChange={onZoomChange}
                />
            </div>
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
