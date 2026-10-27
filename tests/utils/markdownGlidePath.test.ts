import { describe, it, expect } from 'vitest';
import {
    validateMarkdownProduct,
    validateTargetExitDate,
    calculateMarkdownGlidePath
} from '../../utils/markdownGlidePath';
import type { Product } from '../../types';
import type { ProductSalesMetrics } from '../../utils/merchandisingAnalytics';

describe('Markdown Clearance Glide Path Engine', () => {
    const validProduct: Product = {
        id: 'prod-clearance-01',
        name: 'Sunflower Cooking Oil 3L',
        sku: 'ET-OIL-03',
        category: 'Cooking Oils',
        price: 850,
        costPrice: 620,
        stock: 40,
        minStock: 10,
        unit: 'bottle',
        salesVelocity: 'Low',
        siteId: 'site-et-01',
        image: '',
        status: 'active'
    };

    const mockMetrics: ProductSalesMetrics = {
        productId: 'prod-clearance-01',
        unitsSold7d: 7,
        unitsSold30d: 30,
        revenue30d: 25500,
        dailyRunRate: 1.0,
        daysOfSupply: 40,
        effectiveVelocity: 'Low',
        hasOrderHistory: true,
        stockoutRisk: false,
        needsMarkdown: true
    };

    const now = new Date(2026,9,28,12);

    describe('Finding 1: Target Exit Date Calculation & Validation', () => {
        it('rejects empty or missing target exit date', () => {
            const resEmpty = validateTargetExitDate('', now);
            expect(resEmpty.isValid).toBe(false);
            expect(resEmpty.errorReason).toContain('Please select a target exit date');

            const resWhitespace = validateTargetExitDate('   ', now);
            expect(resWhitespace.isValid).toBe(false);
        });

        it('rejects past or today dates', () => {
            const resPast = validateTargetExitDate('2026-10-25', now);
            expect(resPast.isValid).toBe(false);
            expect(resPast.errorReason).toContain('must be in the future');

            const resToday = validateTargetExitDate('2026-10-28', now);
            expect(resToday.isValid).toBe(false);
            expect(resToday.errorReason).toContain('must be in the future');
        });

        it('dynamically calculates stages from deadline (short vs long horizon)', () => {
            // Short horizon: 4 days -> 4 daily stages
            const sim4d = calculateMarkdownGlidePath({
                product: validProduct,
                targetExitDate: '2026-11-01',
                metrics: mockMetrics,
                now
            });
            expect(sim4d).not.toBeNull();
            expect(sim4d!.durationDays).toBe(4);
            expect(sim4d!.stages.length).toBe(4);
            expect(sim4d!.stages[0].week).toBe('Day 1');

            // 3-week horizon (21 days) -> 3 weekly stages
            const sim3w = calculateMarkdownGlidePath({
                product: validProduct,
                targetExitDate: '2026-11-18',
                metrics: mockMetrics,
                now
            });
            expect(sim3w).not.toBeNull();
            expect(sim3w!.durationDays).toBe(21);
            expect(sim3w!.stages.length).toBe(3);
            expect(sim3w!.stages[0].week).toBe('Week 1');

            // 6-week horizon (42 days) -> 6 weekly stages
            const sim6w = calculateMarkdownGlidePath({
                product: validProduct,
                targetExitDate: '2026-12-09',
                metrics: mockMetrics,
                now
            });
            expect(sim6w).not.toBeNull();
            expect(sim6w!.durationDays).toBe(42);
            expect(sim6w!.stages.length).toBe(6);
        });
    });

    describe('Finding 2: Verified Stock & Cost, No Invented Assumptions', () => {
        it('rejects products with zero or negative stock', () => {
            const zeroStockProd = { ...validProduct, stock: 0 };
            const validation = validateMarkdownProduct(zeroStockProd, mockMetrics);
            expect(validation.isValid).toBe(false);
            expect(validation.missingFields).toContain('stock');

            const sim = calculateMarkdownGlidePath({
                product: zeroStockProd,
                targetExitDate: '2026-11-28',
                metrics: mockMetrics,
                now
            });
            expect(sim).toBeNull();
        });

        it('rejects products with missing or non-positive cost price (no fabricated 70% cost)', () => {
            const noCostProd: Product = { ...validProduct, costPrice: undefined };
            const validation = validateMarkdownProduct(noCostProd, mockMetrics);
            expect(validation.isValid).toBe(false);
            expect(validation.missingFields).toContain('costPrice');

            const sim = calculateMarkdownGlidePath({
                product: noCostProd,
                targetExitDate: '2026-11-28',
                metrics: mockMetrics,
                now
            });
            expect(sim).toBeNull();
        });

        it('does NOT force final stock to zero if demand is insufficient', () => {
            // Product with 100 units, but run rate is low (0.5 units/day over 14 days)
            const slowProduct: Product = {
                ...validProduct,
                stock: 100
            };
            const slowMetrics: ProductSalesMetrics = {
                ...mockMetrics,
                dailyRunRate: 0.5
            };

            const sim = calculateMarkdownGlidePath({
                product: slowProduct,
                targetExitDate: '2026-11-11', // 14 days
                metrics: slowMetrics,
                now
            });

            expect(sim).not.toBeNull();
            expect(sim!.finalRemainingStock).toBeGreaterThan(0);
            expect(sim!.isFullyCleared).toBe(false);
            expect(sim!.stages[sim!.stages.length - 1].stock).toBe(sim!.finalRemainingStock);
        });
    });

    describe('Finding 7: Consistent Financial Engine & Whole-Number Rule', () => {
        it('ensures opening stock, projected sales, and closing stock align across all stages', () => {
            const sim = calculateMarkdownGlidePath({
                product: validProduct,
                targetExitDate: '2026-11-28', // 31 days
                metrics: mockMetrics,
                now
            });

            expect(sim).not.toBeNull();
            let expectedOpening = validProduct.stock;
            let expectedCumRev = 0;

            for (const stage of sim!.stages) {
                expect(stage.openingStock).toBe(expectedOpening);
                expect(stage.closingStock).toBe(stage.openingStock - stage.projectedSales);
                expect(stage.stock).toBe(stage.closingStock);
                expect(stage.stageRevenue).toBe(stage.projectedSales * stage.price);

                expectedCumRev += stage.stageRevenue;
                expect(stage.revenue).toBe(expectedCumRev);

                expectedOpening = stage.closingStock;
            }

            expect(sim!.projectedTotalRevenue).toBe(expectedCumRev);
            expect(sim!.finalRemainingStock).toBe(expectedOpening);
        });

        it('enforces cost floor and displays actual discount rather than target discount when capped', () => {
            // Price: 1000, Cost: 900.
            // A 35% discount would be 650, which violates 900 cost floor.
            // Effective price must be 900, actual discount must be 10%, NOT 35%.
            const highCostProd: Product = {
                ...validProduct,
                price: 1000,
                costPrice: 900,
                stock: 50
            };

            const sim = calculateMarkdownGlidePath({
                product: highCostProd,
                targetExitDate: '2026-11-28',
                metrics: mockMetrics,
                now
            });

            expect(sim).not.toBeNull();
            for (const stage of sim!.stages) {
                expect(stage.price).toBeGreaterThanOrEqual(900);
                expect(stage.actualDiscountPct).toBeLessThanOrEqual(10);
                expect(stage.discount).toBe(`${stage.actualDiscountPct}%`);
            }
        });

        it('strictly adheres to whole-number rule for all prices, margins, revenues and discounts', () => {
            const sim = calculateMarkdownGlidePath({
                product: {
                    ...validProduct,
                    price: 333,
                    costPrice: 177,
                    stock: 37
                },
                targetExitDate: '2026-11-21',
                metrics: { ...mockMetrics, dailyRunRate: 1.33 },
                now
            });

            expect(sim).not.toBeNull();
            expect(Number.isInteger(sim!.projectedMarginPct)).toBe(true);
            expect(Number.isInteger(sim!.clearancePercentage)).toBe(true);
            expect(Number.isInteger(sim!.projectedTotalRevenue)).toBe(true);
            expect(Number.isInteger(sim!.totalLandedCost)).toBe(true);

            for (const stage of sim!.stages) {
                expect(Number.isInteger(stage.price)).toBe(true);
                expect(Number.isInteger(stage.actualDiscountPct)).toBe(true);
                expect(Number.isInteger(stage.projectedSales)).toBe(true);
                expect(Number.isInteger(stage.openingStock)).toBe(true);
                expect(Number.isInteger(stage.closingStock)).toBe(true);
                expect(Number.isInteger(stage.stageRevenue)).toBe(true);
                expect(Number.isInteger(stage.revenue)).toBe(true);
            }
        });
    });
});

describe('Clearance model boundary regressions',()=>{
 const product={id:'p',name:'Coffee',sku:'ET-CF',price:100,costPrice:65,stock:100,siteId:'site',status:'active'} as Product;
 const metrics={hasOrderHistory:true,dailyRunRate:0.2} as ProductSalesMetrics;
 const now=new Date(2026,9,28,12);
 it('does not invent demand uplift or extra rounding units across stages',()=>{
  const plan=calculateMarkdownGlidePath({product,metrics,now,targetExitDate:'2026-11-04'})!;
  expect(plan.totalProjectedSales).toBe(Math.round(0.2*7));
  expect(plan.stages.every(s=>s.openingStock-s.projectedSales===s.closingStock)).toBe(true);
 });
 it('supports a one-day horizon without zero-length stages',()=>{
  const plan=calculateMarkdownGlidePath({product,metrics,now,targetExitDate:'2026-10-29'})!;
  expect(plan.stages).toHaveLength(1);expect(plan.durationDays).toBe(1);expect(plan.stages[0].price).toBe(90);
 });
 it('rejects non-finite values, impossible dates and below-cost baselines',()=>{
  for(const patch of [{stock:NaN},{price:Infinity},{costPrice:NaN},{costPrice:101}]) expect(calculateMarkdownGlidePath({product:{...product,...patch},metrics,now,targetExitDate:'2026-11-04'})).toBeNull();
  expect(validateTargetExitDate('2026-02-30',now).isValid).toBe(false);
  expect(validateTargetExitDate('2028-01-01',now).isValid).toBe(false);
 });
 it('never raises an existing sale price or uses absent history as positive demand',()=>{
  const plan=calculateMarkdownGlidePath({product:{...product,isOnSale:true,salePrice:70},metrics:{...metrics,hasOrderHistory:false},now,targetExitDate:'2026-11-18'})!;
  expect(plan.stages.every(s=>s.price<=70 && s.price>=65)).toBe(true);expect(plan.totalProjectedSales).toBe(0);
 });
 it('calculates local calendar days independently of time of day and DST',()=>{
  expect(validateTargetExitDate('2026-10-05',new Date(2026,9,3,23,30)).durationDays).toBe(2);
 });
});
