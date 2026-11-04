/** Stable server reason; UI supplies the translated worker-facing message. */
export class PutawayBinLotConflictError extends Error {
    constructor() {
        super('The bin contains a different batch or expiry.');
        this.name = 'PutawayBinLotConflictError';
    }
}
