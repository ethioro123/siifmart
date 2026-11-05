export type DatePreference='DD/MM/YYYY'|'MM/DD/YYYY'|'YYYY-MM-DD';
export function formatPreferredDate(date:Date,timeZone:string,pattern:DatePreference){
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone,day:'2-digit',month:'2-digit',year:'numeric'}).formatToParts(date);
 const value=(type:Intl.DateTimeFormatPartTypes)=>parts.find(p=>p.type===type)?.value||'';
 const day=value('day'),month=value('month'),year=value('year');
 return pattern==='YYYY-MM-DD'?`${year}-${month}-${day}`:pattern==='MM/DD/YYYY'?`${month}/${day}/${year}`:`${day}/${month}/${year}`;
}
