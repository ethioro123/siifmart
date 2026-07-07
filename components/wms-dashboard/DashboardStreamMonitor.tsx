import React from 'react';

interface DashboardStreamMonitorProps {
    movements: any[];
    handleViewAllLogs: () => void;
}

export const DashboardStreamMonitor: React.FC<DashboardStreamMonitorProps> = ({
    movements,
    handleViewAllLogs
}) => {
    return (
        <div className="lg:col-span-3 bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-emerald-950/20 lg:backdrop-blur-2xl rounded-3xl p-5 sm:p-8 lg:p-10 shadow-sm transition-colors duration-500">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h3 className="text-xl font-bold text-[#1E3F27] dark:text-[#EAE5D9] uppercase tracking-tight">Stream Monitor</h3>
                    <p className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83] mt-2 uppercase font-bold tracking-[0.2em] opacity-60">Real-time execution log</p>
                </div>
                <button
                    onClick={handleViewAllLogs}
                    className="px-6 py-2.5 bg-white dark:bg-white/[0.05] border border-[#E2DCCE] dark:border-white/[0.1] rounded-2xl text-[10px] font-bold text-[#4D6E56] dark:text-gray-300 uppercase tracking-widest hover:text-[#2C5E3B] hover:dark:border-white/[0.2] hover:border-black/10 transition-all shadow-sm cursor-pointer"
                >
                    Full Archive
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2">
                {movements.slice(0, 10).map((move, i) => (
                    <div key={i} className="flex items-center group py-3 px-4 border-b border-[#E2DCCE]/30 dark:border-white/5 last:border-0 hover:bg-[#FAF8F5]/80 hover:dark:bg-white/[0.03] rounded-2xl transition-all cursor-pointer">
                        <div className={`w-1 h-8 rounded-full mr-5 transition-all group-hover:h-4 ${move.type === 'IN' ? 'bg-[#2C5E3B] dark:bg-[#A9CBA2]' : 'bg-[#8C6239] dark:bg-[#E2C899]'}`} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-[#1E3F27] dark:text-[#EAE5D9] truncate max-w-[140px] tracking-tight group-hover:text-[#2C5E3B] group-hover:dark:text-[#A9CBA2] transition-colors">{move.productName}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${move.type === 'IN' ? 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 text-[#2C5E3B] dark:text-[#A9CBA2]' : 'bg-[#8C6239]/10 dark:bg-[#E2C899]/10 text-[#8C6239] dark:text-[#E2C899]'}`}>{move.quantity}</span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                                <p className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83] font-bold uppercase tracking-widest opacity-60">{move.type} • {move.performedBy}</p>
                                <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold italic">{move.date?.includes(',') ? move.date.split(',')[0] : move.date || 'Live'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default DashboardStreamMonitor;
