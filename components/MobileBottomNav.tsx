import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ClipboardList, ShoppingCart, LayoutDashboard, User } from 'lucide-react';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { native } from '../utils/native';

export const MobileBottomNav: React.FC = () => {
    const { user } = useStore();
    const { activeSite } = useData();
    const location = useLocation();

    // Only render in Clean Mobile / Android Mode or on small mobile screens
    if (!user || !native.isCleanMobileMode()) return null;

    const siteType = activeSite?.type || '';
    const isWarehouse = ['Warehouse', 'Distribution Center', 'WMS', 'Fulfillment Center'].includes(siteType);

    const opsPath = isWarehouse ? '/wms-dashboard' : '/pos-dashboard';
    const opsLabel = isWarehouse ? 'WMS Ops' : 'POS Ops';

    const navTabs = [
        {
            to: '/wms-ops',
            label: 'Fulfillment',
            icon: ClipboardList
        },
        {
            to: '/pos',
            label: 'POS Register',
            icon: ShoppingCart
        },
        {
            to: opsPath,
            label: opsLabel,
            icon: LayoutDashboard
        },
        {
            to: '/profile',
            label: 'Profile',
            icon: User
        }
    ];

    return (
        <nav
            aria-label="Mobile Navigation Bar"
            className="fixed bottom-0 left-0 right-0 z-[900] bg-[#151D18]/95 backdrop-blur-lg border-t border-[#2C5E3B]/30 pb-safe pt-1.5 px-3 shadow-[0_-4px_20px_rgba(0,0,0,0.4)] flex justify-around items-center"
        >
            {navTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = location.pathname.startsWith(tab.to);

                return (
                    <NavLink
                        key={tab.to}
                        to={tab.to}
                        className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 min-w-[64px] min-h-[48px] ${isActive
                            ? 'text-[#A9CBA2] font-black'
                            : 'text-stone-400 hover:text-white'
                            }`}
                    >
                        <div
                            className={`p-1.5 rounded-xl transition-all ${isActive
                                ? 'bg-[#2C5E3B] text-white scale-110 shadow-[0_0_12px_rgba(44,94,59,0.5)]'
                                : 'bg-transparent'
                                }`}
                        >
                            <Icon size={20} />
                        </div>
                        <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'text-[#EAE5D9]' : 'text-stone-400'}`}>
                            {tab.label}
                        </span>
                    </NavLink>
                );
            })}
        </nav>
    );
};
