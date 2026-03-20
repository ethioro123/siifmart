import React from 'react';
import { StockListModal } from './modals/StockListModal';
import { ReceivingModal } from './modals/ReceivingModal';
import { ShiftClosureModal } from './modals/ShiftClosureModal';

export const POSCommandModals: React.FC = () => {
    return (
        <>
            <StockListModal />
            <ReceivingModal />
            <ShiftClosureModal />
        </>
    );
};
