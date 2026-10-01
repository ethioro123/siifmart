import React from 'react';
import { StockListModal } from './modals/StockListModal';
import { ReceivingModal } from './modals/ReceivingModal';
import { ShiftClosureModal } from './modals/ShiftClosureModal';
import { StartShiftModal } from './modals/StartShiftModal';
import LabelPrintModal from '../LabelPrintModal';
import { usePOSCommand } from './POSCommandContext';

export const POSCommandModals: React.FC = () => {
    const { isPrintHubOpen, setIsPrintHubOpen } = usePOSCommand();

    return (
        <>
            <StockListModal />
            <ReceivingModal />
            <ShiftClosureModal />
            <StartShiftModal />
            <LabelPrintModal
                isOpen={isPrintHubOpen}
                onClose={() => setIsPrintHubOpen(false)}
                labels={[]}
                onPrint={() => setIsPrintHubOpen(false)}
            />
        </>
    );
};

