/** Clearance calendars follow the national operating day, not the browser/device timezone. */
export function markdownToday(country:string,now=new Date()):string {
    const timeZone=country.toUpperCase()==='KE' ? 'Africa/Nairobi' : 'Africa/Addis_Ababa';
    const parts=new Intl.DateTimeFormat('en-US',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
    const part=(type:string)=>parts.find(p=>p.type===type)?.value || '';
    return `${part('year')}-${part('month')}-${part('day')}`;
}
export function markdownTomorrow(country:string,now=new Date()):string {
    const date=new Date(`${markdownToday(country,now)}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+1);
    return date.toISOString().slice(0,10);
}
