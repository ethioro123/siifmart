import {afterEach,describe,expect,it} from 'vitest';
import {formatPreferredDate} from '../../utils/datePreferences';
import {formatDateTime,setGlobalDateFormat,setGlobalTimezone} from '../../utils/formatting';
afterEach(()=>{setGlobalDateFormat('DD/MM/YYYY');setGlobalTimezone('UTC');});
describe('saved date preferences',()=>{
 it('uses the country timezone and selected order',()=>{const date=new Date('2026-01-02T22:30:00Z');expect(formatPreferredDate(date,'Africa/Addis_Ababa','DD/MM/YYYY')).toBe('03/01/2026');expect(formatPreferredDate(date,'Africa/Addis_Ababa','MM/DD/YYYY')).toBe('01/03/2026');expect(formatPreferredDate(date,'UTC','YYYY-MM-DD')).toBe('2026-01-02');});
 it('changes the shared absolute formatter',()=>{setGlobalTimezone('UTC');setGlobalDateFormat('YYYY-MM-DD');expect(formatDateTime('2026-01-02T12:00:00Z')).toBe('2026-01-02');setGlobalDateFormat('MM/DD/YYYY');expect(formatDateTime('2026-01-02T12:00:00Z')).toBe('01/02/2026');});
});
