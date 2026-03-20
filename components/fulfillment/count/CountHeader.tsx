import React from 'react';
import { ClipboardCheck } from 'lucide-react';

interface CountHeaderProps {
    countViewMode: 'Operations' | 'Reports';
    setCountViewMode: (mode: 'Operations' | 'Reports') => void;
    countSessionStatus: 'Idle' | 'Active' | 'Review';
    setCountSessionStatus: (status: 'Idle' | 'Active' | 'Review') => void;
    setCountSessionItems: (items: any[]) => void;
}

export const CountHeader: React.FC<CountHeaderProps> = ({
    countViewMode,
    setCountViewMode,
    countSessionStatus,
    setCountSessionStatus,
    setCountSessionItems
}) => {
    return (
        <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                        <ClipboardCheck className="text-cyber-primary" size={24} />
                        Inventory Audit & Cycle Counting
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                        {countViewMode === 'Operations'
                            ? (countSessionStatus === 'Idle' ? 'Start a new count session' : countSessionStatus === 'Active' ? 'BLIND COUNT IN PROGRESS' : 'Review & Approve Variances')
                            : 'Historical accuracy and variance reports'}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* View Toggle */}
                    <div className="flex bg-black/30 rounded-lg p-1 border border-white/10">
                        <button
                            onClick={() => setCountViewMode('Operations')}
                            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${countViewMode === 'Operations' ? 'bg-cyber-primary text-black shadow-lg shadow-cyber-primary/20' : 'text-gray-400 hover:text-white'} `}
                        >
                            Operations
                        </button>
                        <button
                            onClick={() => setCountViewMode('Reports')}
                            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${countViewMode === 'Reports' ? 'bg-cyber-primary text-black shadow-lg shadow-cyber-primary/20' : 'text-gray-400 hover:text-white'} `}
                        >
                            Reports
                        </button>
                    </div>

                    {countSessionStatus !== 'Idle' && countViewMode === 'Operations' && (
                        <button
                            onClick={() => {
                                if (confirm('Cancel current session? Progress will be lost.')) {
                                    setCountSessionStatus('Idle');
                                    setCountSessionItems([]);
                                }
                            }}
                            className="text-red-400 hover:text-red-300 text-xs font-bold border border-red-500/20 px-3 py-2 rounded-lg hover:bg-red-500/10"
                        >
                            Cancel Session
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
