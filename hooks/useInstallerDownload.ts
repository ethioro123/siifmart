import { useEffect, useRef, useState } from 'react';
export function useInstallerDownload(url:string,filename:string) {
 const request=useRef<AbortController|null>(null);
 const [isChecking,setChecking]=useState(false);
 const [error,setError]=useState<string|null>(null);
 useEffect(()=>{setError(null);return()=>{request.current?.abort();request.current=null;};},[url]);
 const download=async()=>{
  if(request.current)return;
  const controller=new AbortController();request.current=controller;setChecking(true);setError(null);
  try {
   const response=await fetch(url,{method:'HEAD',signal:controller.signal});
   const type=(response.headers.get('content-type')||'').toLowerCase();
   if(!response.ok||!type||type.startsWith('text/')||type.includes('json'))throw new Error('The selected installer is unavailable.');
   if(controller.signal.aborted)return;
   const link=document.createElement('a');link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();
  } catch(value) {
   if(!controller.signal.aborted)setError(value instanceof Error&&value.message==='The selected installer is unavailable.'?value.message:'The installer download could not be started.');
  } finally {if(request.current===controller){request.current=null;setChecking(false);}}
 };
 return {download,isChecking,error};
}
