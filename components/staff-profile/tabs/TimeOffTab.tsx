import React from 'react';
import { Star, Calendar } from 'lucide-react';

interface TimeOffTabProps {
    isOwnProfile: boolean;
    onRequestTimeOff: () => void;
}

export default function TimeOffTab({ isOwnProfile, onRequestTimeOff }: TimeOffTabProps) {
    return (
        <div className="space-y-8 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-gray-900 dark:text-white font-black uppercase tracking-widest">Annual Leave</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">12 / 20 Days Remaining</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 dark:bg-black/50 rounded-full overflow-hidden border border-transparent dark:border-white/5">
                        <div className="h-full bg-gradient-to-r from-cyber-primary to-green-500 w-[60%] shadow-[0_0_10px_rgba(0,255,157,0.3)]"></div>
                    </div>
                </div>
                <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-gray-900 dark:text-white font-black uppercase tracking-widest">Sick Leave</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">2 / 10 Days Remaining</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 dark:bg-black/50 rounded-full overflow-hidden border border-transparent dark:border-white/5">
                        <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 w-[20%] shadow-[0_0_10px_rgba(234,179,8,0.3)]"></div>
                    </div>
                </div>
            </div>

            <div>
                <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Star size={16} className="text-yellow-500 dark:text-yellow-400" /> Recent Leave Requests
                </h4>
                <div className="space-y-3">
                    <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-500">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-900 dark:text-white font-bold">Annual Vacation</p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">Aug 12 - Aug 15 (4 Days)</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-black uppercase bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/30 px-3 py-1 rounded-full">Approved</span>
                    </div>
                    <p className="text-center text-xs text-gray-500 dark:text-gray-600 py-4">Higher management view would show more history</p>
                </div>
            </div>

            {isOwnProfile && (
                <button
                    onClick={onRequestTimeOff}
                    className="w-full py-4 bg-cyber-primary hover:bg-cyber-accent text-black font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-[0.98]"
                >
                    Request Time Off
                </button>
            )}
        </div>
    );
}
