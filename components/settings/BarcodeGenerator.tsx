import React, { useState } from 'react';
import { Download, Loader2, Barcode, CheckCircle } from 'lucide-react';
import { encodeLocation, extractSitePrefix } from '../../utils/locationEncoder';

export const BarcodeGenerator: React.FC = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    const generateCSV = async () => {
        setIsGenerating(true);

        // Simulating async work to not freeze UI
        setTimeout(() => {
            const rows = [['Location Label', 'Barcode ID', 'Zone', 'Aisle', 'Bay']];

            // Zones A-J (10 zones)
            const zones = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

            let count = 0;

            zones.forEach(zone => {
                // Aisles 1-20
                for (let aisle = 1; aisle <= 20; aisle++) {
                    // Bays 1-20
                    for (let bay = 1; bay <= 20; bay++) {
                        const aisleStr = aisle.toString().padStart(2, '0');
                        const bayStr = bay.toString().padStart(2, '0');

                        const label = `${zone}-${aisleStr}-${bayStr}`;
                        const barcode = encodeLocation(label, extractSitePrefix());

                        if (barcode) {
                            rows.push([label, barcode, zone, aisleStr, bayStr]);
                            count++;
                        }
                    }
                }
            });

            // Convert to CSV
            const csvContent = rows.map(e => e.join(",")).join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);

            link.setAttribute("href", url);
            link.setAttribute("download", `location_barcodes_full_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setIsGenerating(false);
            setIsComplete(true);
            setTimeout(() => setIsComplete(false), 3000);
        }, 500);
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-6">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Barcode size={20} className="text-cyber-primary" />
                        Location Barcode Export
                    </h3>
                    <p className="text-sm text-gray-400 mt-1 max-w-md">
                        Generate a complete master list of 15-digit barcodes for printing.
                        Includes Zone A-J, Aisles 1-20, Bays 1-20 (4,000+ labels).
                    </p>
                </div>

                <button
                    onClick={generateCSV}
                    disabled={isGenerating}
                    className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center gap-2 transition-all ${isComplete
                        ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                        : 'bg-cyber-primary text-black hover:bg-cyber-primary/90'
                        }`}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Generating...
                        </>
                    ) : isComplete ? (
                        <>
                            <CheckCircle size={16} />
                            Downloaded
                        </>
                    ) : (
                        <>
                            <Download size={16} />
                            Download CSV
                        </>
                    )}
                </button>
            </div>

            <div className="mt-4 flex gap-4 text-xs font-mono text-gray-500 bg-black/20 p-3 rounded-lg border border-white/5">
                <div>Format: <span className="text-cyber-primary">PPPP-ZZ-AA-BB-UUUU-C</span></div>
                <div>Count: <span className="text-white">4,000 Locations</span></div>
                <div>Example: <span className="text-white">888801050200005</span> (A-05-02)</div>
            </div>
        </div>
    );
};
