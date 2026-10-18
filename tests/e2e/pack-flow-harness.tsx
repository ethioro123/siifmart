import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { PackJobModal } from '../../components/fulfillment/pack/PackJobModal';
import { PackScanner } from '../../components/fulfillment/pack/PackScanner';
import { Product, WMSJob } from '../../types';
import '../../index.css';

const siteId = 'site-playwright';
const product: Product = {
    id: 'product-playwright',
    name: 'Playwright Test Milk',
    sku: 'TEST-MILK-1L',
    barcode: '1234567890123',
    siteId,
    unit: 'PACK',
} as Product;

const initialJob: WMSJob = {
    id: 'job-playwright',
    jobNumber: 'PACK-PLAYWRIGHT',
    type: 'PACK',
    status: 'Pending',
    siteId,
    lineItems: [{ productId: product.id, name: product.name, sku: product.sku, expectedQty: 2, quantity: 2 }],
} as WMSJob;

const Harness = () => {
    const [job, setJob] = useState(initialJob);
    const [isModalOpen, setIsModalOpen] = useState(true);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    return (
        <LanguageProvider>
            <PackJobModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                job={job}
                user={null}
                sites={[]}
                products={[product]}
                onStartPack={async () => setJob(current => ({ ...current, status: 'In-Progress' }))}
                onCompleteJob={() => undefined}
                onPrintLabel={() => undefined}
                isSubmitting={false}
                resolveOrderRef={ref => ref || ''}
                onOpenScanner={() => {
                    setIsModalOpen(false);
                    setIsScannerOpen(true);
                }}
            />
            {isScannerOpen && (
                <PackScanner
                    job={job}
                    products={[product]}
                    isProcessing={false}
                    onClose={() => {
                        setIsScannerOpen(false);
                        setIsModalOpen(true);
                    }}
                    onConfirmPack={async (index, qty) => setJob(current => ({
                        ...current,
                        lineItems: current.lineItems?.map((item, itemIndex) => itemIndex === index
                            ? { ...item, packed: true, packedQty: qty }
                            : item),
                    }))}
                    onCompleteJob={() => {
                        setIsScannerOpen(false);
                        setIsModalOpen(true);
                    }}
                />
            )}
        </LanguageProvider>
    );
};

createRoot(document.getElementById('root')!).render(<Harness />);
