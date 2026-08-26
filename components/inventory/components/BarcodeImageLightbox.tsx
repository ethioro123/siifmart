import React from 'react';
import { X } from 'lucide-react';

interface BarcodeImageLightboxProps {
    image: { url: string; title: string; subtitle?: string } | null;
    onClose: () => void;
}

export const BarcodeImageLightbox: React.FC<BarcodeImageLightboxProps> = ({
    image,
    onClose
}) => {
    if (!image) return null;

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="relative max-w-4xl w-full max-h-[92vh] flex flex-col items-center justify-center bg-stone-900/90 rounded-3xl overflow-hidden border border-white/10 p-3 shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="absolute top-4 right-4 z-10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2.5 rounded-full bg-black/70 text-white hover:bg-white hover:text-black transition-all cursor-pointer shadow-lg"
                        aria-label="Close Fullscreen View"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <div className="w-full flex items-center justify-center overflow-hidden rounded-2xl max-h-[75vh] bg-black/50 p-2">
                    <img 
                        src={image.url} 
                        alt={image.title} 
                        className="max-w-full max-h-[72vh] object-contain rounded-xl shadow-2xl"
                    />
                </div>

                <div className="w-full p-4 text-center bg-black/80 backdrop-blur-sm border-t border-white/10 rounded-b-2xl mt-2">
                    <h3 className="text-base font-black text-white uppercase tracking-wider">{image.title}</h3>
                    {image.subtitle && (
                        <p className="text-xs font-mono text-[#A9CBA2] mt-1">{image.subtitle}</p>
                    )}
                </div>
            </div>
        </div>
    );
};
export default BarcodeImageLightbox;
