import React, { useState } from 'react';
import Modal from '../../Modal';
import ImageUpload from '../../ImageUpload';
import { Camera, Image as ImageIcon, X } from 'lucide-react';

interface ImageUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentImage?: string | null;
    onSaveImage: (imageUrl: string) => void;
}

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
    isOpen,
    onClose,
    currentImage,
    onSaveImage
}) => {
    const [selectedImage, setSelectedImage] = useState<string>(currentImage || '');

    React.useEffect(() => {
        setSelectedImage(currentImage || '');
    }, [currentImage, isOpen]);

    const handleApply = () => {
        onSaveImage(selectedImage);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Update Product Image"
            size="md"
        >
            <div className="p-4 space-y-6 text-[var(--theme-text-primary)]">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-panel)] flex items-center justify-center shrink-0 border border-[var(--theme-border)]">
                        <Camera size={20} className="text-[var(--theme-accent)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-primary)]">High-Fidelity Photo</p>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium">Upload, capture via camera, or enter asset URL</p>
                    </div>
                </div>

                <div className="flex justify-center p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-xs">
                    <ImageUpload
                        value={selectedImage}
                        onChange={(val) => setSelectedImage(val)}
                        placeholder="Drag & drop or upload photo"
                        size="lg"
                    />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--theme-border)]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] transition-all cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleApply}
                        className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-[var(--theme-accent)] text-[var(--theme-text-primary)] hover:opacity-95 active:scale-[0.98] shadow-xs transition-all cursor-pointer"
                    >
                        Apply Photo
                    </button>
                </div>
            </div>
        </Modal>
    );
};
