
import React from 'react';
import { Thermometer, Shield, Box } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock Data (moved from Inventory.tsx)
const MOCK_ZONES = [
    { id: '1', name: 'Zone A (General)', capacity: 5000, occupied: 3200, type: 'General' },
    { id: '2', name: 'Zone B (Cold Storage)', capacity: 1000, occupied: 850, type: 'Cold', temperature: '-4°C' },
    { id: '3', name: 'Zone C (High Security)', capacity: 500, occupied: 120, type: 'Secure' },
    { id: '4', name: 'Zone D (Bulk)', capacity: 10000, occupied: 6500, type: 'General' },
];

export const InventoryZones: React.FC = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
            {MOCK_ZONES.map((zone) => {
                const usagePercent = (zone.occupied / zone.capacity) * 100;
                let colorClass = "bg-cyber-primary";
                if (usagePercent > 90) colorClass = "bg-red-500";
                else if (usagePercent > 70) colorClass = "bg-yellow-400";

                return (
                    <div key={zone.id} className="bg-cyber-gray border border-white/5 rounded-2xl p-6 relative overflow-hidden group cursor-pointer hover:border-white/20 transition-all">
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-xl ${zone.type === 'Cold' ? 'bg-blue-500/10 text-blue-400' : zone.type === 'Secure' ? 'bg-purple-500/10 text-purple-400' : 'bg-cyber-primary/10 text-cyber-primary'}`}>
                                    {zone.type === 'Cold' ? <Thermometer size={24} /> : zone.type === 'Secure' ? <Shield size={24} /> : <Box size={24} />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">{zone.name}</h3>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">{zone.type} Storage</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`text-2xl font-mono font-bold ${usagePercent > 90 ? 'text-red-400' : 'text-white'}`}>
                                    {usagePercent.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                        <div className="relative z-10">
                            <div className="w-full bg-black/50 rounded-full h-4 border border-white/10 overflow-hidden relative">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${usagePercent}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className={`h-full transition-all duration-1000 ${colorClass}`}
                                />
                            </div>
                            {zone.temperature && (
                                <div className="mt-4 flex items-center gap-2 text-blue-400 text-sm bg-blue-500/5 px-3 py-2 rounded-lg border border-blue-500/10 w-fit">
                                    <Thermometer size={14} />
                                    <span>Current Temp: {zone.temperature}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
