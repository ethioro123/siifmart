import { expect,it } from 'vitest';
import { markdownToday,markdownTomorrow } from '../../utils/markdownCalendar';
it('uses the national day near a UTC/device date boundary',()=>{
 const now=new Date('2026-10-28T22:30:00Z');
 expect(markdownToday('ET',now)).toBe('2026-10-29');expect(markdownToday('KE',now)).toBe('2026-10-29');
 expect(markdownTomorrow('ET',now)).toBe('2026-10-30');
});
it('handles month/year boundaries without device DST arithmetic',()=>{
 expect(markdownTomorrow('ET',new Date('2026-12-31T12:00:00Z'))).toBe('2027-01-01');
});
