import React from 'react';
import { usePOS } from './POSContext';
import { useData } from '../../contexts/DataContext';
import { Product } from '../../types';

// Modals
import { PaymentModal } from './modals/PaymentModal';
import { PrintReceiptModal } from './modals/PrintReceiptModal';
import { ReturnModal } from './modals/ReturnModal';
import { ShiftClosingModal } from './modals/ShiftClosingModal';
import { CustomerSelectionModal } from './modals/CustomerSelectionModal';
import { DiscountModal } from './modals/DiscountModal';
import { HoldOrderModal } from './modals/HoldOrderModal';
import { RecallOrderModal } from './modals/RecallOrderModal';
import { MiscItemModal } from './modals/MiscItemModal';
import { EmailReceiptModal } from './modals/EmailReceiptModal';
import { ReceiptPreviewModal } from './modals/ReceiptPreviewModal';
import { PriceUpdatesModal } from './modals/PriceUpdatesModal';

// Shared
import UnknownBarcodeModal from '../UnknownBarcodeModal';
import { PointsEarnedPopup } from '../WorkerPointsDisplay';

export const POSModals: React.FC = () => {
    const {
        isUnknownBarcodeModalOpen,
        setIsUnknownBarcodeModalOpen,
        setCapturedBarcodeForModal,
        capturedBarcodeForModal,
        setUnknownBarcode,
        setSearchTerm,
        addToCart,
        showPointsPopup,
        setShowPointsPopup,
        earnedPointsData,
    } = usePOS();

    const { refreshData, products } = useData();

    return (
        <>
            <PaymentModal />
            <PrintReceiptModal />
            <ReturnModal />
            <ShiftClosingModal />
            <CustomerSelectionModal />
            <DiscountModal />
            <HoldOrderModal />
            <RecallOrderModal />
            <MiscItemModal />
            <EmailReceiptModal />
            <ReceiptPreviewModal />
            <PriceUpdatesModal />

            {/* Unknown Barcode Mapping Modal */}
            <UnknownBarcodeModal
                isOpen={isUnknownBarcodeModalOpen}
                onClose={() => {
                    setIsUnknownBarcodeModalOpen(false);
                    setCapturedBarcodeForModal('');
                }}
                barcode={capturedBarcodeForModal}
                onMapProduct={(product: Product) => {
                    // Refresh products or add to cart immediately
                    addToCart(product);
                    setIsUnknownBarcodeModalOpen(false);
                    setUnknownBarcode(''); // Clear unknown barcode state
                    setCapturedBarcodeForModal(''); // Clear captured barcode
                    setSearchTerm(''); // Clear search input
                    // Note: Notification will be handled within UnknownBarcodeModal or calling component
                    // Trigger a data refresh to pull the new alias
                    refreshData();
                }}
                products={products}
            />

            {/* Points Earned Popup */}
            {showPointsPopup && earnedPointsData && (
                <PointsEarnedPopup
                    points={earnedPointsData.points}
                    message="Transaction Complete!"
                    bonuses={earnedPointsData.breakdown}
                    onClose={() => setShowPointsPopup(false)}
                />
            )}
        </>
    );
};
