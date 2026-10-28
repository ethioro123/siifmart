import React from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ServerMarkdownPlan } from '../../services/markdown-planning.service';
import type { MarkdownGlidePathSimulation } from '../../utils/markdownGlidePath';

export function MarkdownPlanResults({plan,currency,selectedStage,onSelectStage,currentPrice}:{
    plan:MarkdownGlidePathSimulation|ServerMarkdownPlan; currency:string; selectedStage:number; onSelectStage:(index:number)=>void; currentPrice:number;
}) {
    const money=(value:number)=>`${currency} ${value.toLocaleString()}`;
    const stage=plan.stages[selectedStage];
    const impact=stage && 'selectedImpact' in stage ? stage.selectedImpact : null;
    return <section aria-label="Clearance plan" className="min-w-0 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[["Estimated revenue",money(plan.projectedTotalRevenue)],["Estimated gross margin",plan.projectedMarginPct===null ? 'Restricted' : `${plan.projectedMarginPct}%`],["Remaining stock",`${plan.finalRemainingStock.toLocaleString()} units`]].map(([label,value])=><div key={label} className="min-w-0 rounded-xl border border-[var(--theme-border)] p-4"><p className="text-xs text-[var(--theme-text-secondary)]">{label}</p><p className="mt-1 font-semibold tabular-nums break-words">{value}</p></div>)}
        </div>
        {'asOf' in plan && <p className="text-xs text-[var(--theme-text-secondary)]">Sales window: {new Date(plan.windowStart).toLocaleString()} – {new Date(plan.asOf).toLocaleString()}. Completed sales: {plan.unitsSold30d.toLocaleString()} units. Deadline: {plan.deadline}.</p>}
        <p className="text-sm text-[var(--theme-text-secondary)]">Planning scenario over {plan.durationDays} days. Quantities follow the available 30-day sales baseline; discounts do not assume extra demand. Prices stop at recorded cost. Estimates are not a sell-through guarantee.</p>
        {impact && stage && <div aria-label="Selected price impact" className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] p-4 space-y-2">
            <h4 className="text-sm font-semibold">Selected price impact · {money(stage.price)}</h4>
            <p className="text-sm">If approved and applied now for the full planning horizon: estimated sales {impact.units.toLocaleString()} units, remaining {impact.remaining.toLocaleString()} units.</p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {[["Revenue at selected price",money(impact.revenue)],["Revenue at current price",money(impact.revenueAtCurrentPrice)],["Revenue difference",money(impact.revenue-impact.revenueAtCurrentPrice)],["Gross margin at selected price",impact.marginPct===null ? 'Restricted to authorized roles' : `${impact.marginPct}%`]].map(([label,value])=><div key={label}><dt className="text-[var(--theme-text-secondary)]">{label}</dt><dd className="font-medium tabular-nums">{value}</dd></div>)}
            </dl>
            <p className="text-xs text-[var(--theme-text-secondary)]">This compares the selected price with keeping the current price; demand is unchanged. Approval delays can reduce the remaining sales window. The staged schedule totals above describe a separate scenario.</p>
        </div>}
        <div role="region" aria-label="Markdown stages" tabIndex={0} className="overflow-x-auto rounded-xl border border-[var(--theme-border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-accent)]">
            <table className="w-full text-sm text-left whitespace-nowrap">
                <caption className="text-left p-3 font-medium">Select one price to propose. Future stages are a plan only.</caption>
                <thead className="bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)]"><tr>{['Stage / dates','Price','Discount','Opening','Est. sold','Remaining','Est. revenue'].map(label=><th key={label} scope="col" className="p-3 font-medium">{label}</th>)}</tr></thead>
                <tbody>{plan.stages.map((stage,index)=><tr key={index} className="border-t border-[var(--theme-border)]">
                    <th scope="row" className="p-3 font-normal"><label className="flex items-center gap-2 min-h-[44px] cursor-pointer"><input type="radio" name="markdown-stage" aria-label={`Select stage ${index+1}`} checked={selectedStage===index} disabled={stage.price>=currentPrice || stage.openingStock===0} onChange={()=>onSelectStage(index)} /><span>Stage {index+1}<span className="block text-xs text-[var(--theme-text-secondary)]">{stage.dateRangeLabel}</span></span></label></th>
                    {[money(stage.price),`${stage.actualDiscountPct}%`,stage.openingStock,stage.projectedSales,stage.closingStock,money(stage.stageRevenue)].map((value,i)=><td key={i} className="p-3 tabular-nums">{value}</td>)}
                </tr>)}</tbody>
            </table>
        </div>
        <details className="rounded-xl border border-[var(--theme-border)] p-3">
            <summary className="min-h-[44px] content-center cursor-pointer text-sm font-medium">View estimated stock trend</summary>
            <p className="text-xs text-[var(--theme-text-secondary)] mb-2">Closing stock in units. Exact values are available in the stage table.</p>
            <div className="h-52" aria-label="Estimated closing stock chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={plan.stages}>
                <CartesianGrid vertical={false} stroke="var(--theme-border)"/><XAxis dataKey="week" stroke="var(--theme-text-secondary)" fontSize={12}/><YAxis allowDecimals={false} stroke="var(--theme-text-secondary)" fontSize={12}/><Tooltip/><Area type="linear" dataKey="stock" name="Closing stock (units)" stroke="var(--theme-accent)" fill="var(--theme-bg-subtle)" isAnimationActive={false}/>
            </AreaChart></ResponsiveContainer></div>
        </details>
    </section>;
}
