import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatDateTime } from '../../utils/formatting';
import { transferEvidenceEvents, type TransferEvidence } from '../../utils/transferPresentation';

/** Only timestamped observations are shown; no inferred milestones or stock quantities. */
export function TransferEvidenceTimeline({ record }: { record: TransferEvidence }) {
    const { t } = useLanguage();
    const events = transferEvidenceEvents(record);
    return <details className="mt-3 text-xs text-[var(--theme-text-secondary)]">
        <summary className="cursor-pointer py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">{t('warehouse.transferRecordedHistory')}</summary>
        {events.length ? <ol className="space-y-2 py-2">{events.map(event => <li key={event.key} className="flex flex-wrap justify-between gap-2"><span>{t(`warehouse.${event.key}`)}</span><time dateTime={event.at}>{formatDateTime(event.at)}</time></li>)}</ol> : <p className="py-2">{t('warehouse.transferNoRecordedEvents')}</p>}
        {record.hasDiscrepancy && <p className="py-2 text-[var(--theme-status-warning-text)]">{t('warehouse.transferExceptionRecorded')}{record.discrepancyDetails ? `: ${record.discrepancyDetails}` : ''}</p>}
    </details>;
}
