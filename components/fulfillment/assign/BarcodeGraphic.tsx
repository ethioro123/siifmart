import React, { useState, useEffect } from 'react';
import Barcode from 'react-barcode';
import QRCode from 'qrcode';
import { AlertCircle } from 'lucide-react';

interface BarcodeGraphicProps {
    value: string;
    format: 'BARCODE' | 'QR' | 'Both' | string;
    width?: number;
    height?: number;
    qrSize?: number;
    displayValue?: boolean;
    className?: string;
}

export const BarcodeGraphic: React.FC<BarcodeGraphicProps> = ({
    value,
    format,
    width = 1.3,
    height = 42,
    qrSize = 100,
    displayValue = false,
    className = ''
}) => {
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [qrError, setQrError] = useState<string | null>(null);

    const isQR = format === 'QR' || format === 'Both';
    const isBarcode = format === 'BARCODE' || format === 'Barcode' || format === 'Both';

    // Generate QR code asynchronously
    useEffect(() => {
        let isMounted = true;
        if (isQR && value?.trim()) {
            QRCode.toDataURL(value.trim(), {
                width: qrSize,
                margin: 1,
                errorCorrectionLevel: 'M',
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            })
                .then(url => {
                    if (isMounted) {
                        setQrDataUrl(url);
                        setQrError(null);
                    }
                })
                .catch(err => {
                    if (isMounted) {
                        setQrError('Failed to generate QR code');
                        setQrDataUrl(null);
                    }
                });
        } else {
            setQrDataUrl(null);
            setQrError(null);
        }

        return () => {
            isMounted = false;
        };
    }, [isQR, value, qrSize]);

    const cleanValue = value?.trim();
    if (!cleanValue) {
        return (
            <div className={`flex items-center justify-center p-3 text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-lg ${className}`}>
                <span>Awaiting barcode data</span>
            </div>
        );
    }

    // Code128 only supports ASCII (characters 0 to 127)
    const isAsciiValid = /^[\x20-\x7E]+$/.test(cleanValue);

    return (
        <div className={`flex items-center justify-center gap-3 overflow-hidden ${className}`}>
            {isBarcode && (
                <div className="flex flex-col items-center justify-center max-w-full overflow-hidden">
                    {isAsciiValid ? (
                        <Barcode
                            value={cleanValue}
                            format="CODE128"
                            width={width}
                            height={height}
                            displayValue={displayValue}
                            margin={0}
                            background="#ffffff"
                            lineColor="#000000"
                        />
                    ) : (
                        <div className="flex items-center gap-1.5 p-2 bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] rounded border border-[var(--theme-status-warning-border)] text-[11px]">
                            <AlertCircle size={14} className="shrink-0 text-[var(--theme-status-warning-text)]" />
                            <span>Code contains non-ASCII characters</span>
                        </div>
                    )}
                </div>
            )}

            {isQR && (
                <div className="flex flex-col items-center justify-center shrink-0">
                    {qrDataUrl ? (
                        <img
                            src={qrDataUrl}
                            alt={`QR for ${cleanValue}`}
                            width={qrSize}
                            height={qrSize}
                            className="rounded border border-slate-200 bg-white p-1"
                        />
                    ) : qrError ? (
                        <div className="text-[10px] text-[var(--theme-status-danger-text)] font-mono">{qrError}</div>
                    ) : (
                        <div
                            style={{ width: qrSize, height: qrSize }}
                            className="animate-pulse bg-slate-100 rounded border border-slate-200"
                        />
                    )}
                </div>
            )}
        </div>
    );
};
