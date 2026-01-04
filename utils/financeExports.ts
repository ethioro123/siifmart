/**
 * Finance-Specific Export Utilities
 * PDF P&L Reports and Excel Expense Reports
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { SaleRecord, ExpenseRecord, Employee } from '../types';
import { CURRENCY_SYMBOL } from '../constants';
import { formatDateTime } from './formatting';

/**
 * Export Profit & Loss Statement as PDF
 */
export function exportPnLToPDF(
    sales: SaleRecord[],
    expenses: ExpenseRecord[],
    employees: Employee[],
    taxData: {
        region: string;
        rate: number;
        estimatedLiability: number;
        inputTaxCredit: number;
        netTaxPayable: number;
    },
    filename: string = 'profit_loss_statement.pdf'
) {
    const doc = new jsPDF();

    // Calculate metrics
    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
    const totalRefunds = sales.filter(s => s.status === 'Refunded').reduce((sum, s) => sum + s.total, 0);
    const netRevenue = totalRevenue - totalRefunds;

    const totalSalaries = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
    const totalOpEx = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = totalSalaries + totalOpEx;

    const netProfit = netRevenue - totalExpenses - taxData.netTaxPayable;
    const profitMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

    // Header
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('PROFIT & LOSS STATEMENT', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${formatDateTime(new Date(), { showTime: true })}`, 105, 28, { align: 'center' });
    doc.text(`Tax Region: ${taxData.region} (${taxData.rate}%)`, 105, 34, { align: 'center' });

    // Revenue Section
    let yPos = 50;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('REVENUE', 14, yPos);

    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const revenueData = [
        ['Gross Sales', `${CURRENCY_SYMBOL} ${totalRevenue.toLocaleString()}`],
        ['Less: Refunds & Returns', `(${CURRENCY_SYMBOL} ${totalRefunds.toLocaleString()})`],
        ['Net Revenue', `${CURRENCY_SYMBOL} ${netRevenue.toLocaleString()}`]
    ];

    autoTable(doc, {
        startY: yPos,
        head: [],
        body: revenueData,
        theme: 'plain',
        styles: { fontSize: 10 },
        columnStyles: {
            0: { cellWidth: 140 },
            1: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
        }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Expenses Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('OPERATING EXPENSES', 14, yPos);

    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Group expenses by category
    const expensesByCategory = expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
    }, {} as Record<string, number>);

    const expenseData = [
        ['Payroll & Salaries', `${CURRENCY_SYMBOL} ${totalSalaries.toLocaleString()}`],
        ...Object.entries(expensesByCategory).map(([cat, amt]) => [cat, `${CURRENCY_SYMBOL} ${amt.toLocaleString()}`]),
        ['Total Operating Expenses', `${CURRENCY_SYMBOL} ${totalExpenses.toLocaleString()}`]
    ];

    autoTable(doc, {
        startY: yPos,
        head: [],
        body: expenseData,
        theme: 'plain',
        styles: { fontSize: 10 },
        columnStyles: {
            0: { cellWidth: 140 },
            1: { cellWidth: 40, halign: 'right' }
        }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Tax Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX CALCULATION', 14, yPos);

    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const taxDataTable = [
        ['Estimated Tax Liability', `${CURRENCY_SYMBOL} ${taxData.estimatedLiability.toLocaleString()}`],
        ['Less: Input Tax Credit', `(${CURRENCY_SYMBOL} ${taxData.inputTaxCredit.toLocaleString()})`],
        ['Net Tax Payable', `${CURRENCY_SYMBOL} ${taxData.netTaxPayable.toLocaleString()}`]
    ];

    autoTable(doc, {
        startY: yPos,
        head: [],
        body: taxDataTable,
        theme: 'plain',
        styles: { fontSize: 10 },
        columnStyles: {
            0: { cellWidth: 140 },
            1: { cellWidth: 40, halign: 'right' }
        }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Net Profit Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(0, 255, 157);
    doc.rect(14, yPos - 5, 182, 20, 'F');

    doc.setTextColor(0, 0, 0);
    doc.text('NET PROFIT', 20, yPos + 5);
    doc.text(`${CURRENCY_SYMBOL} ${netProfit.toLocaleString()}`, 190, yPos + 5, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Profit Margin: ${profitMargin.toFixed(2)}%`, 20, yPos + 12);

    // Footer
    doc.setTextColor(128, 128, 128);
    doc.setFontSize(8);
    doc.text('This is a computer-generated document. No signature required.', 105, 280, { align: 'center' });

    // Save
    doc.save(filename);
}

/**
 * Export Expenses to Excel
 */
export function exportExpensesToExcel(
    expenses: ExpenseRecord[],
    filename: string = 'expenses_report.xlsx'
) {
    // Prepare main data
    const data = expenses.map(exp => ({
        'Date': formatDateTime(exp.date),
        'Category': exp.category,
        'Description': exp.description,
        'Amount': exp.amount,
        'Status': exp.status,
        'Approved By': exp.approvedBy || 'Pending',
        'Site ID': exp.siteId
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
        { wch: 12 }, // Date
        { wch: 15 }, // Category
        { wch: 40 }, // Description
        { wch: 12 }, // Amount
        { wch: 10 }, // Status
        { wch: 15 }, // Approved By
        { wch: 15 }  // Site ID
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');

    // Add summary sheet
    const totalByCategory = expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
    }, {} as Record<string, number>);

    const totalByStatus = expenses.reduce((acc, exp) => {
        acc[exp.status] = (acc[exp.status] || 0) + exp.amount;
        return acc;
    }, {} as Record<string, number>);

    const summary = [
        ['EXPENSE SUMMARY'],
        [''],
        ['Total Expenses', expenses.reduce((sum, e) => sum + e.amount, 0)],
        ['Number of Transactions', expenses.length],
        ['Average Expense', expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length],
        [''],
        ['BY CATEGORY'],
        ...Object.entries(totalByCategory).map(([cat, amt]) => [cat, amt]),
        [''],
        ['BY STATUS'],
        ...Object.entries(totalByStatus).map(([status, amt]) => [status, amt]),
        [''],
        ['BY MONTH'],
    ];

    // Group by month
    const byMonth = expenses.reduce((acc, exp) => {
        const month = formatDateTime(exp.date, { includeYear: true }).split(' ').slice(0, 2).join(' '); // Rough approximation for "Month Year"
        acc[month] = (acc[month] || 0) + exp.amount;
        return acc;
    }, {} as Record<string, number>);

    summary.push(...Object.entries(byMonth).map(([month, amt]) => [month, amt]));

    const summaryWs = XLSX.utils.aoa_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Save file
    XLSX.writeFile(wb, filename);
}

/**
 * Export Cash Flow Projection to Excel
 */
export function exportCashFlowToExcel(
    projections: Array<{
        date: string;
        inflow: number;
        outflow: number;
        netCashFlow: number;
        cumulativeCash: number;
    }>,
    filename: string = 'cashflow_projection.xlsx'
) {
    const data = projections.map(p => ({
        'Date': formatDateTime(p.date),
        'Cash Inflow': p.inflow,
        'Cash Outflow': p.outflow,
        'Net Cash Flow': p.netCashFlow,
        'Cumulative Cash': p.cumulativeCash
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 18 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cash Flow Projection');

    XLSX.writeFile(wb, filename);
}
