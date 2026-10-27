import type { Product } from '../types';
import type { ProductSalesMetrics } from './merchandisingAnalytics';

export interface GlidePathStage {
    stageIndex: number;
    week: string; // e.g. "Week 1", "Week 2"
    dateRangeLabel: string; // e.g. "Oct 28 - Nov 04"
    openingStock: number;
    projectedSales: number;
    closingStock: number;
    stock: number; // Consistently closingStock for plotting drawdown
    price: number; // Whole number integer (cost-capped)
    targetDiscountPct: number;
    actualDiscountPct: number; // Whole number integer based on effective price
    discount: string; // e.g. "10%"
    stageRevenue: number; // Whole number integer
    revenue: number; // Cumulative revenue (whole number integer)
}

export interface MarkdownValidationResult {
    isValid: boolean;
    missingFields: string[];
    reasons: string[];
    hasZeroVelocity: boolean;
}

export interface MarkdownGlidePathSimulation {
    stages: GlidePathStage[];
    initialStock: number;
    totalProjectedSales: number;
    finalRemainingStock: number;
    isFullyCleared: boolean;
    clearancePercentage: number; // Integer: Math.round((totalProjectedSales / initialStock) * 100)
    projectedTotalRevenue: number;
    totalLandedCost: number;
    projectedMarginPct: number; // Integer: Math.round(...)
    durationDays: number;
    numStages: number;
}

/**
 * Validates whether a product has verified stock, landed cost (COGS),
 * retail price, and sales velocity data for markdown modeling.
 */
export const validateMarkdownProduct = (product: Product | null, metrics?: ProductSalesMetrics | null): MarkdownValidationResult => {
    const missingFields: string[] = [], reasons: string[] = [];
    if (!product) return { isValid:false, missingFields:['product'], reasons:['Select a product.'], hasZeroVelocity:true };
    for (const [field, value, label] of [
        ['stock', product.stock, 'On-hand stock'], ['price', product.price, 'Regular price'],
        ['costPrice', product.costPrice, 'Recorded cost']
    ] as const) {
        if (value === undefined || !Number.isFinite(value) || Math.round(value) <= 0) {
            missingFields.push(field); reasons.push(field==='costPrice' ? 'A positive recorded cost must be available to this account. No estimated cost will be substituted.' : `${label} must be a recorded positive number.`);
        }
    }
    if (product.costPrice && Math.round(product.costPrice) > Math.round(product.price)) {
        missingFields.push('costPrice'); reasons.push('Recorded cost exceeds regular price. Resolve pricing before clearance.');
    }
    if (product.status === 'archived' || (product.isOnSale && (Math.round(product.salePrice || 0)<Math.round(product.costPrice || 0) || !Number.isFinite(product.salePrice) || !product.salePrice || product.salePrice <= 0 || product.salePrice > product.price))) {
        missingFields.push('status'); reasons.push('Archived products or invalid current sale prices cannot be planned.');
    }
    return { isValid:missingFields.length===0, missingFields, reasons,
        hasZeroVelocity:!metrics?.hasOrderHistory || !Number.isFinite(metrics.dailyRunRate) || metrics.dailyRunRate <= 0 };
};

/** Calendar-day arithmetic avoids UTC input parsing and daylight-saving offsets. */
export const localDateInput = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const validateTargetExitDate = (targetExitDate: string, now: Date = new Date()): { isValid:boolean; durationDays:number; errorReason?:string } => {
    if (!targetExitDate.trim()) return {isValid:false,durationDays:0,errorReason:'Please select a target exit date.'};
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(targetExitDate);
    if (!match) return {isValid:false,durationDays:0,errorReason:'Invalid date format.'};
    const [,y,m,d] = match.map(Number);
    const target = new Date(Date.UTC(y,m-1,d));
    if (target.getUTCFullYear()!==y || target.getUTCMonth()!==m-1 || target.getUTCDate()!==d) return {isValid:false,durationDays:0,errorReason:'Invalid date format.'};
    const durationDays = Math.round((target.getTime()-Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()))/86400000);
    if (durationDays<=0) return {isValid:false,durationDays:0,errorReason:'Target exit date must be in the future (minimum 1 day).'};
    if (durationDays>365) return {isValid:false,durationDays:0,errorReason:'Choose a deadline within 365 days.'};
    return {isValid:true,durationDays};
};

/** Baseline scenario only: discounts do not imply an unmeasured increase in demand. */
export const calculateMarkdownGlidePath = ({ product, targetExitDate, metrics, now=new Date() }: {
    product:Product; targetExitDate:string; metrics?:ProductSalesMetrics|null; now?:Date;
}): MarkdownGlidePathSimulation|null => {
    if (!validateMarkdownProduct(product,metrics).isValid) return null;
    const date=validateTargetExitDate(targetExitDate,now);
    if (!date.isValid) return null;
    const {durationDays}=date;
    const initialStock=Math.round(product.stock), retailPrice=Math.round(product.price), costPrice=Math.round(product.costPrice!);
    const currentPrice=Math.round(product.isOnSale ? product.salePrice! : product.price);
    const numStages=durationDays<=7 ? durationDays : Math.min(8,Math.max(2,Math.round(durationDays/7)));
    const nominalDiscounts=[0,10,20,35,50,60,70,75];
    const stages:GlidePathStage[]=[];
    let openingStock=initialStock, revenue=0, previousDemand=0;
    const rate=metrics?.hasOrderHistory && Number.isFinite(metrics.dailyRunRate) ? Math.max(0,metrics.dailyRunRate) : 0;
    const start=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate());
    const formatDate=(offset:number)=>new Date(start+offset*86400000).toLocaleDateString(undefined,{month:'short',day:'numeric',timeZone:'UTC'});
    for (let i=0;i<numStages;i++) {
        const begin=Math.round(i*durationDays/numStages), end=Math.round((i+1)*durationDays/numStages);
        const targetDiscountPct=numStages===1 ? 10 : nominalDiscounts[i];
        const price=Math.min(currentPrice,Math.max(costPrice,Math.round(retailPrice*(1-targetDiscountPct/100))));
        // Accumulate demand before rounding so splitting into stages does not create extra units.
        const demand=Math.round(rate*end), projectedSales=Math.min(openingStock,Math.max(0,demand-previousDemand));
        previousDemand=demand;
        const closingStock=openingStock-projectedSales, stageRevenue=projectedSales*price;
        revenue+=stageRevenue;
        const actualDiscountPct=Math.round((retailPrice-price)/retailPrice*100);
        stages.push({stageIndex:i,week:durationDays<=7 ? `Day ${i+1}` : `Week ${i+1}`,dateRangeLabel:`${formatDate(begin)} – ${formatDate(end)}`,
            openingStock,projectedSales,closingStock,stock:closingStock,price,targetDiscountPct,actualDiscountPct,discount:`${actualDiscountPct}%`,stageRevenue,revenue});
        openingStock=closingStock;
    }
    const totalProjectedSales=initialStock-openingStock, totalLandedCost=totalProjectedSales*costPrice;
    return {stages,initialStock,totalProjectedSales,finalRemainingStock:openingStock,isFullyCleared:openingStock===0,
        clearancePercentage:Math.round(totalProjectedSales/initialStock*100),projectedTotalRevenue:revenue,totalLandedCost,
        projectedMarginPct:revenue ? Math.round((revenue-totalLandedCost)/revenue*100) : 0,durationDays,numStages};
};
