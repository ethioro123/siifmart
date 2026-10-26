import { useRef, useState } from 'react';
import { printHtmlContent } from '../utils/printHelper';
import { logger } from '../utils/logger';
/** A successful print-helper result confirms handoff, not physical printer output. */
export function useLabelPrintJob(notify: (type:string,message:string)=>void) {
    const lock=useRef(false);
    const [isPrinting,setIsPrinting]=useState(false);
    const print=async (generate:()=>Promise<string>)=>{
        if(lock.current)return;
        lock.current=true;setIsPrinting(true);
        try{
            const html=await generate();
            const result=await printHtmlContent(html);
            if(!result?.success)throw new Error(result?.error || 'Print handoff was not confirmed.');
            notify('info','Labels sent to the print dialog. Confirm the printer output before using them.');
        }catch(error){
            logger.error('Labels','Print handoff failed',error);
            notify('alert',error instanceof Error?error.message:'Could not prepare labels.');
        }finally{lock.current=false;setIsPrinting(false);}
    };
    return {print,isPrinting};
}
