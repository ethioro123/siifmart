import {useEffect,useRef,useState} from 'react';
/** Background refreshes may update clean forms, but never replace local edits. */
export function useSettingsDraft<T>(initial:T){
 const [value,setState]=useState(initial);const [dirty,setDirty]=useState(false);
 const dirtyRef=useRef(false);const current=useRef(value);current.current=value;
 const signature=JSON.stringify(initial);
 useEffect(()=>{if(!dirtyRef.current){const next=JSON.parse(signature) as T;current.current=next;setState(next);}},[signature]);
 const setValue=(next:React.SetStateAction<T>)=>{dirtyRef.current=true;setDirty(true);setState(previous=>{const resolved=typeof next==='function'?(next as (p:T)=>T)(previous):next;current.current=resolved;return resolved;});};
 const acknowledge=(submitted:T,saved:T=submitted)=>{if(JSON.stringify(current.current)===JSON.stringify(submitted)){dirtyRef.current=false;setDirty(false);current.current=saved;setState(saved);}};
 return {value,setValue,dirty,acknowledge};
}
