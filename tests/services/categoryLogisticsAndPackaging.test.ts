import { describe, it, expect } from 'vitest';
import {
    getCategoryPackageContainers,
    getCategoryPackagingDefaults
} from '../../components/procurement/categoryPackaging';
import {
    getCategoryStorageDefaults,
    getCategoryMarginBenchmark,
    getCategoryProcurementMetrics
} from '../../components/procurement/categoryLogistics';

describe('Category Packaging & Logistics System', () => {
    describe('Dynamic Package Containers (getCategoryPackageContainers)', () => {
        it('returns domain-tailored containers for Fresh Produce', () => {
            const containers = getCategoryPackageContainers('Fruit & Vegetables');
            expect(containers).toContain('Ventilated Produce Crate / Tote');
            expect(containers).toContain('Waxed Corrugated Produce Carton');
            expect(containers).toContain('Mesh Breathable Sack / Bag');
            expect(containers).toContain('Reusable Plastic Container (RPC)');
        });

        it('returns domain-tailored containers for Beverages', () => {
            const containers = getCategoryPackageContainers('Drinks & Beverages');
            expect(containers).toContain('Corrugated Master Case (24-Pack)');
            expect(containers).toContain('Corrugated Shipper (12-Pack)');
            expect(containers).toContain('Shrink-Wrapped Heavy Tray');
            expect(containers).toContain('Stainless / Aluminium Beverage Keg');
        });

        it('returns domain-tailored containers for Electronics', () => {
            const containers = getCategoryPackageContainers('Electronics');
            expect(containers).toContain('Master Shipper Box (Heavy Corrugated)');
            expect(containers).toContain('Anti-Static Shielding Bag (ESD)');
            expect(containers).toContain('Drop-Tested Outer Logistics Carton');
        });

        it('returns domain-tailored containers for Apparel', () => {
            const containers = getCategoryPackageContainers('Clothing & Accessories');
            expect(containers).toContain('Individual Polybag (1:1 Retail)');
            expect(containers).toContain('Flat Pack Master Corrugated Carton');
            expect(containers).toContain('Wardrobe / Hanging Garment Carton');
        });

        it('returns standard corrugated containers for unmapped or generic categories', () => {
            const containers = getCategoryPackageContainers('Unclassified Goods');
            expect(containers).toContain('Master Corrugated Carton');
            expect(containers).toContain('Wholesale Case (12 / 24 Pack)');
        });
    });

    describe('Dynamic Packaging Hierarchy Presets (getCategoryPackagingDefaults)', () => {
        it('presets Beverage hierarchy to case with 24 units default', () => {
            const defaults = getCategoryPackagingDefaults('Drinks & Beverages');
            expect(defaults.defaultLevel).toBe('case');
            expect(defaults.defaultPackQty).toBe('24');
            expect(defaults.levelLabels?.case).toBe('Master Case (24-Pack)');
        });

        it('presets Electronics hierarchy to single 1:1 unit', () => {
            const defaults = getCategoryPackagingDefaults('Electronics');
            expect(defaults.defaultLevel).toBe('single');
            expect(defaults.defaultPackQty).toBe('1');
            expect(defaults.levelLabels?.single).toBe('Single Retail Box (1:1)');
        });

        it('presets Pantry Groceries hierarchy to wholesale case with 12 units', () => {
            const defaults = getCategoryPackagingDefaults('Grains, Pasta & Rice');
            expect(defaults.defaultLevel).toBe('case');
            expect(defaults.defaultPackQty).toBe('12');
            expect(defaults.levelLabels?.case).toBe('Wholesale Case (12 / 24)');
        });

        it('presets Fresh Produce hierarchy to produce crate/box', () => {
            const defaults = getCategoryPackagingDefaults('Fruit & Vegetables');
            expect(defaults.defaultLevel).toBe('case');
            expect(defaults.levelLabels?.case).toBe('Produce Crate / Box');
        });
    });

    describe('Dynamic Storage & Inbound QC Directives (getCategoryStorageDefaults)', () => {
        it('configures cold-chain storage and receiving thermal probe check for Fresh Produce', () => {
            const config = getCategoryStorageDefaults('fresh_produce');
            expect(config.defaultStorage).toBe('Chilled (0°C to 4°C)');
            expect(config.defaultPerishable).toBe(true);
            expect(config.defaultShelfLife).toBe('14');
            expect(config.inboundDirectives).toContain('Receiving door thermal probe check (< 4°C)');
            expect(config.inboundDirectives).toContain('Organoleptic visual freshness & rot inspection');
            expect(config.flags.some(f => f.id === 'coldChain' && f.isAlert)).toBe(true);
            expect(config.flags.some(f => f.id === 'isPerishable' && f.isAlert)).toBe(true);
        });

        it('configures frozen storage for Frozen Food', () => {
            const config = getCategoryStorageDefaults('frozen_food');
            expect(config.defaultStorage).toBe('Frozen (-18°C or below)');
            expect(config.defaultPerishable).toBe(true);
            expect(config.inboundDirectives.some(d => d.includes('-18°C'))).toBe(true);
            expect(config.flags.some(f => f.id === 'deepFreeze')).toBe(true);
        });

        it('configures high-theft cage and ESD directives for Electronics', () => {
            const config = getCategoryStorageDefaults('electronics');
            expect(config.defaultStorage).toBe('Ambient (Dry)');
            expect(config.defaultPerishable).toBe(false);
            expect(config.inboundDirectives).toContain('100% Serial / IMEI barcode verification scan');
            expect(config.flags.some(f => f.id === 'highTheft')).toBe(true);
            expect(config.flags.some(f => f.id === 'antiStatic')).toBe(true);
        });

        it('provides ambient defaults for general merchandise and apparel', () => {
            const configApparel = getCategoryStorageDefaults('apparel');
            expect(configApparel.defaultStorage).toBe('Ambient (Dry)');
            expect(configApparel.defaultPerishable).toBe(false);
            expect(configApparel.flags.some(f => f.id === 'hangingGarment')).toBe(true);

            const configGeneral = getCategoryStorageDefaults('general_merchandise');
            expect(configGeneral.defaultStorage).toBe('Ambient (Dry)');
            expect(configGeneral.defaultPerishable).toBe(false);
        });
    });

    describe('Dynamic Category Selling Margin Benchmarks (getCategoryMarginBenchmark)', () => {
        it('provides correct margin benchmarks across primary domains', () => {
            const electronics = getCategoryMarginBenchmark('electronics');
            expect(electronics.benchmarkPct).toBe(18);
            expect(electronics.minPct).toBe(12);
            expect(electronics.maxPct).toBe(25);

            const produce = getCategoryMarginBenchmark('fresh_produce');
            expect(produce.benchmarkPct).toBe(32);
            expect(produce.minPct).toBe(25);
            expect(produce.maxPct).toBe(42);

            const apparel = getCategoryMarginBenchmark('apparel');
            expect(apparel.benchmarkPct).toBe(55);
            expect(apparel.minPct).toBe(45);
            expect(apparel.maxPct).toBe(68);

            const beverages = getCategoryMarginBenchmark('beverages');
            expect(beverages.benchmarkPct).toBe(28);
            expect(beverages.minPct).toBe(20);
            expect(beverages.maxPct).toBe(35);

            const pantry = getCategoryMarginBenchmark('pantry_groceries');
            expect(pantry.benchmarkPct).toBe(20);
            expect(pantry.minPct).toBe(15);
            expect(pantry.maxPct).toBe(28);
        });

        it('resolves category string as well as domain identifier', () => {
            const produce = getCategoryMarginBenchmark('Fruit & Vegetables');
            expect(produce.benchmarkPct).toBe(32);
            expect(produce.benchmarkLabel).toContain('Fresh Produce Benchmark');

            const beverages = getCategoryMarginBenchmark('Drinks & Beverages');
            expect(beverages.benchmarkPct).toBe(28);
        });

        it('falls back to general merchandise benchmark for unknown domain', () => {
            const fallback = getCategoryMarginBenchmark('unknown_domain');
            expect(fallback.benchmarkPct).toBe(25);
            expect(fallback.minPct).toBe(18);
            expect(fallback.maxPct).toBe(35);
        });
    });

    describe('Dynamic Procurement & Order Quantity Metrics (getCategoryProcurementMetrics)', () => {
        it('calculates total liquid volume in Litres for Beverages', () => {
            const metrics = getCategoryProcurementMetrics('beverages', 10, 24, {
                physical: { netWeight: '500', sizeType: 'ml' }
            });
            // 10 cases * 24 units = 240 units * 500ml = 120,000ml = 120 Litres
            expect(metrics).toHaveLength(1);
            expect(metrics[0].label).toBe('Total Liquid Volume');
            expect(metrics[0].value).toBe('120 Litres');
        });

        it('calculates total intake weight and gate probe status for Fresh Produce', () => {
            const metrics = getCategoryProcurementMetrics('Fruit & Vegetables', 50, 1, {
                physical: { netWeight: '15', sizeType: 'kg' }
            });
            // 50 * 1 = 50 * 15kg = 750 kg
            expect(metrics.length).toBeGreaterThanOrEqual(2);
            expect(metrics[0].label).toBe('Total Intake Weight');
            expect(metrics[0].value).toBe('750 kg');
            expect(metrics[1].label).toBe('Freshness Intake');
            expect(metrics[1].value).toBe('Cold Chain Gate Probe Active');
        });

        it('reports serialized tracking requirements for Electronics', () => {
            const metrics = getCategoryProcurementMetrics('Electronics', 25, 1, {});
            expect(metrics).toHaveLength(1);
            expect(metrics[0].label).toBe('Serialized Units');
            expect(metrics[0].value).toBe('25 units tracking required');
        });

        it('reports garment units and size variant for Apparel', () => {
            const metrics = getCategoryProcurementMetrics('Clothing & Accessories', 100, 1, {
                categorySpecific: { apparelSize: 'XL' }
            });
            expect(metrics).toHaveLength(1);
            expect(metrics[0].label).toBe('Garment Units');
            expect(metrics[0].value).toBe('100 units (XL)');
        });

        it('returns empty metrics when order quantity is zero or negative', () => {
            const metrics = getCategoryProcurementMetrics('beverages', 0, 24, {});
            expect(metrics).toHaveLength(0);
        });
    });

    describe('Warehouse Inbound Receiving & Putaway Attribute Verification', () => {
        it('resolves Inbound QC directives and cold chain attributes for receiving perishable items', () => {
            const freshItem = {
                category: 'Fruit & Vegetables',
                customAttributes: {
                    storage: { inboundQcDirective: 'Receiving door thermal probe check (< 4°C)', type: 'Chilled (0°C to 4°C)', isPerishable: true },
                    packaging: { packageType: 'Ventilated Produce Crate / Tote' }
                }
            };
            const storage = getCategoryStorageDefaults(freshItem.category);
            const packaging = getCategoryPackagingDefaults(freshItem.category);

            expect(freshItem.customAttributes.storage.inboundQcDirective).toBe('Receiving door thermal probe check (< 4°C)');
            expect(storage.inboundDirectives).toContain('Receiving door thermal probe check (< 4°C)');
            expect(packaging.containers).toContain('Ventilated Produce Crate / Tote');
            expect(storage.defaultPerishable).toBe(true);
        });

        it('resolves serial verification and secure cage handling for electronics putaway', () => {
            const techItem = {
                category: 'Electronics',
                customAttributes: {
                    storage: { type: 'Ambient (Dry)', highTheft: true, serialTracked: true },
                    packaging: { packageType: 'Master Shipper Box (Heavy Corrugated)' }
                }
            };
            const storage = getCategoryStorageDefaults(techItem.category);
            const packaging = getCategoryPackagingDefaults(techItem.category);

            expect(storage.inboundDirectives).toContain('100% Serial / IMEI barcode verification scan');
            expect(packaging.containers).toContain('Master Shipper Box (Heavy Corrugated)');
            expect(storage.flags.some(f => f.id === 'highTheft')).toBe(true);
        });
    });
});

