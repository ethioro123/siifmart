// Execute the retrieved staging v1 handler with inert clients; no authentication account is changed.
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { expect, it, vi } from 'vitest';
it('allows a floor receiver to invoke an administrative password reset for a driver',async()=>{
 const source=readFileSync(new URL('../fixtures/employee-audit-deployed-reset.txt',import.meta.url),'utf8').replace(/^import .*createClient.*$/m,'');
 let handler:((request:Request)=>Promise<Response>)|undefined;
 const update=vi.fn().mockResolvedValue({error:null});
 const caller={auth:{getUser:async()=>({data:{user:{id:'receiver',email:'audit@example.invalid'}},error:null})},from:()=>({select:()=>({eq:(_column:string,id:string)=>({single:async()=>({data:{role:id==='receiver'?'receiver':'driver'},error:null})})})})};
 const admin={auth:{admin:{updateUserById:update}},from:()=>({insert:async()=>({error:null})})};
 const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
 runInNewContext(code,{Request,Response,console:{error:vi.fn()},Deno:{env:{get:(name:string)=>name},serve:(fn:typeof handler)=>{handler=fn;}},createClient:(_url:string,key:string)=>key==='SUPABASE_SERVICE_ROLE_KEY'?admin:caller});
 expect(handler).toBeTypeOf('function');
 const response=await handler!(new Request('https://example.invalid/reset',{method:'POST',headers:{Authorization:'Bearer inert-test-token','Content-Type':'application/json'},body:JSON.stringify({userId:'driver',newPassword:'Inert-test-value-123!'})}));
 expect(await response.json()).toEqual({success:true});
 expect(update).toHaveBeenCalledWith('driver',expect.objectContaining({password:expect.any(String)}));
});
