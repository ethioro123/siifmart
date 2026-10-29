import React, { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Modal from './Modal';
import { Camera, AlertTriangle, Trash2, ChevronRight, X, ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { productsService, barcodeApprovalsService } from '../services/supabase.service';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { logger } from '../utils/logger';
import { compressImage } from '../utils/imageCompression';
import { validateBarcodeFormat } from '../utils/barcodeValidation';
import { UnknownBarcodeSearchStep } from './unknown-barcode/UnknownBarcodeSearchStep';
import { UnknownBarcodeManagerPinStep } from './unknown-barcode/UnknownBarcodeManagerPinStep';

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
    const queryClient = useQueryClient();
    const [step, setStep] = useState<'evidence' | 'search' | 'manager-pin'>('evidence');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const { user, showToast } = useStore();
    const { settings, updateProduct, addNotification, sites, activeSite, employees } = useData();
    const { t } = useLanguage();

    const [isCompressing, setIsCompressing] = useState(false);
    const [captureMode, setCaptureMode] = useState<'idle' | 'camera'>('idle');
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [startTime] = useState(Date.now());

    // Validate barcode format
    const barcodeValidation = React.useMemo(() => validateBarcodeFormat(barcode), [barcode]);

    // Check if user is manager/admin
    const isManagerOrAdmin = ['group_ceo', 'country_managing_director', 'store_manager', 'warehouse_manager', 'country_operations_director', 'regional_operations_manager'].includes(user?.role?.toLowerCase() || '');

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
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            setCameraStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            logger.error('UnknownBarcodeModal', 'Camera access failed:', err);
            alert('Could not access live camera. Please check browser permissions.');
            setCaptureMode('idle');
        }
    };

    // Auto-open live camera on mount when opened
    useEffect(() => {
        if (isOpen && step === 'evidence' && !imagePreview) {
            setCaptureMode('camera');
            startCamera();
        }
        return () => {
            stopCamera();
        };
    }, [isOpen]);

    const handleTakePhotoSnapshot = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        // Set dimensions to match video stream
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;

        // Capture frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Security Watermark Overlay uses the active system theme tokens.
        const themeTokens = getComputedStyle(document.documentElement);
        const themeColor = (name: string) => themeTokens.getPropertyValue(name).trim();
        const bannerHeight = Math.max(54, Math.floor(canvas.height * 0.13));
        ctx.fillStyle = themeColor('--theme-overlay-strong');
        ctx.fillRect(0, canvas.height - bannerHeight, canvas.width, bannerHeight);

        // Accent audit line
        ctx.fillStyle = themeColor('--theme-accent');
        ctx.fillRect(0, canvas.height - bannerHeight, canvas.width, 4);

        const fontSize = Math.max(13, Math.floor(bannerHeight * 0.28));
        ctx.fillStyle = themeColor('--theme-primary');
        ctx.font = `bold ${fontSize}px monospace`;

        const timestampStr = new Date().toLocaleString([], { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });

        // Resolve human-readable staff and location names (eliminate raw UUIDs)
        const staffName = user?.name || (employees || []).find((e: any) => e.id === user?.id)?.name || 'Authorized Staff';
        const currentSite = (sites || []).find((s: any) => s.id === user?.siteId || s.id === activeSite?.id) || activeSite;
        const siteName = currentSite?.name || 'Active Location';

        ctx.fillText(`🔒 SIIFMART AUDIT PROOF • BARCODE: ${barcode} • ${barcodeValidation.format}`, 16, canvas.height - bannerHeight + fontSize + 6);

        ctx.fillStyle = themeColor('--theme-text-secondary');
        ctx.font = `${Math.max(11, Math.floor(fontSize * 0.82))}px monospace`;
        ctx.fillText(`OPERATOR: ${staffName} • LOCATION: ${siteName} • TIME: ${timestampStr}`, 16, canvas.height - 12);

        canvas.toBlob(async (blob) => {
            if (blob) {
                try {
                    setIsCompressing(true);
                    const file = await compressImage(blob, `evidence_${barcode}_${Date.now()}.jpg`, {
                        targetSizeKB: 180,
                        maxDimension: 1280,
                        initialQuality: 0.82
                    });
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                    stopCamera();
                    setCaptureMode('idle');
                } catch (err) {
                    logger.error('UnknownBarcodeModal', 'Snapshot processing failed:', err);
                } finally {
                    setIsCompressing(false);
                }
            }
        }, 'image/jpeg', 0.85);
    };

    const filteredProducts = products.filter(p =>
        searchTerm.length >= 2 && (
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase())
        )
    ).slice(0, 8);

    const executeMapping = async () => {
        if (!selectedProduct) return;
        setIsUploading(true);

        try {
            if (!user?.id || !activeSite?.id || !activeSite.country) throw new Error('Missing scope');
            const evidenceUrl = imageFile ? await barcodeApprovalsService.uploadEvidence(imageFile) : undefined;
            await barcodeApprovalsService.create({
                product_id: selectedProduct.id, barcode,
                image_url: evidenceUrl, site_id: activeSite.id,
                country_code: activeSite.country, created_by: user.id
            });
            await queryClient.invalidateQueries({ queryKey: ['barcode_approvals'] });
            addNotification('success', t('pos.barcodeSubmitted'));

            onClose();
        } catch (error: any) {
            logger.error('UnknownBarcodeModal', 'Mapping failed:', error);
            addNotification('alert', t('pos.barcodeSubmitFailed'));
        } finally {
            setIsUploading(false);
        }
    };

    const handleInitiateMap = () => {
        if (!selectedProduct) return;

        const lockThreshold = settings?.highValueBarcodeLockThreshold ?? 3000;
        const isHighValue = (selectedProduct.price || 0) >= lockThreshold ||
            ['electronics', 'jewelry', 'cosmetics'].includes((selectedProduct.category || '').toLowerCase());

        // If high value and not already an admin/manager, require Manager PIN
        if (isHighValue && !isManagerOrAdmin) {
            setStep('manager-pin');
        } else {
            executeMapping();
        }
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!selectedProduct && filteredProducts.length > 0) {
                setSelectedProduct(filteredProducts[0]);
                return;
            }
            if (selectedProduct) {
                handleInitiateMap();
            }
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('pos.unknownBarcodeMapping')} size="md">
            <div className="space-y-6">
                <div className="bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] p-4 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="text-[var(--theme-status-warning)] shrink-0" size={20} />
                            <h3 className="font-bold text-[var(--theme-text-primary)] text-sm">{t('pos.unrecognizedBarcode')}</h3>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-[var(--theme-bg-card)] text-[var(--theme-status-warning-text)] px-2 py-0.5 rounded border border-[var(--theme-status-warning-border)]">
                            {barcodeValidation.format}
                        </span>
                    </div>

                    <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-status-warning-border)] rounded-xl p-3 text-center shadow-2xs">
                        <p className="text-[10px] uppercase tracking-wider text-[var(--theme-status-warning)] mb-0.5 font-bold">{t('pos.scannedBarcode')}</p>
                        <p className="text-2xl text-[var(--theme-text-primary)] font-mono font-bold tracking-wider">{barcode || 'N/A'}</p>
                    </div>

                    {!barcodeValidation.isValid && barcodeValidation.error && (
                        <div className="mt-2 text-[11px] font-bold text-[var(--theme-status-danger-text)] flex items-center gap-1">
                            <ShieldAlert size={14} /> {barcodeValidation.error}
                        </div>
                    )}
                </div>

                {step === 'evidence' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="space-y-1">
                            <h4 className="text-xs font-bold text-[var(--theme-text-primary)] uppercase tracking-wider flex items-center gap-2">
                                <ShieldCheck size={16} className="text-[var(--theme-accent)]" />
                                Live Security Photo Capture (Mandatory)
                            </h4>
                            <p className="text-[var(--theme-text-secondary)] text-xs leading-relaxed">
                                Point the camera at the product label. An immutable audit seal with your user ID and timestamp will be burned into the evidence.
                            </p>
                        </div>

                        {!imagePreview && captureMode === 'idle' && (
                            <div className="flex flex-col items-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCaptureMode('camera');
                                        startCamera();
                                    }}
                                    className="w-full flex flex-col items-center justify-center gap-4 p-8 rounded-3xl bg-[var(--theme-bg-subtle)] border-2 border-dashed border-[var(--theme-border-strong)] hover:bg-[var(--theme-bg-card)] transition-all shadow-sm cursor-pointer"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-[var(--theme-accent-muted)] flex items-center justify-center">
                                        <Camera size={32} className="text-[var(--theme-accent)]" />
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-sm font-bold text-[var(--theme-text-primary)] uppercase tracking-wider mb-1">Open Live Camera Viewfinder</span>
                                        <span className="block text-[10px] text-[var(--theme-accent)] font-bold uppercase opacity-80">Live Hardware Capture Only</span>
                                    </div>
                                </button>
                            </div>
                        )}

                        {captureMode === 'camera' && (
                            <div className="relative rounded-3xl overflow-hidden bg-[var(--theme-bg-app)] border border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] aspect-video flex items-center justify-center shadow-2xl">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                />
                                <canvas ref={canvasRef} className="hidden" />

                                <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
                                    <div className="flex justify-between items-start">
                                        <div className="px-3 py-1 bg-[color-mix(in_srgb,var(--theme-overlay)_60%,transparent)] backdrop-blur-md rounded-full border border-[var(--theme-border)] flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[var(--theme-accent)] animate-pulse" />
                                            <span className="text-[10px] font-bold text-[var(--theme-accent)] uppercase tracking-widest">Live Audit Camera</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                stopCamera();
                                                setCaptureMode('idle');
                                            }}
                                            aria-label="Close Camera"
                                            className="p-2 rounded-full bg-[color-mix(in_srgb,var(--theme-overlay)_60%,transparent)] text-[var(--theme-text-primary)] bg-[var(--theme-status-danger-bg)] transition-colors pointer-events-auto cursor-pointer"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>

                                    <div className="flex justify-center pb-2">
                                        <button
                                            type="button"
                                            onClick={handleTakePhotoSnapshot}
                                            aria-label="Capture Photo"
                                            className="group w-16 h-16 rounded-full border-4 border-[var(--theme-border)] flex items-center justify-center p-1 pointer-events-auto hover:scale-110 transition-transform active:scale-95 cursor-pointer shadow-lg"
                                        >
                                            <div className="w-full h-full rounded-full bg-[var(--theme-bg-card)] group-hover:bg-[var(--theme-accent)] transition-colors" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {imagePreview && (
                            <div className="relative rounded-3xl overflow-hidden bg-[color-mix(in_srgb,var(--theme-overlay)_40%,transparent)] border border-[var(--theme-border)] aspect-video flex items-center justify-center group">
                                {isCompressing ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-12 h-12 border-4 border-[var(--theme-accent)] border-t-transparent rounded-full animate-spin" />
                                        <span className="text-[var(--theme-accent)] font-bold text-[10px] uppercase tracking-[0.2em] animate-pulse">BURNING AUDIT SEAL...</span>
                                    </div>
                                ) : (
                                    <>
                                        <img src={imagePreview} alt="Evidence" className="w-full h-full object-contain" />
                                        <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--theme-overlay)_40%,transparent)] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImagePreview(null);
                                                    setImageFile(null);
                                                    setCaptureMode('camera');
                                                    startCamera();
                                                }}
                                                aria-label="Retake Photo"
                                                className="p-3.5 rounded-2xl bg-[color-mix(in_srgb,var(--theme-bg-card)_20%,transparent)] hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] hover:text-[var(--theme-text-primary)] transition-all flex items-center gap-2 text-xs font-bold uppercase cursor-pointer"
                                            >
                                                <Camera size={18} /> Retake
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-[var(--theme-border-subtle)]">
                            <span className="text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-widest">
                                {imageFile ? 'Live Proof Attached' : 'Capture Required'}
                            </span>
                            <button
                                type="button"
                                onClick={() => setStep('search')}
                                disabled={!imageFile || isCompressing || captureMode === 'camera'}
                                className="group px-6 py-2.5 bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-xs uppercase tracking-wider shadow-sm cursor-pointer"
                            >
                                Continue To Mapping
                                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                )}

                {step === 'search' && (
                    <UnknownBarcodeSearchStep
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        filteredProducts={filteredProducts}
                        selectedProduct={selectedProduct}
                        setSelectedProduct={setSelectedProduct}
                        user={user}
                        isUploading={isUploading}
                        searchInputRef={searchInputRef}
                        onKeyDown={handleSearchKeyDown}
                        onBack={() => setStep('evidence')}
                        onConfirmMap={handleInitiateMap}
                    />
                )}

                {step === 'manager-pin' && selectedProduct && (
                    <UnknownBarcodeManagerPinStep
                        selectedProduct={selectedProduct}
                        scannedBarcode={barcode}
                        onAuthorized={executeMapping}
                        onBack={() => setStep('search')}
                    />
                )}
            </div>
        </Modal>
    );
}
