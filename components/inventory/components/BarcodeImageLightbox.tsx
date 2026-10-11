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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="relative max-w-4xl w-full max-h-[92vh] flex flex-col items-center justify-center bg-[var(--theme-bg-card)] rounded-2xl overflow-hidden border border-[var(--theme-border)] p-3 shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="absolute top-4 right-4 z-10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-[var(--theme-bg-card)]/90 backdrop-blur-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)] transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center"
                        aria-label="Close Fullscreen View"
                    >
                        <X size={16} />
                    </button>
                </div>
                
                <div className="w-full flex items-center justify-center overflow-hidden rounded-xl max-h-[75vh] bg-black/40 p-2">
                    <img 
                        src={image.url} 
                        alt={image.title} 
                        className="max-w-full max-h-[72vh] object-contain rounded-lg shadow-xl"
                    />
                </div>

                <div className="w-full px-5 py-3.5 text-center bg-[var(--theme-bg-card)] border-t border-[var(--theme-border)] mt-2">
                    <h3 className="text-sm font-semibold text-[var(--theme-text-primary)] tracking-tight">{image.title}</h3>
                    {image.subtitle && (
                        <p className="text-[12px] font-mono tabular-nums text-[var(--theme-accent)] font-medium mt-1">{image.subtitle}</p>
                    )}
                </div>
            </div>
        </div>
    );
};
export default BarcodeImageLightbox;
