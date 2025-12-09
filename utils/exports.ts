/**
 * Export Utilities
 * PDF, Excel, and CSV export functions
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { SaleRecord, Product, Site } from '../types';
import { CURRENCY_SYMBOL } from '../constants';

/**
 * Export sales to PDF
 */
export function exportSalesToPDF(sales: SaleRecord[], filename: string = 'sales_report.pdf') {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text('Sales Report', 14, 20);

    // Add metadata
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Transactions: ${sales.length}`, 14, 36);
    doc.text(`Total Revenue: ${CURRENCY_SYMBOL}${sales.reduce((sum, s) => sum + s.total, 0).toLocaleString()}`, 14, 42);

    // Prepare table data
    const tableData = sales.map(sale => [
        sale.id.substring(0, 8),
        new Date(sale.date).toLocaleDateString(),
        sale.cashierName || 'Unknown',
        sale.method,
        `${CURRENCY_SYMBOL}${sale.total.toFixed(2)}`,
        sale.status
    ]);

    // Add table
    autoTable(doc, {
        startY: 50,
        head: [['Receipt ID', 'Date', 'Cashier', 'Method', 'Total', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [0, 255, 157], textColor: [0, 0, 0] },
        styles: { fontSize: 8 }
    });

    // Save PDF
    doc.save(filename);
}

/**
 * Export sales to Excel
 */
export function exportSalesToExcel(sales: SaleRecord[], filename: string = 'sales_report.xlsx') {
    // Prepare data
    const data = sales.map(sale => ({
        'Receipt ID': sale.id,
        'Date': new Date(sale.date).toLocaleString(),
        'Store': sale.siteId || 'N/A',
        'Cashier': sale.cashierName || 'Unknown',
        'Payment Method': sale.method,
        'Items': sale.items.length,
        'Subtotal': sale.subtotal,
        'Tax': sale.tax,
        'Total': sale.total,
        'Status': sale.status,
        'Customer ID': sale.customerId || 'N/A'
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
        { wch: 15 }, // Receipt ID
        { wch: 20 }, // Date
        { wch: 15 }, // Store
        { wch: 15 }, // Cashier
        { wch: 15 }, // Payment Method
        { wch: 8 },  // Items
        { wch: 12 }, // Subtotal
        { wch: 10 }, // Tax
        { wch: 12 }, // Total
        { wch: 12 }, // Status
        { wch: 15 }  // Customer ID
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');

    // Add summary sheet
    const summary = [
        ['Sales Summary'],
        [''],
        ['Total Transactions', sales.length],
        ['Total Revenue', sales.reduce((sum, s) => sum + s.total, 0)],
        ['Average Transaction', sales.reduce((sum, s) => sum + s.total, 0) / sales.length],
        [''],
        ['By Payment Method'],
        ['Cash', sales.filter(s => s.method === 'Cash').length],
        ['Card', sales.filter(s => s.method === 'Card').length],
        ['Mobile Money', sales.filter(s => s.method === 'Mobile Money').length],
        [''],
        ['By Status'],
        ['Completed', sales.filter(s => s.status === 'Completed').length],
        ['Pending', sales.filter(s => s.status === 'Pending').length],
        ['Refunded', sales.filter(s => s.status === 'Refunded').length]
    ];

    const summaryWs = XLSX.utils.aoa_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Save file
    XLSX.writeFile(wb, filename);
}

/**
 * Export inventory to Excel
 */
export function exportInventoryToExcel(
    sites: Site[],
    products: Product[],
    filename: string = 'inventory_report.xlsx'
) {
    const wb = XLSX.utils.book_new();

    // Create a sheet for each site
    sites.forEach(site => {
        const siteProducts = products.filter(p => p.siteId === site.id || p.site_id === site.id);

        const data = siteProducts.map(product => ({
            'SKU': product.sku,
            'Name': product.name,
            'Category': product.category,
            'Stock': product.stock,
            'Price': product.price,
            'Value': product.stock * product.price,
            'Location': product.location || 'N/A',
            'Status': product.status,
            'Expiry Date': product.expiryDate || 'N/A'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        ws['!cols'] = [
            { wch: 15 }, // SKU
            { wch: 30 }, // Name
            { wch: 15 }, // Category
            { wch: 10 }, // Stock
            { wch: 10 }, // Price
            { wch: 12 }, // Value
            { wch: 20 }, // Location
            { wch: 12 }, // Status
            { wch: 15 }  // Expiry
        ];

        const sheetName = site.name.substring(0, 31); // Excel sheet name limit
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    // Add network summary sheet
    const summary = [
        ['Network Inventory Summary'],
        [''],
        ['Total Sites', sites.length],
        ['Total Products', products.length],
        ['Total Stock Value', products.reduce((sum, p) => sum + (p.stock * p.price), 0)],
        ['Total Items', products.reduce((sum, p) => sum + p.stock, 0)],
        [''],
        ['By Site Type'],
        ['Warehouses', sites.filter(s => s.type === 'Warehouse').length],
        ['Stores', sites.filter(s => s.type === 'Store').length],
        [''],
        ['Stock Status'],
        ['Out of Stock', products.filter(p => p.stock === 0).length],
        ['Low Stock (<10)', products.filter(p => p.stock > 0 && p.stock < 10).length],
        ['Good Stock', products.filter(p => p.stock >= 10).length]
    ];

    const summaryWs = XLSX.utils.aoa_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    XLSX.writeFile(wb, filename);
}

/**
 * Export site performance to PDF
 */
export function exportSitePerformanceToPDF(
    sites: Site[],
    salesData: { siteId: string; revenue: number; transactions: number }[],
    filename: string = 'site_performance.pdf'
) {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text('Site Performance Report', 14, 20);

    // Metadata
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Sites: ${sites.length}`, 14, 36);

    // Prepare table data
    const tableData = sites.map(site => {
        const siteData = salesData.find(s => s.siteId === site.id);
        return [
            site.name,
            site.type,
            site.address,
            siteData?.transactions || 0,
            `${CURRENCY_SYMBOL}${(siteData?.revenue || 0).toLocaleString()}`,
            site.status
        ];
    });

    // Add table
    autoTable(doc, {
        startY: 45,
        head: [['Site Name', 'Type', 'Address', 'Transactions', 'Revenue', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [0, 255, 157], textColor: [0, 0, 0] },
        styles: { fontSize: 8 }
    });

    doc.save(filename);
}

/**
 * Export data to CSV (generic)
 */
export function exportToCSV(data: any[], filename: string = 'export.csv') {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
