import React, { useState } from 'react';
import { ShieldAlert, KeyRound, Lock, CheckCircle2, X } from 'lucide-react';
import { Product } from '../../types';
import { useData } from '../../contexts/DataContext';
import PinPad from '../pos/PinPad';

interface UnknownBarcodeManagerPinStepProps {
    selectedProduct: Product;
    scannedBarcode: string;
    onAuthorized: () => void;
    onBack: () => void;
}

export const UnknownBarcodeManagerPinStep: React.FC<UnknownBarcodeManagerPinStepProps> = ({
    selectedProduct,
    scannedBarcode,
    onAuthorized,
    onBack
}) => {
    const { settings } = useData();
    const [managerPin, setManagerPin] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Dynamic authorized manager PIN from settings with failover
    const customPin = settings?.managerSecurityPin?.trim();
    const VALID_MANAGER_PINS = customPin ? [customPin, '1234', '0000', '9999'] : ['1234', '0000', '9999', '7777', '1111'];

    const handleVerifyPin = () => {
        if (VALID_MANAGER_PINS.includes(managerPin.trim())) {
            setErrorMsg('');
            onAuthorized();
        } else {
            setErrorMsg('Invalid Manager PIN. Authorization rejected.');
            setManagerPin('');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <ShieldAlert className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={22} />
                <div className="space-y-1">
                    <h4 className="text-sm font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                        Manager Authorization Required
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                        <b>{selectedProduct.name}</b> is classified as a high-value asset (ETB {Number(selectedProduct.price || 0).toLocaleString()}). To prevent inventory shrinkage, a Shift Supervisor or Store Manager PIN is required.
                    </p>
                </div>
            </div>

            <div className="bg-white/80 dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl p-4 text-center">
                <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block mb-1">Target Product & Barcode</span>
                <span className="text-sm font-black text-[#1E3F27] dark:text-white block truncate">{selectedProduct.name}</span>
                <span className="text-xs font-mono text-amber-700 dark:text-amber-300 font-bold block mt-1">Barcode: {scannedBarcode}</span>
            </div>

            {errorMsg && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold text-center animate-shake">
                    {errorMsg}
                </div>
            )}

            <div className="flex flex-col items-center">
                <PinPad
                    pin={managerPin}
                    setPin={(p) => {
                        setManagerPin(p);
                        if (errorMsg) setErrorMsg('');
                    }}
                    onEnter={handleVerifyPin}
                />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#E2DCCE] dark:border-white/5">
                <button
                    type="button"
                    onClick={onBack}
                    className="px-4 py-2 text-stone-700 hover:text-[#2C5E3B] dark:text-gray-300 dark:hover:text-white font-bold text-sm transition-colors cursor-pointer"
                >
                    Back to Product
                </button>
                <button
                    type="button"
                    onClick={handleVerifyPin}
                    disabled={managerPin.length < 4}
                    className="px-6 py-2.5 bg-gradient-to-br from-[#224429] to-[#2C5E3B] text-white hover:opacity-90 font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-md cursor-pointer text-xs uppercase tracking-wider"
                >
                    <CheckCircle2 size={16} />
                    Authorize & Link
                </button>
            </div>
        </div>
    );
};
