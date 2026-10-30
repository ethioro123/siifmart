import { useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { printHtmlContent } from '../utils/printHelper';
import { logger } from '../utils/logger';
/** A successful print-helper result confirms handoff, not physical printer output. */
export function useLabelPrintJob(notify: (type:string,message:string)=>void) {
    const { t } = useLanguage();
    const lock=useRef(false);
    const [isPrinting,setIsPrinting]=useState(false);
    const print=async (generate:()=>Promise<string>):Promise<boolean>=>{
        if(lock.current)return false;
        lock.current=true;setIsPrinting(true);
        try{
            const html=await generate();
            const result=await printHtmlContent(html);
            if(!result?.success)throw new Error(result?.error || 'Print handoff was not confirmed.');
            notify('info',t('pos.printHandedOff'));
            return true;
        }catch(error){
            logger.error('Labels','Print handoff failed',error);
            notify('alert',t('pos.printFailed'));
            return false;
        }finally{lock.current=false;setIsPrinting(false);}
    };
    return {print,isPrinting};
}
