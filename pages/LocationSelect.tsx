import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useStore } from '../contexts/CentralStore'; // For user role access
import { Building, Store, MapPin, Search, ChevronRight, LayoutDashboard, ArrowRight, ChevronDown } from 'lucide-react';
import { native } from '../utils/native';
import { motion, AnimatePresence } from 'framer-motion';

export default function LocationSelect() {
    const { sites, setActiveSite, activeSite } = useData();
    const { user } = useStore();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set());

    const toggleExpand = (siteId: string) => {
        setExpandedSites(prev => {
            const next = new Set(prev);
            if (next.has(siteId)) {
                next.delete(siteId);
            } else {
                next.add(siteId);
            }
            return next;
        });
    };

    const handleSiteSelect = (siteId: string) => {
        const selectedSite = sites.find(s => s.id === siteId);
        setActiveSite(siteId);

        // Smart navigation based on site type
        if (selectedSite) {
            native.toast(`Switched to ${selectedSite.name}`);

            if (selectedSite.type === 'Store' || selectedSite.type === 'Dark Store') {
                navigate('/pos-dashboard');
            } else if (selectedSite.type === 'Warehouse' || selectedSite.type === 'Distribution Center') {
                navigate('/wms-dashboard');
            } else {
                // Formatting fallback
                navigate('/');
            }
        }
    };

    const handleBackToCentral = () => {
        setActiveSite(''); // Clear active site to return to Central Ops view
        navigate('/admin');
    };

    const filteredSites = sites.filter(site =>
        site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.contact?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group sites by type
    const stores = filteredSites.filter(s => s.type === 'Store' || s.type === 'Dark Store');
    const warehouses = filteredSites.filter(s => s.type === 'Warehouse' || s.type === 'Distribution Center');

    return (
        <div className="min-h-screen bg-transparent text-white p-6 animate-in fade-in">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-[#E2DCCE] dark:border-emerald-950/20 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#2C5E3B] to-amber-600 dark:from-[#A9CBA2] dark:to-[#DFD5C6] tracking-tight">
                            Location Command
                        </h1>
                        <p className="text-stone-500 dark:text-stone-400 mt-1">Select a facility to switch operational context.</p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search locations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="woody-input pl-10"
                            />
                        </div>

                        {/* Option to return to HQ View if user is CEO */}
                        {user?.role === 'super_admin' && (
                            <button
                                onClick={handleBackToCentral}
                                className="woody-btn-secondary py-2 px-4 flex items-center gap-2 text-sm"
                            >
                                <LayoutDashboard size={16} />
                                <span>Administration</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Grid Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* STORES COLUMN */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-400 mb-2">
                            <Store size={18} />
                            <h2 className="text-sm font-bold tracking-widest uppercase">Retail Locations ({stores.length})</h2>
                        </div>

                        <div className="grid gap-3">
                            {stores.map(site => {
                                const isExpanded = expandedSites.has(site.id);
                                return (
                                    <div
                                        key={site.id}
                                        className={`group relative rounded-xl border transition-all duration-300 ${
                                            activeSite?.id === site.id
                                                ? 'bg-[#2C5E3B]/10 border-[#2C5E3B] shadow-sm'
                                                : 'glass-panel border-white/5 hover:border-[#2C5E3B]/30 hover:shadow-md'
                                        }`}
                                    >
                                        <div
                                            onClick={() => handleSiteSelect(site.id)}
                                            className="flex items-center justify-between p-4 cursor-pointer gap-4"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-semibold text-stone-100 group-hover:text-green-400 transition-colors truncate">
                                                    {site.name}
                                                </h3>
                                                <p className="text-xs text-stone-400 mt-1 truncate flex items-center gap-1.5">
                                                    <MapPin size={12} className="text-stone-500 flex-shrink-0" />
                                                    <span>{site.address}</span>
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleExpand(site.id);
                                                    }}
                                                    className="p-1.5 rounded-lg hover:bg-white/5 text-stone-500 hover:text-stone-300 transition-colors"
                                                    title="View details"
                                                >
                                                    <ChevronDown
                                                        size={16}
                                                        className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                                    />
                                                </button>
                                                <div className="p-1.5 text-stone-600 group-hover:text-green-400 group-hover:translate-x-0.5 transition-all">
                                                    <ArrowRight size={16} />
                                                </div>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden border-t border-white/5 bg-black/10 px-4 pb-4 pt-3 text-xs space-y-2.5 text-stone-400"
                                                >
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <span className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Site ID / Code</span>
                                                            <div className="font-mono text-stone-300 mt-0.5">{site.code || site.id}</div>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Facility Type</span>
                                                            <div className="text-stone-300 mt-0.5">{site.type}</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2 pt-1">
                                                        <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-wider text-green-400/90 bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 rounded-full">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> POS ONLINE
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-wider text-blue-400/90 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" /> SYNC ACTIVE
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                            {stores.length === 0 && (
                                <div className="p-8 border border-dashed border-white/10 rounded-2xl text-center text-gray-500">
                                    No retail locations found matching "{searchTerm}"
                                </div>
                            )}
                        </div>
                    </div>

                    {/* WAREHOUSES COLUMN */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                            <Building size={18} />
                            <h2 className="text-sm font-bold tracking-widest uppercase">Logistics Centers ({warehouses.length})</h2>
                        </div>

                        <div className="grid gap-3">
                            {warehouses.map(site => {
                                const isExpanded = expandedSites.has(site.id);
                                return (
                                    <div
                                        key={site.id}
                                        className={`group relative rounded-xl border transition-all duration-300 ${
                                            activeSite?.id === site.id
                                                ? 'bg-[#2C5E3B]/10 border-[#2C5E3B] shadow-sm'
                                                : 'glass-panel border-white/5 hover:border-[#2C5E3B]/30 hover:shadow-md'
                                        }`}
                                    >
                                        <div
                                            onClick={() => handleSiteSelect(site.id)}
                                            className="flex items-center justify-between p-4 cursor-pointer gap-4"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-semibold text-stone-100 group-hover:text-blue-400 transition-colors truncate">
                                                    {site.name}
                                                </h3>
                                                <p className="text-xs text-stone-400 mt-1 truncate flex items-center gap-1.5">
                                                    <MapPin size={12} className="text-stone-500 flex-shrink-0" />
                                                    <span>{site.address}</span>
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleExpand(site.id);
                                                    }}
                                                    className="p-1.5 rounded-lg hover:bg-white/5 text-stone-500 hover:text-stone-300 transition-colors"
                                                    title="View details"
                                                >
                                                    <ChevronDown
                                                        size={16}
                                                        className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                                    />
                                                </button>
                                                <div className="p-1.5 text-stone-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all">
                                                    <ArrowRight size={16} />
                                                </div>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden border-t border-white/5 bg-black/10 px-4 pb-4 pt-3 text-xs space-y-2.5 text-stone-400"
                                                >
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <span className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Site ID / Code</span>
                                                            <div className="font-mono text-stone-300 mt-0.5">{site.code || site.id}</div>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Facility Type</span>
                                                            <div className="text-stone-300 mt-0.5">{site.type}</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2 pt-1">
                                                        <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-wider text-purple-400/90 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" /> WMS NETWORK
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-wider text-blue-400/90 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" /> SYNC ACTIVE
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                            {warehouses.length === 0 && (
                                <div className="p-8 border border-dashed border-white/10 rounded-2xl text-center text-gray-500">
                                    No distribution centers found matching "{searchTerm}"
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
