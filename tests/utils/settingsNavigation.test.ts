// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { SETTINGS_SECTIONS, visibleSettingsSections } from '../../utils/settingsNavigation';
describe('grouped settings navigation', () => {
    it('keeps each setting once and preserves all 16 sections', () => {
        expect(new Set(SETTINGS_SECTIONS.map(section => section.id)).size).toBe(16);
        expect(visibleSettingsSections('group_ceo', false, true)).toHaveLength(16);
    });
    it('retains the regional and enterprise navigation boundaries', () => {
        expect(visibleSettingsSections('group_ceo', true, true).map(section => section.id)).not.toContain('finance');
        expect(visibleSettingsSections('group_ceo', false, false).map(section => section.id)).not.toContain('security');
        expect(visibleSettingsSections(undefined, false, true)).toEqual([]);
    });
    it('searches category and label within authorized results', () => {
        expect(visibleSettingsSections('group_ceo', false, true, 'tax').map(section => section.id)).toEqual(['finance']);
        expect(visibleSettingsSections('group_ceo', false, true, 'people').map(section => section.id)).toEqual(['hr', 'gamification']);
    });
});
