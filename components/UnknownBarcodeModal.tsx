
import React, { useState, useRef } from 'react';
import Modal from './Modal';
import { Camera, Search, Link as LinkIcon, AlertTriangle, Loader2, Image as ImageIcon, Trash2, ChevronRight, X } from 'lucide-react';
import { Product } from '../types';
import { supabase } from '../lib/supabase';
import { productsService, barcodeApprovalsService } from '../services/supabase.service';
import { useStore } from '../contexts/CentralStore';

interface UnknownBarcodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    barcode: string;
    onMapProduct: (product: Product) => void;
    products: Product[];
}

export default function UnknownBarcodeModal({
    isOpen,
    onClose,
    barcode,
    onMapProduct,
    products
}: UnknownBarcodeModalProps) {
    const [step, setStep] = useState<'evidence' | 'search'>('evidence');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const { user } = useStore();

    const [isCompressing, setIsCompressing] = useState(false);
    const [captureMode, setCaptureMode] = useState<'idle' | 'camera' | 'library'>('idle');
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [startTime] = useState(Date.now());

    // Smart image compression - targets 2MB with good quality
    const compressImage = async (file: File | Blob, fileName?: string): Promise<File> => {
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

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
    };

    const startCamera = async () => {
        try {
            stopCamera();
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // back camera
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            setCameraStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error('Camera access failed:', err);
            alert('Could not access camera. Please check permissions.');
            setCaptureMode('idle');
        }
    };

    const handleTakePhotoSnapshot = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        // Set dimensions to match video stream
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Capture frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
            if (blob) {
                try {
                    setIsCompressing(true);
                    const file = await compressImage(blob, `capture_${Date.now()}.jpg`);
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                    stopCamera();
                    setCaptureMode('idle');
                } catch (err) {
                    console.error('Snapshot processing failed:', err);
                } finally {
                    setIsCompressing(false);
                }
            }
        }, 'image/jpeg', 0.95);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const originalFile = e.target.files[0];

            try {
                setIsCompressing(true);
                let processedFile = originalFile;

                // Try to compress/resize
                try {
                    processedFile = await compressImage(originalFile);
                } catch (compressionError) {
                    console.warn('Image compression failed (likely unsupported format), using original file.', compressionError);
                    // Fallback to original file
                    processedFile = originalFile;
                }

                if (processedFile.size > 2.5 * 1024 * 1024) {
                    alert(`Image is still too large (${(processedFile.size / (1024 * 1024)).toFixed(1)}MB). Please try a smaller image.`);
                    return;
                }

                setImageFile(processedFile);
                setImagePreview(URL.createObjectURL(processedFile));
                setCaptureMode('idle');
            } catch (err) {
                console.error('Image processing failed:', err);
                alert('Failed to process image.');
            } finally {
                setIsCompressing(false);
            }
        }
    };

    const filteredProducts = products.filter(p =>
        searchTerm.length >= 2 && (
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase())
        )
    ).slice(0, 5);

    const handleMap = async () => {
        if (!selectedProduct) return;
        setIsUploading(true);

        try {
            // 1. Upload Evidence (Real Implementation)
            let evidenceUrl = null;
            if (imageFile) {
                try {
                    evidenceUrl = await barcodeApprovalsService.uploadEvidence(imageFile);
                } catch (uploadErr) {
                    console.error('Failed to upload evidence:', uploadErr);
                    // Decide: Fail hard limit or soft warn? Soft warn for now to keep selling.
                }
            }

            // 2. Create Audit Record (Shadow Mode)
            if (user && user.id) {
                try {
                    const resolutionTimeSeconds = Math.round((Date.now() - startTime) / 1000);
                    await barcodeApprovalsService.create({
                        product_id: selectedProduct.id,
                        barcode: barcode,
                        image_url: evidenceUrl || undefined,
                        site_id: selectedProduct.siteId,
                        created_by: user.id,
                        resolution_time: resolutionTimeSeconds
                    });
                } catch (auditErr) {
                    console.error('Failed to create audit record:', auditErr);
                }
            }

            // 3. Map Barcode (Local Update - Instant)
            const currentBarcodes = selectedProduct.barcodes || [];
            if (!currentBarcodes.includes(barcode)) {
                await productsService.update(selectedProduct.id, {
                    barcodes: [...currentBarcodes, barcode]
                });
            }

            onMapProduct({
                ...selectedProduct,
                barcodes: [...currentBarcodes, barcode]
            });

            onClose();
        } catch (error: any) {
            console.error('Mapping failed:', error);
            alert(`Failed to map barcode: ${error.message || 'Unknown error'}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            // If no product is selected, auto-select the first one in the filtered list
            if (!selectedProduct && filteredProducts.length > 0) {
                setSelectedProduct(filteredProducts[0]);
                return;
            }

            // If a product is already selected, submit the mapping
            if (selectedProduct) {
                handleMap();
            }
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Unknown Barcode Detected" size="md">
            <div className="space-y-6">
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                        <AlertTriangle className="text-yellow-500 flex-shrink-0" size={24} />
                        <h3 className="font-bold text-white">Barcode Not Found</h3>
                    </div>
                    <div className="bg-black/30 border border-yellow-500/30 rounded-lg p-3 text-center">
                        <p className="text-xs text-yellow-400 mb-1">Scanned Barcode</p>
                        <p className="text-2xl text-yellow-300 font-mono font-bold tracking-wider">{barcode || 'N/A'}</p>
                    </div>
                </div>

                {step === 'evidence' ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="space-y-2">
                            <h4 className="text-sm font-black text-white uppercase tracking-widest">Capture Evidence</h4>
                            <p className="text-gray-400 text-xs leading-relaxed">
                                Please provide a clear photo of the product tag or physical item.
                                This helps managers verify the mapping.
                            </p>
                        </div>

                        {!imagePreview && captureMode === 'idle' && (
                            <div className="grid grid-cols-2 gap-4">
                                {/* Take Photo Option */}
                                <button
                                    onClick={() => {
                                        setCaptureMode('camera');
                                        startCamera();
                                    }}
                                    className="group relative flex flex-col items-center justify-center gap-4 p-8 rounded-3xl bg-blue-500/5 border border-blue-500/10 hover:border-blue-500/40 hover:bg-blue-500/10 transition-all duration-300"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <Camera size={32} className="text-blue-400" />
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-sm font-black text-white uppercase tracking-wider mb-1">Take Photo</span>
                                        <span className="block text-[10px] text-blue-400 font-bold uppercase opacity-60">Use Camera</span>
                                    </div>
                                </button>

                                {/* Select from Library Option */}
                                <button
                                    onClick={() => {
                                        setCaptureMode('library');
                                        if (fileInputRef.current) {
                                            fileInputRef.current.removeAttribute('capture');
                                            fileInputRef.current.click();
                                        }
                                    }}
                                    className="group relative flex flex-col items-center justify-center gap-4 p-8 rounded-3xl bg-cyan-500/5 border border-cyan-500/10 hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-all duration-300"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <ImageIcon size={32} className="text-cyan-400" />
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-sm font-black text-white uppercase tracking-wider mb-1">Library</span>
                                        <span className="block text-[10px] text-cyan-400 font-bold uppercase opacity-60">Existing Media</span>
                                    </div>
                                </button>
                            </div>
                        )}

                        {captureMode === 'camera' && (
                            <div className="relative rounded-3xl overflow-hidden bg-black border border-white/10 aspect-video flex items-center justify-center shadow-2xl">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                />
                                <canvas ref={canvasRef} className="hidden" />

                                {/* Camera Controls Layer */}
                                <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
                                    <div className="flex justify-between items-start">
                                        <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-cyber-primary/30 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-cyber-primary animate-pulse" />
                                            <span className="text-[10px] font-black text-cyber-primary uppercase tracking-widest">Live Stream</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                stopCamera();
                                                setCaptureMode('idle');
                                            }}
                                            aria-label="Close Camera"
                                            title="Close Camera"
                                            className="p-2 rounded-full bg-black/60 text-white hover:bg-red-500 transition-colors pointer-events-auto"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="flex justify-center pb-2">
                                        <button
                                            onClick={handleTakePhotoSnapshot}
                                            aria-label="Capture Photo"
                                            title="Capture Photo"
                                            className="group w-16 h-16 rounded-full border-4 border-white flex items-center justify-center p-1 pointer-events-auto hover:scale-110 transition-transform active:scale-95"
                                        >
                                            <div className="w-full h-full rounded-full bg-white group-hover:bg-cyber-primary transition-colors" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {imagePreview && (
                            <div className="relative rounded-3xl overflow-hidden bg-black/40 border border-white/10 aspect-video flex items-center justify-center group">
                                {isCompressing ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-blue-400 font-black text-[10px] uppercase tracking-[0.2em] animate-pulse">OPTIMIZING ASSET...</span>
                                    </div>
                                ) : (
                                    <>
                                        <img src={imagePreview} alt="Evidence" className="w-full h-full object-contain" />
                                        {/* Overlay controls */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                            <button
                                                onClick={() => {
                                                    setImagePreview(null);
                                                    setImageFile(null);
                                                    setCaptureMode('idle');
                                                }}
                                                aria-label="Remove captured image"
                                                className="p-4 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-white transition-all scale-90 group-hover:scale-100 duration-300"
                                            >
                                                <Trash2 size={24} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            aria-label="Upload source file"
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                {imageFile ? 'Ready to proceed' : 'Selection Required'}
                            </span>
                            <button
                                onClick={() => setStep('search')}
                                disabled={!imageFile || isCompressing || captureMode === 'camera'}
                                className="group px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-2xl disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-3 text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20"
                            >
                                Continue To Mapping
                                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-gray-300 text-sm">Search for the existing product ID/SKU to map this barcode to.</p>

                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-gray-500" size={18} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search product name or SKU..."
                                aria-label="Search products"
                                className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-cyber-primary focus:outline-none"
                                value={searchTerm || ''}
                                onChange={e => setSearchTerm(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {filteredProducts.map(product => {
                                const isLocalStock = product.siteId === user?.siteId || product.site_id === user?.siteId;
                                return (
                                    <button
                                        key={product.id}
                                        onClick={() => setSelectedProduct(product)}
                                        className={`w-full text-left p-3 rounded-xl border transition-all ${selectedProduct?.id === product.id
                                            ? 'bg-cyber-primary/20 border-cyber-primary'
                                            : 'bg-white/5 border-transparent hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="font-bold text-white">{product.name}</div>
                                        <div className="text-xs text-gray-400 flex justify-between items-center">
                                            <span className="font-mono">{product.sku}</span>
                                            <div className="flex items-center gap-2">
                                                {isLocalStock ? (
                                                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] font-bold">Store: {product.stock}</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] font-bold">Global: {product.stock}</span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                            {searchTerm && filteredProducts.length === 0 && (
                                <div className="text-center text-gray-500 py-4">No products found</div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                            {selectedProduct && (
                                <div className="mr-auto text-sm text-cyber-primary self-center">
                                    Linking to: <b>{selectedProduct.name}</b>
                                </div>
                            )}
                            <button
                                onClick={() => setStep('evidence')}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => {
                                    handleMap();
                                }}
                                disabled={!selectedProduct || isUploading}
                                className="px-6 py-2 bg-cyber-primary text-black font-bold rounded-lg disabled:opacity-50 flex items-center gap-2"
                            >
                                {isUploading ? <Loader2 className="animate-spin" size={18} /> : <LinkIcon size={18} />}
                                Map Barcode
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
