const statuses=new Set(['pending','inprogress','completed','cancelled','deleted','received','recorded','pendingreview','approved','rejected','active','requested','shipped','intransit','delivered','partiallydelivered','partiallyreceived','assigned','paused','draft']);
export function operationStatusLabel(t:(key:string)=>string,status:string){
 const key=status.toLowerCase().replace(/[\s-]/g,'');
 return statuses.has(key)?t(`warehouse.opStatus_${key}`):status;
}
export function operationValueLabel(t:(key:string)=>string,key:string,value:string|number|boolean|null){
 const text=String(value);
 if(key==='transferStatus')return operationStatusLabel(t,text);
 if(key==='direction'&&(text==='IN'||text==='OUT'))return t(text==='IN'?'warehouse.opStockIn':'warehouse.opStockOut');
 if(key==='action'&&['Restock','Repair','Discard'].includes(text))return t(`warehouse.returnAction_${text}`);
 if(key==='condition'){
  const conditions:Record<string,string>={Good:'conditionGood',Damaged:'conditionDamaged',Expired:'conditionExpired','Missing Parts':'conditionMissing',Rejected:'receiptRejected','New / Sealed':'returnCondition_0','Open Box':'returnCondition_1'};
  if(conditions[text])return t(`warehouse.${conditions[text]}`);
 }
 return text;
}
