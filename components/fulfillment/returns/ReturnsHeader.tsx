import React from 'react';
import { RefreshCw } from 'lucide-react';

interface ReturnsHeaderProps {
    returnViewMode: 'Process' | 'History';
    setReturnViewMode: (mode: 'Process' | 'History') => void;
    returnStep: 'Search' | 'Select' | 'Review' | 'Complete';
}

export const ReturnsHeader: React.FC<ReturnsHeaderProps> = ({
    returnViewMode,
    setReturnViewMode,
    returnStep
}) => {
    return (
        <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
            <div>
                <h3 className="font-bold text-white flex items-center gap-2 text-xl">
                    <RefreshCw className="text-blue-400" size={24} />
                    Returns Management (RMA)
                </h3>
                <div className="flex items-center gap-6 mt-2">
                    <button
                        onClick={() => setReturnViewMode('Process')}
                        className={`text-[10px] uppercase font-black tracking-widest transition-all ${returnViewMode === 'Process' ? 'text-blue-400 border-b-2 border-blue-400 pb-1' : 'text-gray-500 hover:text-white'}`}
                    >
                        Process New Return
                    </button>
                    <button
                        onClick={() => setReturnViewMode('History')}
                        className={`text-[10px] uppercase font-black tracking-widest transition-all ${returnViewMode === 'History' ? 'text-blue-400 border-b-2 border-blue-400 pb-1' : 'text-gray-500 hover:text-white'}`}
                    >
                        Returns History
                    </button>
                </div>
            </div>
            {returnViewMode === 'Process' && (
                <div className="flex items-center gap-2">
                    {['Search', 'Select', 'Review', 'Complete'].map((step, i) => {
                        const currentIndex = ['Search', 'Select', 'Review', 'Complete'].indexOf(returnStep);
                        const isActive = i <= currentIndex;
                        return (
                            <div key={step} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-500'}`}>
                                    {i + 1}
                                </div>
                                {i < 3 && <div className={`w-8 h-0.5 mx-1 ${isActive ? 'bg-blue-500' : 'bg-white/5'}`} />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
