import { exportSovereignBankFile, exportSovereignTaxFiling, CountryTaxConfig } from './financialsHelpers';
import { generateQuarterlyReport } from '../utils/reportGenerator';
import { Employee } from '../types';
import { Country } from '../utils/localization';

export function exportPnLReportJson(params: {
    activeCountry: Country;
    currencySymbol: string;
    totalRevenue: number;
    totalRefunds: number;
    totalOpEx: number;
    totalSalaries: number;
    currentTaxConfig: CountryTaxConfig;
    netTaxPayable: number;
    netProfit: number;
    profitMargin: number;
}) {
    const data = {
        country: params.activeCountry,
        currency: params.currencySymbol,
        reportDate: new Date().toISOString(),
        metrics: {
            totalRevenue: params.totalRevenue,
            totalRefunds: params.totalRefunds,
            totalExpenses: {
                operating: params.totalOpEx,
                payroll: params.totalSalaries
            },
            tax: {
                authority: params.currentTaxConfig.authority,
                taxName: params.currentTaxConfig.taxName,
                rate: params.currentTaxConfig.rate,
                estimatedLiability: params.netTaxPayable
            },
            netProfit: params.netProfit,
            profitMargin: `${params.profitMargin.toFixed(1)}%`
        }
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `siifmart_${params.activeCountry.toLowerCase()}_pnl_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function exportTaxDeclarationFile(params: {
    activeCountry: Country;
    currencySymbol: string;
    currentTaxConfig: CountryTaxConfig;
    totalRevenue: number;
    totalRefunds: number;
    totalOpEx: number;
    estimatedTaxLiability: number;
    inputTaxCredit: number;
    netTaxPayable: number;
}): string {
    return exportSovereignTaxFiling(params.activeCountry, params.currencySymbol, params.currentTaxConfig, {
        totalRevenue: params.totalRevenue,
        totalRefunds: params.totalRefunds,
        totalOpEx: params.totalOpEx,
        estimatedTaxLiability: params.estimatedTaxLiability,
        inputTaxCredit: params.inputTaxCredit,
        netTaxPayable: params.netTaxPayable
    });
}

export function exportBankDisbursementFile(params: {
    activeCountry: Country;
    currencySymbol: string;
    employees: Employee[];
    calculateEmployeeBonus: (emp: Employee) => number;
}): string {
    return exportSovereignBankFile(params.activeCountry, params.currencySymbol, params.employees, params.calculateEmployeeBonus);
}

export function generateQuarterlyPdf(params: {
    totalRevenue: number;
    totalExpenses: number;
    totalRefunds: number;
    netProfit: number;
    profitMargin: number;
    totalSalaries: number;
    totalOpEx: number;
    dateRangeLabel: string;
}) {
    const reportMetrics = {
        totalRevenue: params.totalRevenue,
        totalExpenses: params.totalExpenses,
        totalRefunds: params.totalRefunds,
        netProfit: params.netProfit,
        profitMargin: params.profitMargin.toFixed(1) + '%',
        totalSalaries: params.totalSalaries,
        totalOpEx: params.totalOpEx
    };
    generateQuarterlyReport(reportMetrics, params.dateRangeLabel, 'Financials');
}
