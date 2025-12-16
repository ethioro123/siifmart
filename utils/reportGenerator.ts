import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportMetrics {
    totalRevenue?: number;
    totalSales?: number;
    totalOrders?: number;
    netProfit?: number;
    totalSpend?: number;
    [key: string]: any;
}

export const generateQuarterlyReport = (
    metrics: ReportMetrics,
    periodLabel: string,
    reportType: 'Operations' | 'Financials' | 'Procurement' = 'Operations'
) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // -- Header --
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0); // Black
    doc.text('SiifMart inc.', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100); // Grey
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 26);

    // -- Title --
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`${reportType} Report - ${periodLabel}`, 14, 40);

    // -- Metrics Table --
    const tableData = Object.entries(metrics).map(([key, value]) => {
        // Format label (camelCase to Title Case)
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

        // Format value (Currency if number)
        let formattedValue = value;
        if (typeof value === 'number') {
            if (key.toLowerCase().includes('count') || key.toLowerCase().includes('requests') || key.toLowerCase().includes('orders')) {
                formattedValue = value.toLocaleString();
            } else {
                formattedValue = `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
        }

        return [label, formattedValue];
    });

    autoTable(doc, {
        startY: 50,
        head: [['Metric', 'Value']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [0, 255, 157], textColor: [0, 0, 0], fontStyle: 'bold' }, // Cyber green
        styles: { fontSize: 12, cellPadding: 6 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 100 },
            1: { halign: 'right' }
        }
    });

    // -- Footer --
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('This document contains confidential financial data.', 14, finalY);

    // Save
    doc.save(`SiifMart_${reportType}_${periodLabel.replace(/\s+/g, '_')}.pdf`);
};
