import React, { useState } from 'react';
import { ReturnsHeader } from './returns/ReturnsHeader';
import { ReturnsProcess } from './returns/ReturnsProcess';
import { ReturnsHistory } from './returns/ReturnsHistory';

interface ReturnsTabProps {
    sales: any[];
    processReturn: (saleId: string, returnItems: any[], totalRefund: number, processedBy: string) => void;
    inventoryRequestsService: any;
    products: any[];
    user: any;
    addNotification: (type: 'success' | 'alert' | 'info', message: string, duration?: number) => void;
    formatJobId: (id: string) => string;
    resolveOrderRef: (ref: string) => string;
    CURRENCY_SYMBOL: string;
}

export const ReturnsTab: React.FC<ReturnsTabProps> = ({
    sales,
    processReturn,
    inventoryRequestsService,
    products,
    user,
    addNotification,
    formatJobId,
    resolveOrderRef,
    CURRENCY_SYMBOL
}) => {
    // --- STATE ---
    const [returnViewMode, setReturnViewMode] = useState<'Process' | 'History'>('Process');
    const [returnStep, setReturnStep] = useState<'Search' | 'Select' | 'Review' | 'Complete'>('Search');
    const [foundSale, setFoundSale] = useState<any | null>(null);
    const [returnItems, setReturnItems] = useState<any[]>([]);

    // --- RENDER ---
    return (
        <div className="flex-1 overflow-y-auto space-y-6">
            <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6 min-h-[600px] flex flex-col">
                {/* Header */}
                <ReturnsHeader
                    returnViewMode={returnViewMode}
                    setReturnViewMode={setReturnViewMode}
                    returnStep={returnStep}
                />

                {/* Process View */}
                {returnViewMode === 'Process' && (
                    <ReturnsProcess
                        sales={sales}
                        products={products}
                        user={user}
                        returnStep={returnStep}
                        setReturnStep={setReturnStep}
                        foundSale={foundSale}
                        setFoundSale={setFoundSale}
                        returnItems={returnItems}
                        setReturnItems={setReturnItems}
                        processReturn={processReturn}
                        addNotification={addNotification}
                        inventoryRequestsService={inventoryRequestsService}
                    />
                )}

                {/* History View */}
                {returnViewMode === 'History' && (
                    <ReturnsHistory sales={sales} />
                )}
            </div>
        </div>
    );
};
