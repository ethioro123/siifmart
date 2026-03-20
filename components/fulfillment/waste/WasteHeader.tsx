import React from 'react';
import { AlertOctagon } from 'lucide-react';

interface WasteHeaderProps {
    wasteViewMode: 'Log' | 'History';
    setWasteViewMode: (mode: 'Log' | 'History') => void;
}

export const WasteHeader: React.FC<WasteHeaderProps> = ({
    wasteViewMode,
    setWasteViewMode
}) => {
    return (
        <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6 mb-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                        <AlertOctagon className="text-red-500" size={24} />
                        Waste & Spoilage Management
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Log and track inventory write-offs</p>
                </div>

                <div className="flex bg-black/30 rounded-lg p-1 border border-white/10">
                    <button
                        onClick={() => setWasteViewMode('Log')}
                        className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${wasteViewMode === 'Log' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-400 hover:text-white'} `}
                    >
                        Log Waste
                    </button>
                    <button
                        onClick={() => setWasteViewMode('History')}
                        className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${wasteViewMode === 'History' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-400 hover:text-white'} `}
                    >
                        History
                    </button>
                </div>
            </div>
        </div>
    );
};
