import React from 'react';
import {
    Crown,
    Store,
    Warehouse,
    CircleDollarSign,
    Users,
    Truck,
    ShieldAlert,
    Building2,
    ShieldCheck,
    Zap
} from 'lucide-react';

export const getDeptIcon = (key: string, size = 16) => {
    switch (key) {
        case 'executive': return <Crown size={size} />;
        case 'store': return <Store size={size} />;
        case 'warehouse': return <Warehouse size={size} />;
        case 'finance': return <CircleDollarSign size={size} />;
        case 'hr': return <Users size={size} />;
        case 'procurement': return <Truck size={size} />;
        case 'support': return <ShieldAlert size={size} />;
        default: return <Building2 size={size} />;
    }
};

export const getTierIcon = (level: number, size = 16) => {
    switch (level) {
        case 1: return <Crown size={size} />;
        case 2: return <Building2 size={size} />;
        case 3: return <ShieldCheck size={size} />;
        case 4: default: return <Zap size={size} />;
    }
};

export const STANDARD_DEPTS = [
    { key: 'executive', label: 'Executive Leadership' },
    { key: 'store', label: 'Store Operations' },
    { key: 'warehouse', label: 'Warehouse & Logistics' },
    { key: 'finance', label: 'Finance & Accounts' },
    { key: 'hr', label: 'Human Resources' },
    { key: 'procurement', label: 'Procurement & Supply' },
    { key: 'support', label: 'IT & Loss Prevention' },
];
