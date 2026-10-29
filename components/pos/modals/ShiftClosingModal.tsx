import { BlindCounterClose } from '../BlindCounterClose';
import { usePOS } from '../POSContext';
export function ShiftClosingModal() {
    const state = usePOS();
    return <BlindCounterClose isOpen={state.isShiftModalOpen} pending={state.isProcessing}
        onClose={() => state.setIsShiftModalOpen(false)} onSubmit={state.handleSubmitShift}
        denominations={state.cashDenominations} setDenominations={state.setCashDenominations}
        notes={state.discrepancyReason} setNotes={state.setDiscrepancyReason} />;
}
