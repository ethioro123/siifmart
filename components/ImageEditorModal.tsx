import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Sliders, RefreshCw, ZoomIn, Sun, Contrast, Check } from 'lucide-react';
import { getCroppedImg } from '../utils/imageCropHelper';

interface ImageEditorModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onSave: (croppedImage: string) => void;
}

export default function ImageEditorModal({
  isOpen,
  imageSrc,
  onClose,
  onSave
}: ImageEditorModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'crop' | 'adjust'>('crop');

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    try {
      setIsSaving(true);
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        brightness,
        contrast
      );
      onSave(croppedImage);
      onClose();
    } catch (e) {
      console.error('[ImageEditorModal] Error cropping image:', e);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[color-mix(in_srgb,var(--theme-overlay)_60%,transparent)] bg-[color-mix(in_srgb,var(--theme-overlay)_60%,transparent)] backdrop-blur-sm flex items-center justify-center p-4 z-[999] animate-in fade-in duration-200">
      <div className="bg-[var(--theme-bg-app)] dark:bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] border-[var(--theme-status-success-border)] rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] relative shadow-2xl">

        {/* Header */}
        <div className="p-5 border-b border-[var(--theme-border)]/60 border-[color-mix(in_srgb,var(--theme-border)_6%,transparent)] flex justify-between items-center bg-[var(--theme-bg-app)]/30 dark:bg-[var(--theme-bg-card)]/30 backdrop-blur-sm">
          <div>
            <h3 className="text-lg font-black text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] uppercase tracking-tight">Adjust Profile Photo</h3>
            <p className="text-[10px] text-[var(--theme-text-secondary)] text-[var(--theme-text-secondary)] font-bold uppercase tracking-widest mt-1">Resize, rotate, and adjust your photo</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--theme-bg-subtle)] hover:bg-[color-mix(in_srgb,var(--theme-bg-card)_10%,transparent)] rounded-xl text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:text-[var(--theme-text-primary)] transition-colors" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[var(--theme-border)]/60 border-[color-mix(in_srgb,var(--theme-border)_6%,transparent)] bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-overlay)_10%,transparent)]">
          <button
            type="button"
            onClick={() => setActiveTab('crop')}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'crop'
                ? 'border-[var(--theme-border)] text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] dark:border-[var(--theme-border)]'
                : 'border-transparent text-[var(--theme-text-secondary)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:text-[var(--theme-text-muted)]'
            }`}
          >
            <ZoomIn size={14} /> Resize & Crop
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('adjust')}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'adjust'
                ? 'border-[var(--theme-border)] text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] dark:border-[var(--theme-border)]'
                : 'border-transparent text-[var(--theme-text-secondary)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:text-[var(--theme-text-muted)]'
            }`}
          >
            <Sliders size={14} /> Adjustments
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 space-y-5 overflow-y-auto">
          {/* Crop Container */}
          <div className="relative w-full h-72 bg-[var(--theme-bg-app)] rounded-2xl overflow-hidden shadow-inner border border-[var(--theme-border-subtle)] border-[var(--theme-border)]">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
              style={{
                containerStyle: { background: 'var(--theme-bg-app)' },
                mediaStyle: {
                  filter: `brightness(${brightness}%) contrast(${contrast}%)`
                }
              }}
            />
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {activeTab === 'crop' ? (
              <>
                {/* Zoom Control */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)]">
                    <span className="flex items-center gap-1.5"><ZoomIn size={12} /> Zoom</span>
                    <span>{Math.round(zoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={zoom}
                    title="Zoom Level"
                    placeholder="1.0"
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full accent-[var(--theme-accent)] h-1.5 bg-[var(--theme-bg-subtle)] rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Rotation Control */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)]">
                    <span className="flex items-center gap-1.5"><RefreshCw size={12} /> Rotation</span>
                    <span>{rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={1}
                    value={rotation}
                    title="Rotation Degree"
                    placeholder="0"
                    onChange={(e) => setRotation(parseInt(e.target.value))}
                    className="w-full accent-[var(--theme-accent)] h-1.5 bg-[var(--theme-bg-subtle)] rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Brightness Control */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)]">
                    <span className="flex items-center gap-1.5"><Sun size={12} /> Brightness</span>
                    <span>{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={150}
                    step={1}
                    value={brightness}
                    title="Brightness Percentage"
                    placeholder="100"
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="w-full accent-[var(--theme-accent)] h-1.5 bg-[var(--theme-bg-subtle)] rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Contrast Control */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)]">
                    <span className="flex items-center gap-1.5"><Contrast size={12} /> Contrast</span>
                    <span>{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={150}
                    step={1}
                    value={contrast}
                    title="Contrast Percentage"
                    placeholder="100"
                    onChange={(e) => setContrast(parseInt(e.target.value))}
                    className="w-full accent-[var(--theme-accent)] h-1.5 bg-[var(--theme-bg-subtle)] rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[var(--theme-border)]/60 border-[color-mix(in_srgb,var(--theme-border)_6%,transparent)] flex items-center justify-end gap-3 bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-overlay)_10%,transparent)]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2.5 text-xs font-black uppercase tracking-widest border border-[var(--theme-border-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-bg-subtle)] hover:bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] rounded-xl transition-all disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-[var(--theme-primary)] hover:bg-[var(--theme-primary)] dark:bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] dark:text-[var(--theme-text-primary)] text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check size={14} /> Save & Apply
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
