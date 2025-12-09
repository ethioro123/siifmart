import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, AlertCircle } from 'lucide-react';
// @ts-ignore - jsqr doesn't have types
import jsQR from 'jsqr';

interface QRScannerProps {
    onScan: (data: string) => void;
    onClose: () => void;
    title?: string;
    description?: string;
}

export const QRScanner: React.FC<QRScannerProps> = ({
    onScan,
    onClose,
    title = "Scan QR Code or Barcode",
    description = "Position the code within the frame"
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState<string>('');
    const [isScanning, setIsScanning] = useState(false);
    const animationFrameRef = useRef<number>();

    useEffect(() => {
        let stream: MediaStream | null = null;

        const startCamera = async () => {
            try {
                // Request camera access
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment', // Use back camera on mobile
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                    setIsScanning(true);
                    scanQRCode();
                }
            } catch (err) {
                console.error('Camera access error:', err);
                setError('Unable to access camera. Please check permissions.');
            }
        };

        const scanQRCode = () => {
            if (!videoRef.current || !canvasRef.current || !isScanning) return;

            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
                animationFrameRef.current = requestAnimationFrame(scanQRCode);
                return;
            }

            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw video frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Try to detect QR code
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
            });

            if (code && code.data) {
                // QR code detected!
                onScan(code.data);
                stopCamera();
                onClose();
            } else {
                // Continue scanning
                animationFrameRef.current = requestAnimationFrame(scanQRCode);
            }
        };

        const stopCamera = () => {
            setIsScanning(false);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };

        startCamera();

        return () => {
            stopCamera();
        };
    }, [onScan, onClose, isScanning]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="relative w-full max-w-lg mx-4">
                {/* Header */}
                <div className="bg-cyber-gray border border-white/10 rounded-t-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyber-primary/10 flex items-center justify-center">
                            <Camera className="text-cyber-primary" size={20} />
                        </div>
                        <div>
                            <h3 className="text-white font-bold">{title}</h3>
                            <p className="text-xs text-gray-400">{description}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Camera View */}
                <div className="bg-black border-x border-white/10 relative aspect-video overflow-hidden">
                    {error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                            <AlertCircle className="text-red-400 mb-4" size={48} />
                            <p className="text-white font-bold mb-2">Camera Error</p>
                            <p className="text-gray-400 text-sm">{error}</p>
                        </div>
                    ) : (
                        <>
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover"
                                playsInline
                                muted
                            />
                            <canvas
                                ref={canvasRef}
                                className="hidden"
                            />

                            {/* Scanning Frame Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative w-64 h-64">
                                    {/* Corner brackets */}
                                    <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-cyber-primary rounded-tl-lg"></div>
                                    <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-cyber-primary rounded-tr-lg"></div>
                                    <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-cyber-primary rounded-bl-lg"></div>
                                    <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-cyber-primary rounded-br-lg"></div>

                                    {/* Scanning line animation */}
                                    <div className="absolute inset-0 overflow-hidden">
                                        <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-cyber-primary to-transparent animate-scan-line"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Status indicator */}
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                <div className="bg-black/70 backdrop-blur-sm border border-cyber-primary/30 rounded-full px-4 py-2 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-cyber-primary animate-pulse"></div>
                                    <span className="text-cyber-primary text-sm font-bold">Scanning...</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-cyber-gray border border-white/10 rounded-b-2xl p-4">
                    <p className="text-xs text-gray-400 text-center">
                        Hold your device steady and align the code within the frame
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes scan-line {
                    0% {
                        top: 0;
                    }
                    100% {
                        top: 100%;
                    }
                }
                .animate-scan-line {
                    animation: scan-line 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};
