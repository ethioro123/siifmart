import React, { useState } from 'react';
import { Calculator, Search, Send } from 'lucide-react';
import { useMerchandising } from './MerchandisingContext';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { usePriceManagerCatalog } from '../../hooks/usePriceManagerCatalog';
import { useMarkdownProposal } from '../../hooks/useMarkdownProposal';
import { validateTargetExitDate } from '../../utils/markdownGlidePath';
import { markdownToday, markdownTomorrow } from '../../utils/markdownCalendar';
import { useMarkdownPlan } from '../../hooks/useMarkdownPlan';
import { productSiteName } from '../../utils/priceManager';
import { isHqFacilitySite, isRegionalAdminFacilitySite } from '../../utils/roleSegregation';
import { MarkdownPlanResults } from './MarkdownPlanResults';

const control='min-h-[44px] w-full min-w-0 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3 text-sm text-[var(--theme-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-accent)]';
const button='min-h-[44px] rounded-xl px-4 text-sm font-medium border border-[var(--theme-border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-accent)] disabled:opacity-40';

export const MarkdownTab:React.FC=()=>{
    const {activeCountry,currencySymbol}=useMerchandising();
    const {user}=useStore();
    const {activeSite,activeRegionCode}=useData();
    const scope=JSON.stringify([user?.id,activeCountry,activeSite?.id,activeRegionCode]);
    // Remount local inputs, selection and proposal feedback atomically when the authorized scope changes.
    return <MarkdownPlanner key={scope} country={activeCountry} currency={currencySymbol} scope={scope}/>;
};

function MarkdownPlanner({country,currency,scope}:{country:string;currency:string;scope:string}) {
    const {activeSite,sites}=useData();
    const [search,setSearch]=useState(''), [query,setQuery]=useState(''), [page,setPage]=useState(1);
    const [selectedId,setSelectedId]=useState(''), [deadline,setDeadline]=useState('');
    const [selectedStage,setSelectedStage]=useState(-1), [error,setError]=useState('');
    const catalog=usePriceManagerCatalog({country,search:query,page,pageSize:25,filters:activeSite?.id && !isHqFacilitySite(activeSite) && !isRegionalAdminFacilitySite(activeSite) ? {sites:[activeSite.id]} : {}},true);
    const products=catalog.data?.data || [];
    const product=products.find(p=>p.id===selectedId) || null;
    const signature=JSON.stringify([scope,product,deadline,markdownToday(country)]);
    const planning=useMarkdownPlan(signature);
    const plan=planning.plan;
    const {send,busy,pending,feedback,refresh}=useMarkdownProposal(product,country,scope);
    const price=plan?.currentPrice ?? (product ? Math.round(product.isOnSale ? product.salePrice || product.price : product.price) : 0);
    const stage=plan?.stages[selectedStage];
    const pendingEdit=!!pending.data?.data.length;
    const confirmed=pending.isSuccess && !pending.isFetching;
    const tomorrow=markdownTomorrow(country);
    const money=(value:number)=>Number.isFinite(value) ? `${currency} ${Math.round(value).toLocaleString()}` : 'Unavailable';
    const generate=async()=>{
        setError('');
        const date=validateTargetExitDate(deadline,new Date(`${markdownToday(country)}T12:00:00`));
        if (!product) {setError('Select a product.');return;}
        if (!date.isValid) {setError(date.errorReason || 'Choose a valid deadline.');return;}
        const next=await planning.generate(product.id,country,deadline);
        if(next)setSelectedStage(next.stages.findIndex(s=>s.price<next.currentPrice && s.openingStock>0));
    };
    return <div className="space-y-5 text-[var(--theme-text-primary)]">
        <header><h3 className="text-lg font-semibold">Clearance planner</h3><p className="mt-1 text-sm text-[var(--theme-text-secondary)]">Compare price stages against a deadline, then propose one price for approval.</p></header>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
            <section aria-label="Clearance parameters" className="min-w-0 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-4 space-y-4">
                <form onSubmit={e=>{e.preventDefault();setQuery(search.trim());setPage(1);setSelectedId('');planning.clear();}}>
                    <label htmlFor="markdown-search" className="block text-sm font-medium mb-2">Find a product</label>
                    <div className="flex gap-2"><input id="markdown-search" type="search" placeholder="Product name or SKU" value={search} onChange={e=>setSearch(e.target.value)} className={control}/><button type="submit" className={button} aria-label="Search products"><Search size={18}/></button></div>
                </form>
                {catalog.isFetching && <p role="status" className="text-sm">Loading products…</p>}
                {catalog.isError && <div role="alert" className="text-sm"><p>Products could not be loaded.</p><button type="button" className={button} onClick={()=>catalog.refetch()}>Retry products</button></div>}
                <label htmlFor="markdown-product" className="block text-sm font-medium">Product</label>
                <select id="markdown-product" className={control} value={selectedId} disabled={catalog.isFetching || busy || planning.busy} onChange={e=>{setSelectedId(e.target.value);planning.clear();setError('');}}>
                    <option value="">Select a product</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} · {p.sku} · {productSiteName(p,sites || [])} · {Math.round(p.stock)} units</option>)}
                </select>
                {!catalog.isFetching && !catalog.isError && !products.length && <p className="text-sm text-[var(--theme-text-secondary)]">No matching products. Try another name or SKU.</p>}
                {(catalog.data?.count || 0)>25 && <nav aria-label="Product pages" className="flex items-center justify-between gap-2 text-sm"><button type="button" className={button} disabled={page===1 || catalog.isFetching || busy || planning.busy} onClick={()=>{setPage(page-1);setSelectedId('');}}>Previous</button><span>{page} / {Math.ceil((catalog.data?.count || 0)/25)}</span><button type="button" className={button} disabled={page*25>=(catalog.data?.count || 0) || catalog.isFetching || busy || planning.busy} onClick={()=>{setPage(page+1);setSelectedId('');}}>Next</button></nav>}
                {product && <dl className="space-y-2 text-sm border-y border-[var(--theme-border)] py-3">
                    {[["Facility",productSiteName(product,sites || [])],["On-hand stock",`${Math.round(product.stock)} ${product.unit || 'units'}`],["Current selling price",money(price)],["Recorded cost",Number.isFinite(product.costPrice) ? money(product.costPrice!) : 'Unavailable'],["Recorded expiry",product.expiryDate || 'Not recorded']].map(([label,value])=><div key={label} className="flex flex-wrap justify-between gap-2"><dt className="text-[var(--theme-text-secondary)]">{label}</dt><dd className="tabular-nums break-words">{value}</dd></div>)}
                </dl>}
                <p className="text-sm text-[var(--theme-text-secondary)]">Recorded cost is checked privately by the server, including when your role cannot view it. Planning uses the complete 30-day completed-sales window for this product and facility.</p>
                <div><label htmlFor="markdown-deadline" className="block text-sm font-medium mb-2">Target exit date</label><input id="markdown-deadline" type="date" className={control} value={deadline} min={tomorrow} disabled={busy || planning.busy} aria-describedby={(error || planning.error) ? 'markdown-error' : undefined} aria-invalid={!!error || !!planning.error} onChange={e=>{setDeadline(e.target.value);planning.clear();setError('');}}/></div>
                {(error || planning.error) && <p id="markdown-error" role="alert" className="text-sm">{error || planning.error}</p>}
                <button type="button" onClick={generate} disabled={!product || catalog.isFetching || busy || planning.busy} className={`${button} w-full bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] flex items-center justify-center gap-2`}><Calculator size={18}/>{planning.busy ? 'Generating…' : 'Generate plan'}</button>
            </section>
            <div className="xl:col-span-2 min-w-0 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-4 space-y-4">
                {plan ? <MarkdownPlanResults plan={plan} currency={currency} currentPrice={plan.currentPrice} selectedStage={selectedStage} onSelectStage={setSelectedStage}/> : <p role="status" className="py-12 text-center text-sm text-[var(--theme-text-secondary)]">{'Choose a product and deadline to review a clearance plan.'}</p>}
                {plan && product && <div className="border-t border-[var(--theme-border)] pt-4 space-y-3">
                    <p className="text-sm">Only the selected price is submitted. Existing Operations, Supply Chain, Merchandising and any required Finance approvals still apply. Future stages are not scheduled.</p>
                    {pending.isError && <p role="alert" className="text-sm">Approval status is unavailable. <button type="button" className={button} onClick={()=>pending.refetch()}>Retry approval check</button></p>}
                    {pendingEdit && <p role="status" className="text-sm">This product has a pending edit. Review the existing request before proposing another price.</p>}
                    {!confirmed && !pending.isError && <p role="status" className="text-sm">Checking pending approvals…</p>}
                    {selectedStage<0 && <p className="text-sm">No eligible lower price in this plan. The current selling price, recorded cost or remaining stock prevents a further markdown.</p>}
                    {feedback && <p role={feedback.saved ? 'status' : 'alert'} className="text-sm">{feedback.message}</p>}
                    {(pendingEdit || feedback?.saved) && <button type="button" className={button} disabled={busy || catalog.isFetching || pending.isFetching} onClick={async()=>{planning.clear();await catalog.refetch();await refresh();}}>Refresh product and approval status</button>}
                    <button type="button" className={`${button} w-full sm:w-auto flex items-center justify-center gap-2`} disabled={!stage || planning.busy || !confirmed || pendingEdit || busy || !!feedback?.saved || catalog.isFetching} onClick={()=>stage && plan && send(plan,selectedStage)}><Send size={18}/>{busy ? 'Submitting…' : `Submit selected price for approval${stage ? ` · ${money(stage.price)}` : ''}`}</button>
                </div>}
            </div>
        </div>
    </div>;
}
