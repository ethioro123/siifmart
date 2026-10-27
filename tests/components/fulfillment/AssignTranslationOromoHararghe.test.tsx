import { describe, it, expect } from 'vitest';
import { assign } from '../../../utils/translations/warehouse/assign';

interface TranslationEntry {
    en?: string;
    am?: string;
    or?: string;
}

const dict = assign as Record<string, TranslationEntry>;

const getOr = (key: string): string => dict[key]?.or || '';
const getEn = (key: string): string => dict[key]?.en || '';
const getAm = (key: string): string => dict[key]?.am || '';

describe('WMS Operations - Assign Tab East Hararghe (Harargee Bahaa) Localization', () => {
    it('contains non-empty en, am, and or entries for all keys', () => {
        const keys = Object.keys(dict).filter(k => typeof dict[k] === 'object');
        expect(keys.length).toBeGreaterThan(30);

        const missingOr: string[] = [];
        const missingAm: string[] = [];
        const missingEn: string[] = [];

        keys.forEach((key) => {
            const entry = dict[key];
            if (!entry?.or || entry.or.trim() === '') missingOr.push(key);
            if (!entry?.am || entry.am.trim() === '') missingAm.push(key);
            if (!entry?.en || entry.en.trim() === '') missingEn.push(key);
        });

        expect(missingOr, `Missing or translation for keys: ${missingOr.join(', ')}`).toHaveLength(0);
        expect(missingAm, `Missing am translation for keys: ${missingAm.join(', ')}`).toHaveLength(0);
        expect(missingEn, `Missing en translation for keys: ${missingEn.join(', ')}`).toHaveLength(0);
    });

    it('faithfully applies East Hararghe (Harargee Bahaa) commercial dialect terminology', () => {
        // Root Assign: Wiirtuu Ramaddii Hojii / Ramaddii Hojii
        expect(dict.or).toContain('Ramaddii Hojii');
        expect(getOr('taskAssignment')).toBe('Ramaddii Hojii');
        expect(getOr('taskAssignmentDesc').toLowerCase()).toContain('miseensa garee');
        expect(getOr('autoAssignJobs').toLowerCase()).toContain('ofiin ramadi');
        expect(getOr('undoAutoAssignment').toLowerCase()).toContain('diigi');

        // Queue & Filters
        expect(getOr('jobQueueTitle').toLowerCase()).toContain('tarree hojii');
        expect(getOr('moreFilters').toLowerCase()).toContain('calaltuu');
        expect(getOr('allFacilities').toLowerCase()).toContain('giddugala');
        expect(getOr('allJobTypes').toLowerCase()).toContain('akaakuu hojii');

        // Card & Availability
        expect(getOr('unassignedBadge').toLowerCase()).toContain('hin ramadamne');
        expect(getOr('assignButton').toLowerCase()).toBe('ramadi');
        expect(getOr('assigningWord').toLowerCase()).toContain('ramadaa');

        // Operations Matrix & Intelligence
        expect(getOr('liveOperationsMatrixTitle').toLowerCase()).toContain('gabatee hojiiwwan');
        expect(getOr('jobIntelligenceTitle').toLowerCase()).toContain('hojii');
        expect(getOr('logisticsRoute').toLowerCase()).toContain('lojistiksii');
        expect(getOr('originLabel').toLowerCase()).toContain('ka\'umsaa');
        expect(getOr('destinationLabel').toLowerCase()).toContain('gahumsaa');
        expect(getOr('reassignAction').toLowerCase()).toContain('irra deebi\'ii ramadi');
        expect(getOr('unassignAction').toLowerCase()).toContain('ramaddii kaasi');
    });

    it('provides valid parameterized translation templates', () => {
        expect(getEn('orderDirection')).toContain('{direction}');
        expect(getAm('orderDirection')).toContain('{direction}');
        expect(getOr('orderDirection')).toContain('{direction}');

        expect(getEn('prioritySuffix')).toContain('{priority}');
        expect(getAm('prioritySuffix')).toContain('{priority}');
        expect(getOr('prioritySuffix')).toContain('{priority}');

        expect(getEn('assignedToWorkerLabel')).toContain('{name}');
        expect(getAm('assignedToWorkerLabel')).toContain('{name}');
        expect(getOr('assignedToWorkerLabel')).toContain('{name}');

        expect(getEn('suggestedWorkerWithWorkload')).toContain('{name}');
        expect(getAm('suggestedWorkerWithWorkload')).toContain('{name}');
        expect(getOr('suggestedWorkerWithWorkload')).toContain('{name}');
        expect(getEn('suggestedWorkerWithWorkload')).toContain('{count}');
        expect(getAm('suggestedWorkerWithWorkload')).toContain('{count}');
        expect(getOr('suggestedWorkerWithWorkload')).toContain('{count}');

        expect(getEn('jobItemsCount')).toContain('{count}');
        expect(getAm('jobItemsCount')).toContain('{count}');
        expect(getOr('jobItemsCount')).toContain('{count}');

        expect(getEn('assigningJobNotice')).toContain('{type}');
        expect(getAm('assigningJobNotice')).toContain('{type}');
        expect(getOr('assigningJobNotice')).toContain('{type}');
        expect(getEn('assigningJobNotice')).toContain('{id}');
        expect(getAm('assigningJobNotice')).toContain('{id}');
        expect(getOr('assigningJobNotice')).toContain('{id}');

        expect(getEn('workloadTimezoneNotice')).toContain('{timezone}');
        expect(getAm('workloadTimezoneNotice')).toContain('{timezone}');
        expect(getOr('workloadTimezoneNotice')).toContain('{timezone}');

        expect(getEn('workerWorkloadStatus')).toContain('{active}');
        expect(getAm('workerWorkloadStatus')).toContain('{active}');
        expect(getOr('workerWorkloadStatus')).toContain('{active}');
        expect(getEn('workerWorkloadStatus')).toContain('{max}');
        expect(getAm('workerWorkloadStatus')).toContain('{max}');
        expect(getOr('workerWorkloadStatus')).toContain('{max}');
        expect(getEn('workerWorkloadStatus')).toContain('{completed}');
        expect(getAm('workerWorkloadStatus')).toContain('{completed}');
        expect(getOr('workerWorkloadStatus')).toContain('{completed}');

        expect(getEn('pageOfPages')).toContain('{page}');
        expect(getAm('pageOfPages')).toContain('{page}');
        expect(getOr('pageOfPages')).toContain('{page}');
        expect(getEn('pageOfPages')).toContain('{pages}');
        expect(getAm('pageOfPages')).toContain('{pages}');
        expect(getOr('pageOfPages')).toContain('{pages}');

        expect(getEn('workersActiveCount')).toContain('{count}');
        expect(getAm('workersActiveCount')).toContain('{count}');
        expect(getOr('workersActiveCount')).toContain('{count}');
    });
});
