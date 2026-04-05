import React, { useState, useRef, useCallback, useEffect } from 'react';
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

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif'];
const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.gif'];

const isValidImageFile = (file: File): boolean => {
    if (file.type && ACCEPTED_MIME_TYPES.includes(file.type.toLowerCase())) return true;
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return ACCEPTED_EXTENSIONS.includes(extension);
};

export default function ImageUpload({ value, onChange, onError, placeholder = 'Upload image', size = 'md', className = '', disabled = false }: ImageUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { cameraInputRef.current?.setAttribute('capture', 'environment'); }, []);

    const sizeClasses = { sm: 'w-24 h-24', md: 'w-32 h-32', lg: 'w-40 h-40' };
    const handleError = useCallback((message: string) => { setError(message); onError?.(message); setTimeout(() => setError(null), 3000); }, [onError]);

    const compressImage = useCallback(async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject('No context');
                    const MAX = 800; let { width, height } = img;
                    if (width > height) { if (width > MAX) { height = (height * MAX) / width; width = MAX; } }
                    else { if (height > MAX) { width = (width * MAX) / height; height = MAX; } }
                    canvas.width = width; canvas.height = height; ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        });
    }, []);

    const processFile = useCallback(async (file: File) => {
        if (!isValidImageFile(file)) return handleError('Invalid type (JPG, PNG, HEIC only)');
        if (file.size > MAX_FILE_SIZE) return handleError('File too large (Max 10MB)');
        setIsLoading(true); try { onChange(await compressImage(file)); setError(null); } catch { handleError('Process failed'); } finally { setIsLoading(false); }
    }, [compressImage, onChange, handleError]);

    const handleUrlSubmit = useCallback(async () => {
        if (!urlInput.trim()) return handleError('Invalid URL');
        setIsLoading(true); try { onChange(urlInput); setShowUrlInput(false); setUrlInput(''); setError(null); } catch { handleError('Fetch failed'); } finally { setIsLoading(false); }
    }, [urlInput, onChange, handleError]);

    return (
        <div className={`relative ${className}`}>
            <input ref={fileInputRef} aria-label="File Upload" title="File Upload" type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} className="hidden" disabled={disabled} />
            <input ref={cameraInputRef} aria-label="Camera Capture" title="Camera Capture" type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} className="hidden" disabled={disabled} />

            <div onClick={!disabled && !value ? () => fileInputRef.current?.click() : undefined} onDragOver={(e) => { e.preventDefault(); !disabled && setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (!disabled && e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]); }}
                className={`${sizeClasses[size]} relative rounded-2xl border-2 border-dashed transition-all overflow-hidden ${isDragging ? 'border-cyber-primary bg-cyber-primary/10 scale-105' : 'border-gray-200 dark:border-white/20 hover:border-cyber-primary/40'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${error ? 'border-red-500' : ''} bg-gray-50 dark:bg-black/20 shadow-inner`}>
                {value ? (
                    <div className="relative w-full h-full group">
                        <img src={value} alt="Product" className="w-full h-full object-cover" />
                        {!disabled && (
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl" title="Change Image" aria-label="Change Image"><RefreshCw size={18} className="text-white" /></button>
                                <button type="button" onClick={() => onChange('')} className="p-2.5 bg-red-500/50 hover:bg-red-500/70 rounded-xl" title="Remove Image" aria-label="Remove Image"><X size={18} className="text-white" /></button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                        {isLoading ? <Loader2 size={24} className="text-cyber-primary animate-spin" /> : <><ImageIcon size={28} className="text-gray-400 dark:text-gray-600 mb-2" /><p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">{placeholder}</p></>}
                    </div>
                )}
            </div>

            {!value && !disabled && (
                <div className="flex items-center gap-2 mt-4">
                    {[
                        { icon: Upload, label: 'Browse', onClick: () => fileInputRef.current?.click() },
                        { icon: Camera, label: 'Camera', onClick: () => cameraInputRef.current?.click() },
                        { icon: Link, label: 'URL', onClick: () => setShowUrlInput(true) }
                    ].map(btn => (
                        <button key={btn.label} type="button" onClick={btn.onClick} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest transition-all">
                            <btn.icon size={12} /> {btn.label}
                        </button>
                    ))}
                </div>
            )}

            {showUrlInput && (
                <div className="absolute top-0 left-0 right-0 z-20 bg-white dark:bg-cyber-dark border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-4"><span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white">Image Source URL</span><button type="button" onClick={() => setShowUrlInput(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white" title="Close" aria-label="Close"><X size={16} /></button></div>
                    <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://..." className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-xs mb-4 focus:border-cyber-primary/50 outline-none" autoFocus />
                    <button type="button" onClick={handleUrlSubmit} className="w-full py-3 bg-cyber-primary/20 hover:bg-cyber-primary text-cyber-primary hover:text-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">Link Media Asset</button>
                </div>
            )}
            {error && <p className="text-[10px] text-red-500 mt-2 text-center font-black uppercase tracking-widest">{error}</p>}
        </div>
    );
}
