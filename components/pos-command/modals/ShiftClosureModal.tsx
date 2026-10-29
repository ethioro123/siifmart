import { BlindCounterClose } from '../../pos/BlindCounterClose';
import { usePOSCommand } from '../POSCommandContext';
export function ShiftClosureModal() {
    const state = usePOSCommand();
    return <BlindCounterClose isOpen={state.isClosingShift} pending={state.isSubmittingShift}
        onClose={() => state.setIsClosingShift(false)} onSubmit={state.handleSubmitShift}
        denominations={state.cashDenominations} setDenominations={value => Object.entries(value).forEach(([den, count]) => state.handleUpdateDenomination(Number(den), count))}
        notes={state.discrepancyReason} setNotes={state.setDiscrepancyReason} />;
}
