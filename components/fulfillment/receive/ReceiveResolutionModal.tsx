import React from 'react';
import { Product } from '../../../types';
import UnknownBarcodeModal from '../../UnknownBarcodeModal';

interface ReceiveResolutionModalProps {
    resolvingBarcode: { barcode: string; qty: number };
    setResolvingBarcode: (val: { barcode: string; qty: number } | null) => void;
    resolutionSearch: string;
    setResolutionSearch: (val: string) => void;
    products: Product[];
    setUnresolvedScans: React.Dispatch<React.SetStateAction<Array<{ barcode: string; scannedAt: Date; qty: number; suggestions?: string[] }>>>;
    addNotification: (type: 'success' | 'alert' | 'info', message: string) => void;
    refreshData: () => Promise<void>;
    isSubmitting: boolean;
    t: (key: string, params?: Record<string, string | number>) => string;
}

export const ReceiveResolutionModal: React.FC<ReceiveResolutionModalProps> = ({
    resolvingBarcode, setResolvingBarcode, products
}) => (
    <UnknownBarcodeModal
        key={resolvingBarcode.barcode}
        isOpen
        barcode={resolvingBarcode.barcode}
        products={products}
        onClose={() => setResolvingBarcode(null)}
        onMapProduct={() => undefined}
    />
);
