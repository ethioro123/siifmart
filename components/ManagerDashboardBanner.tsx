import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../contexts/CentralStore';
import {
    ShoppingCart, Package, Truck, ClipboardList, Users,
    FileText, DollarSign, ArrowRight, Building, Store, Zap
} from 'lucide-react';

/**
 * Manager Dashboard Banner
 * Prominent quick access banner for managers on their dashboard
 */
export default function ManagerDashboardBanner() {
    const { user } = useStore();
    const navigate = useNavigate();

    // Only show for managers, warehouse managers and dispatchers
    if (!user || !['manager', 'warehouse_manager', 'dispatcher'].includes(user.role)) {
        return null;
    }

    const isWarehouseManager = user.role === 'warehouse_manager';
    const isDispatcher = user.role === 'dispatcher';
    const isWarehouseRole = isWarehouseManager || isDispatcher;

    const quickLinks = isWarehouseRole
        ? [
            { label: 'Fulfillment', icon: ClipboardList, path: '/wms-ops', color: 'from-cyber-primary to-green-400' },
            { label: 'Receive PO', icon: Truck, path: '/procurement', color: 'from-blue-500 to-cyan-400' },
            { label: 'Inventory', icon: Package, path: '/inventory', color: 'from-purple-500 to-pink-400' },
            { label: 'Team', icon: Users, path: '/employees', color: 'from-orange-500 to-yellow-400' }
        ]
        : [
            { label: 'POS', icon: ShoppingCart, path: '/pos', color: 'from-cyber-primary to-green-400' },
            { label: 'Sales', icon: FileText, path: '/sales', color: 'from-blue-500 to-cyan-400' },
            { label: 'Inventory', icon: Package, path: '/inventory', color: 'from-purple-500 to-pink-400' },
            // Removed Procurement/Orders link as Store Managers don't have access
            { label: 'Team', icon: Users, path: '/employees', color: 'from-green-500 to-emerald-400' },
            { label: 'Pricing', icon: DollarSign, path: '/pricing', color: 'from-yellow-500 to-amber-400' }
        ];

    return (
        <div className="bg-gradient-to-br from-cyber-dark via-cyber-gray to-cyber-dark border border-white/10 rounded-2xl p-6 relative overflow-hidden mb-6">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,255,157,0.3) 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }} />
            </div>

            {/* Content */}
            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        {isWarehouseRole ? (
                            <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30">
                                <Building className="text-blue-400" size={24} />
                            </div>
                        ) : (
                            <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30">
                                <Store className="text-green-400" size={24} />
                            </div>
                        )}
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                {isWarehouseManager ? 'Warehouse Manager' : isDispatcher ? 'Warehouse Dispatcher' : 'Store Manager'} Control Panel
                                <Zap className="text-cyber-primary" size={18} />
                            </h3>
                            <p className="text-sm text-gray-400">Quick access to your essential tools</p>
                        </div>
                    </div>
                    <div className="hidden md:block text-xs text-gray-500 font-mono bg-black/30 px-3 py-2 rounded-lg border border-white/5">
                        Press <kbd className="px-2 py-1 bg-white/10 rounded text-white mx-1">Ctrl+K</kbd> for shortcuts
                    </div>
                </div>

                {/* Quick Links Grid */}
                <div className={`grid grid-cols-2 md:grid-cols-${isWarehouseRole ? '4' : '6'} gap-3`}>
                    {quickLinks.map((link, index) => (
                        <button
                            key={index}
                            onClick={() => navigate(link.path)}
                            className="group relative bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-xl overflow-hidden"
                        >
                            {/* Gradient Background on Hover */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${link.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />

                            {/* Content */}
                            <div className="relative z-10 flex flex-col items-center gap-2">
                                <div className={`p-3 rounded-lg bg-gradient-to-br ${link.color} shadow-lg`}>
                                    <link.icon size={20} className="text-white" />
                                </div>
                                <span className="text-sm font-bold text-white">{link.label}</span>
                                <ArrowRight
                                    size={14}
                                    className="text-gray-600 group-hover:text-cyber-primary group-hover:translate-x-1 transition-all"
                                />
                            </div>
                        </button>
                    ))}
                </div>

                {/* Helpful Tip */}
                <div className="mt-6 pt-4 border-t border-white/5">
                    <div className="flex items-start gap-3 bg-cyber-primary/5 border border-cyber-primary/20 rounded-lg p-3">
                        <Zap className="text-cyber-primary shrink-0 mt-0.5" size={16} />
                        <div>
                            <p className="text-xs text-gray-300">
                                <span className="font-bold text-cyber-primary">Pro Tip:</span> Use the floating action button
                                (bottom-right corner) for quick access from anywhere in the app. Keyboard shortcuts available!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
