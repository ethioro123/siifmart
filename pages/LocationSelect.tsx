import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useStore } from '../contexts/CentralStore'; // For user role access
import { Building, Store, MapPin, Search, ChevronRight, LayoutDashboard, ArrowRight } from 'lucide-react';
import { native } from '../utils/native';

export default function LocationSelect() {
    const { sites, setActiveSite, activeSite } = useData();
    const { user } = useStore();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

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
        <div className="min-h-screen bg-cyber-black text-white p-6 animate-in fade-in">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            Location Command
                        </h1>
                        <p className="text-gray-400 mt-1">Select a facility to switch operational context.</p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search locations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-cyber-gray border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-cyber-primary outline-none transition-colors"
                            />
                        </div>

                        {/* Option to return to HQ View if user is CEO */}
                        {user?.role === 'super_admin' && (
                            <button
                                onClick={handleBackToCentral}
                                className="flex items-center gap-2 px-4 py-2 bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/20 rounded-xl hover:bg-cyber-primary/20 transition-all font-bold text-sm"
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
                        <div className="flex items-center gap-2 text-green-400 mb-4">
                            <Store size={20} />
                            <h2 className="text-lg font-bold tracking-wider uppercase">Retail Locations ({stores.length})</h2>
                        </div>

                        <div className="grid gap-4">
                            {stores.map(site => (
                                <button
                                    key={site.id}
                                    onClick={() => handleSiteSelect(site.id)}
                                    className={`group relative text-left p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.01] ${activeSite?.id === site.id
                                        ? 'bg-green-500/10 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.1)]'
                                        : 'bg-cyber-gray border-white/5 hover:border-green-500/50 hover:shadow-lg'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-4">
                                            <div className={`p-3 rounded-xl h-fit ${activeSite?.id === site.id ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-400 group-hover:text-green-400 group-hover:bg-green-500/10'
                                                } transition-colors`}>
                                                <Store size={24} />
                                            </div>
                                            <div>
                                                <h3 className={`text-lg font-bold ${activeSite?.id === site.id ? 'text-green-400' : 'text-white group-hover:text-green-300'}`}>
                                                    {site.name}
                                                </h3>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                                    {/* Premium Site Code Badge */}
                                                    <div className="absolute top-5 right-5 font-mono text-[10px] font-bold px-2 py-1 rounded bg-black/40 border border-white/10 backdrop-blur-md tracking-widest text-cyber-primary shadow-[0_0_10px_rgba(0,255,157,0.15)] group-hover:shadow-[0_0_15px_rgba(0,255,157,0.3)] group-hover:border-cyber-primary/40 transition-all">
                                                        {site.code || site.id}
                                                    </div>
                                                    <span className="w-1 h-1 bg-gray-600 rounded-full" />
                                                    <span>{site.type}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-400 mt-3 group-hover:text-gray-300">
                                                    <MapPin size={14} />
                                                    {site.address}
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`p-2 rounded-full transition-transform duration-300 ${activeSite?.id === site.id ? 'text-green-500' : 'text-gray-600 group-hover:text-green-500 group-hover:translate-x-1'
                                            }`}>
                                            <ArrowRight size={20} />
                                        </div>
                                    </div>

                                    {/* Integration Status Indicators (Mock) */}
                                    <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-1 text-[10px] text-green-400/80 bg-green-500/5 px-2 py-1 rounded">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> POS ONLINE
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-blue-400/80 bg-blue-500/5 px-2 py-1 rounded">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> SYNC ACTIVE
                                        </div>
                                    </div>
                                </button>
                            ))}
                            {stores.length === 0 && (
                                <div className="p-8 border border-dashed border-white/10 rounded-2xl text-center text-gray-500">
                                    No retail locations found matching "{searchTerm}"
                                </div>
                            )}
                        </div>
                    </div>

                    {/* WAREHOUSES COLUMN */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-blue-400 mb-4">
                            <Building size={20} />
                            <h2 className="text-lg font-bold tracking-wider uppercase">Logistics Centers ({warehouses.length})</h2>
                        </div>

                        <div className="grid gap-4">
                            {warehouses.map(site => (
                                <button
                                    key={site.id}
                                    onClick={() => handleSiteSelect(site.id)}
                                    className={`group relative text-left p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.01] ${activeSite?.id === site.id
                                        ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                                        : 'bg-cyber-gray border-white/5 hover:border-blue-500/50 hover:shadow-lg'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-4">
                                            <div className={`p-3 rounded-xl h-fit ${activeSite?.id === site.id ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-400 group-hover:text-blue-400 group-hover:bg-blue-500/10'
                                                } transition-colors`}>
                                                <Building size={24} />
                                            </div>
                                            <div>
                                                <h3 className={`text-lg font-bold ${activeSite?.id === site.id ? 'text-blue-400' : 'text-white group-hover:text-blue-300'}`}>
                                                    {site.name}
                                                </h3>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                                    {/* Premium Site Code Badge */}
                                                    <div className="absolute top-5 right-5 font-mono text-[10px] font-bold px-2 py-1 rounded bg-black/40 border border-white/10 backdrop-blur-md tracking-widest text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.15)] group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] group-hover:border-blue-500/40 transition-all">
                                                        {site.code || site.id}
                                                    </div>
                                                    <span className="w-1 h-1 bg-gray-600 rounded-full" />
                                                    <span>{site.type}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-400 mt-3 group-hover:text-gray-300">
                                                    <MapPin size={14} />
                                                    {site.address}
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`p-2 rounded-full transition-transform duration-300 ${activeSite?.id === site.id ? 'text-blue-500' : 'text-gray-600 group-hover:text-blue-500 group-hover:translate-x-1'
                                            }`}>
                                            <ArrowRight size={20} />
                                        </div>
                                    </div>

                                    {/* Integration Status Indicators (Mock) */}
                                    <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-1 text-[10px] text-purple-400/80 bg-purple-500/5 px-2 py-1 rounded">
                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" /> WMS NETWORK
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-blue-400/80 bg-blue-500/5 px-2 py-1 rounded">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> SYNC ACTIVE
                                        </div>
                                    </div>
                                </button>
                            ))}
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
