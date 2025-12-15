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
        <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center bg-black sm:bg-black/90 sm:backdrop-blur-sm">
            <div className="relative w-full h-full sm:h-auto sm:max-w-lg flex flex-col sm:block bg-black sm:bg-transparent">
                {/* Header */}
                <div className="bg-cyber-gray border-b sm:border border-white/10 sm:rounded-t-2xl p-4 flex items-center justify-between shrink-0 z-10">
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
                        className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Camera View */}
                <div className="bg-black border-x border-white/10 relative flex-1 sm:flex-none sm:aspect-video overflow-hidden">
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
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="relative w-64 h-64 sm:w-64 sm:h-64 border border-white/10 rounded-xl bg-black/10 backdrop-blur-[2px]">
                                    {/* Corner brackets */}
                                    <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-cyber-primary rounded-tl-xl shadow-[0_0_15px_rgba(0,255,157,0.5)]"></div>
                                    <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-cyber-primary rounded-tr-xl shadow-[0_0_15px_rgba(0,255,157,0.5)]"></div>
                                    <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-cyber-primary rounded-bl-xl shadow-[0_0_15px_rgba(0,255,157,0.5)]"></div>
                                    <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-cyber-primary rounded-br-xl shadow-[0_0_15px_rgba(0,255,157,0.5)]"></div>

                                    {/* Scanning line animation */}
                                    <div className="absolute inset-0 overflow-hidden rounded-xl">
                                        <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-cyber-primary to-transparent animate-scan-line shadow-[0_0_20px_rgba(0,255,157,0.8)]"></div>
                                    </div>

                                    {/* Crosshair guides */}
                                    <div className="absolute top-1/2 left-0 w-4 h-[1px] bg-white/30"></div>
                                    <div className="absolute top-1/2 right-0 w-4 h-[1px] bg-white/30"></div>
                                    <div className="absolute top-0 left-1/2 w-[1px] h-4 bg-white/30"></div>
                                    <div className="absolute bottom-0 left-1/2 w-[1px] h-4 bg-white/30"></div>
                                </div>
                            </div>

                            {/* Status indicator */}
                            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full px-6 flex justify-center">
                                <div className="bg-black/70 backdrop-blur-md border border-cyber-primary/30 rounded-full px-6 py-3 flex items-center gap-3 shadow-lg">
                                    <div className="w-2.5 h-2.5 rounded-full bg-cyber-primary animate-pulse shadow-[0_0_10px_rgba(0,255,157,0.8)]"></div>
                                    <span className="text-cyber-primary text-sm font-bold tracking-wide uppercase">Searching for code...</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-cyber-gray border-t sm:border border-white/10 sm:rounded-b-2xl p-4 shrink-0 pb-safe z-10">
                    <p className="text-xs text-gray-400 text-center">
                        Align the QR code or Barcode within the frame to scan
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
