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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="relative max-w-4xl w-full max-h-[92vh] flex flex-col items-center justify-center bg-[var(--theme-bg-panel)] rounded-3xl overflow-hidden border border-[var(--theme-border)] p-3 shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="absolute top-4 right-4 z-10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2.5 rounded-full bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-primary)] hover:text-[var(--theme-primary-text)] border border-[var(--theme-border)] transition-all cursor-pointer shadow-lg active:scale-95"
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

                <div className="w-full p-4 text-center bg-[var(--theme-bg-card)] border-t border-[var(--theme-border)] rounded-b-2xl mt-2">
                    <h3 className="text-base font-bold text-[var(--theme-text-primary)] uppercase tracking-wider">{image.title}</h3>
                    {image.subtitle && (
                        <p className="text-xs font-mono text-[var(--theme-accent)] font-medium mt-1">{image.subtitle}</p>
                    )}
                </div>
            </div>
        </div>
    );
};
export default BarcodeImageLightbox;
