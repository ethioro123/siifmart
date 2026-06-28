
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Group, Circle, Line, Arrow, Path, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { KonvaEventObject } from 'konva/lib/Node';
import { Employee, UserRole, Site } from '../types';
import { User, Shield, Briefcase, Truck, ShoppingBag, Package } from 'lucide-react';

// === CONFIGURATION ===
const DEFAULT_CARD_WIDTH = 130;
const DEFAULT_CARD_HEIGHT = 125;
const SNAP_THRESHOLD = 20;

// Virtual Workspace Size (Fixed Bounds)
const WORKSPACE_WIDTH = 3000;
const WORKSPACE_HEIGHT = 2000;

// === ROLE LABELS & COLORS ===
const ROLE_LABELS: Record<string, string> = {
    // Level 1 - Executive
    super_admin: 'CEO',
    // Level 2 - Regional/Directors
    regional_manager: 'Regional Manager',
    operations_manager: 'Operations Manager',
    finance_manager: 'Finance Manager',
    hr_manager: 'HR Manager',
    procurement_manager: 'Procurement Manager',
    supply_chain_manager: 'Supply Chain Mgr',
    // Level 3 - Site Managers
    store_manager: 'Store Manager',
    warehouse_manager: 'Warehouse Manager',
    logistics_manager: 'Logistics Manager',
    inventory_manager: 'Inventory Manager',
    security_manager: 'Security Manager',
    dispatch_manager: 'Dispatch Manager',
    assistant_manager: 'Asst. Manager',
    shift_lead: 'Shift Lead',
    // Level 4 - Staff (Store)
    cashier: 'Cashier',
    sales_associate: 'Sales Associate',
    stock_clerk: 'Stock Clerk',
    customer_service: 'Customer Service',
    auditor: 'Auditor',
    it_support: 'IT Support',
    // Level 4 - Staff (Warehouse)
    picker: 'Picker',
    packer: 'Packer',
    receiver: 'Receiver',
    driver: 'Driver',
    forklift_operator: 'Forklift Op.',
    inventory_specialist: 'Inventory Spec.',
    buyer: 'Sourcing Buyer',
    demand_planner: 'Demand Planner',
    // Legacy (backwards compatibility)
    admin: 'Admin (Legacy)',
    manager: 'Manager',
    hr: 'HR',
    pos: 'POS Staff',
    dispatcher: 'Dispatcher',
    cs_manager: 'CS Manager',
    store_supervisor: 'Store Supervisor',
    returns_clerk: 'Returns Clerk',
    merchandiser: 'Merchandiser',
    loss_prevention: 'Loss Prevention',
    accountant: 'Accountant',
    data_analyst: 'Data Analyst',
    training_coordinator: 'Training Coord.',
};

// Hierarchical Card Sizing: Each level is exactly 10% smaller than the level above
// Level 1: CEO - Base size 200x160
// Level 2: Directors/Regional - 180x144 (90% of L1)
// Level 3: Site Managers - 162x130 (90% of L2)
// Level 4: Staff - 146x117 (90% of L3)
const CARD_SIZES: Record<string, { width: number; height: number; level: number }> = {
    // Level 1
    super_admin: { width: 200, height: 160, level: 1 },
    // Level 2
    regional_manager: { width: 180, height: 144, level: 2 },
    operations_manager: { width: 180, height: 144, level: 2 },
    finance_manager: { width: 180, height: 144, level: 2 },
    hr_manager: { width: 180, height: 144, level: 2 },
    procurement_manager: { width: 180, height: 144, level: 2 },
    supply_chain_manager: { width: 180, height: 144, level: 2 },
    // Level 3
    store_manager: { width: 162, height: 130, level: 3 },
    warehouse_manager: { width: 162, height: 130, level: 3 },
    logistics_manager: { width: 162, height: 130, level: 3 },
    inventory_manager: { width: 162, height: 130, level: 3 },
    security_manager: { width: 162, height: 130, level: 3 },
    dispatch_manager: { width: 162, height: 130, level: 3 },
    assistant_manager: { width: 162, height: 130, level: 3 },
    shift_lead: { width: 162, height: 130, level: 3 },
    // Level 4 - Store Staff
    cashier: { width: 146, height: 117, level: 4 },
    sales_associate: { width: 146, height: 117, level: 4 },
    stock_clerk: { width: 146, height: 117, level: 4 },
    customer_service: { width: 146, height: 117, level: 4 },
    auditor: { width: 146, height: 117, level: 4 },
    it_support: { width: 146, height: 117, level: 4 },
    // Level 4 - Warehouse Staff
    picker: { width: 146, height: 117, level: 4 },
    packer: { width: 146, height: 117, level: 4 },
    receiver: { width: 146, height: 117, level: 4 },
    driver: { width: 146, height: 117, level: 4 },
    forklift_operator: { width: 146, height: 117, level: 4 },
    inventory_specialist: { width: 146, height: 117, level: 4 },
    buyer: { width: 146, height: 117, level: 4 },
    demand_planner: { width: 146, height: 117, level: 4 },
    // Legacy
    admin: { width: 180, height: 144, level: 2 },
    manager: { width: 162, height: 130, level: 3 },
    hr: { width: 180, height: 144, level: 2 },
    pos: { width: 146, height: 117, level: 4 },
    dispatcher: { width: 162, height: 130, level: 3 },
    cs_manager: { width: 162, height: 130, level: 3 },
    store_supervisor: { width: 162, height: 130, level: 3 },
    returns_clerk: { width: 146, height: 117, level: 4 },
    merchandiser: { width: 146, height: 117, level: 4 },
    loss_prevention: { width: 146, height: 117, level: 4 },
    accountant: { width: 146, height: 117, level: 4 },
    data_analyst: { width: 146, height: 117, level: 4 },
    training_coordinator: { width: 146, height: 117, level: 4 },
    default: { width: 146, height: 117, level: 4 }
};

const ROLE_COLORS: Record<string, string> = {
    // Level 1 - Executive (Purple/Indigo)
    super_admin: '#6366f1',
    // Level 2 - Directors (Blue)
    regional_manager: '#3b82f6',
    operations_manager: '#3b82f6',
    finance_manager: '#3b82f6',
    hr_manager: '#3b82f6',
    procurement_manager: '#3b82f6',
    supply_chain_manager: '#3b82f6',
    // Level 3 - Managers (Teal)
    store_manager: '#14b8a6',
    warehouse_manager: '#14b8a6',
    logistics_manager: '#4f46e5',
    inventory_manager: '#0d9488',
    security_manager: '#e11d48',
    dispatch_manager: '#14b8a6',
    assistant_manager: '#14b8a6',
    shift_lead: '#14b8a6',
    buyer: '#d97706',
    demand_planner: '#7c3aed',
    // Level 4 - Staff (Slate)
    default: '#64748b',
    // Legacy
    admin: '#94a3b8',         // greyed out — stripped role
    manager: '#14b8a6',
    hr: '#3b82f6',
    pos: '#64748b',
    dispatcher: '#14b8a6',
    cs_manager: '#14b8a6',
    store_supervisor: '#14b8a6',
    returns_clerk: '#64748b',
    merchandiser: '#64748b',
    loss_prevention: '#64748b',
    accountant: '#64748b',
    data_analyst: '#64748b',
    training_coordinator: '#64748b',
};

// === TYPES ===

// ============================================================================
// HIERARCHY MODAL — Full-screen role reporting structure
// ============================================================================

const DEPT_COLORS: Record<string, { bg: string; bgDark: string; border: string; borderDark: string; text: string; textDark: string; dot: string }> = {
    executive:   { bg: '#f0f4f0', bgDark: '#1a2e1e', border: '#2C5E3B', borderDark: '#A9CBA2', text: '#1a3a22', textDark: '#A9CBA2', dot: '#2C5E3B' },
    store:       { bg: '#faf8f5', bgDark: '#232E27', border: '#4D6E56', borderDark: '#6a8f72', text: '#2C4D35', textDark: '#b8d4bc', dot: '#4D6E56' },
    warehouse:   { bg: '#f2f7f2', bgDark: '#1d2c20', border: '#3a6644', borderDark: '#7aab82', text: '#1e4028', textDark: '#9dc4a4', dot: '#3a6644' },
    finance:     { bg: '#fdf9f0', bgDark: '#2a2618', border: '#8a7340', borderDark: '#c8aa60', text: '#5a4a20', textDark: '#d4bc7a', dot: '#8a7340' },
    hr:          { bg: '#faf5f0', bgDark: '#2a2018', border: '#8a5a30', borderDark: '#c47840', text: '#5a3018', textDark: '#d4945a', dot: '#8a5a30' },
    procurement: { bg: '#f5f8f5', bgDark: '#1e2c22', border: '#567a5e', borderDark: '#8ab492', text: '#2a4e32', textDark: '#a8c8b0', dot: '#567a5e' },
    support:     { bg: '#f5f5f3', bgDark: '#21271e', border: '#6b7a6e', borderDark: '#8ea090', text: '#3a4a3c', textDark: '#9eb0a0', dot: '#6b7a6e' },
};

interface HierarchyNode {
    role: string;
    label: string;
    dept: string;
    reportsTo: string | null;
    children?: HierarchyNode[];
}

const HIERARCHY_TREE: HierarchyNode[] = [
    {
        role: 'super_admin', label: 'CEO', dept: 'executive', reportsTo: null,
        children: [
            {
                role: 'regional_manager', label: 'Regional Manager', dept: 'executive', reportsTo: 'CEO',
                children: [
                    {
                        role: 'operations_manager', label: 'Operations Manager', dept: 'executive', reportsTo: 'Regional Manager',
                        children: [
                            {
                                role: 'store_manager', label: 'Store Manager', dept: 'store', reportsTo: 'Operations Manager',
                                children: [
                                    {
                                        role: 'assistant_manager', label: 'Assistant Manager', dept: 'store', reportsTo: 'Store Manager',
                                        children: [
                                            { role: 'shift_lead', label: 'Shift Lead', dept: 'store', reportsTo: 'Assistant Manager',
                                              children: [
                                                { role: 'cashier', label: 'Cashier', dept: 'store', reportsTo: 'Shift Lead' },
                                                { role: 'sales_associate', label: 'Sales Associate', dept: 'store', reportsTo: 'Shift Lead' },
                                                { role: 'customer_service', label: 'Customer Service', dept: 'store', reportsTo: 'Shift Lead' },
                                              ]
                                            },
                                        ]
                                    },
                                    { role: 'store_supervisor', label: 'Store Supervisor', dept: 'store', reportsTo: 'Store Manager' },
                                    { role: 'merchandiser', label: 'Merchandiser', dept: 'store', reportsTo: 'Store Manager' },
                                    { role: 'returns_clerk', label: 'Returns Clerk', dept: 'store', reportsTo: 'Store Manager' },
                                ]
                            },
                            {
                                role: 'warehouse_manager', label: 'Warehouse Manager', dept: 'warehouse', reportsTo: 'Operations Manager',
                                children: [
                                    { role: 'receiver', label: 'Receiver', dept: 'warehouse', reportsTo: 'Warehouse Manager' },
                                    { role: 'picker', label: 'Picker', dept: 'warehouse', reportsTo: 'Warehouse Manager' },
                                    { role: 'packer', label: 'Packer', dept: 'warehouse', reportsTo: 'Warehouse Manager' },
                                    { role: 'forklift_operator', label: 'Forklift Operator', dept: 'warehouse', reportsTo: 'Warehouse Manager' },
                                ]
                            },
                            {
                                role: 'logistics_manager', label: 'Logistics Manager', dept: 'warehouse', reportsTo: 'Operations Manager',
                                children: [
                                    {
                                        role: 'dispatch_manager', label: 'Dispatch Manager', dept: 'warehouse', reportsTo: 'Logistics Manager',
                                        children: [
                                            { role: 'driver', label: 'Driver', dept: 'warehouse', reportsTo: 'Dispatch Manager' },
                                            { role: 'dispatcher', label: 'Dispatcher', dept: 'warehouse', reportsTo: 'Dispatch Manager' },
                                        ]
                                    }
                                ]
                            },
                            {
                                role: 'inventory_manager', label: 'Inventory Manager', dept: 'warehouse', reportsTo: 'Operations Manager',
                                children: [
                                    { role: 'inventory_specialist', label: 'Inventory Specialist', dept: 'warehouse', reportsTo: 'Inventory Manager' },
                                    { role: 'stock_clerk', label: 'Stock Clerk', dept: 'warehouse', reportsTo: 'Inventory Manager' },
                                ]
                            },
                            {
                                role: 'security_manager', label: 'Security & LP Manager', dept: 'support', reportsTo: 'Operations Manager',
                                children: [
                                    { role: 'loss_prevention', label: 'Loss Prevention', dept: 'store', reportsTo: 'Security & LP Manager' }
                                ]
                            }
                        ]
                    },
                    {
                        role: 'supply_chain_manager', label: 'Supply Chain Manager', dept: 'procurement', reportsTo: 'Regional Manager',
                        children: [
                            { role: 'demand_planner', label: 'Demand Planner', dept: 'procurement', reportsTo: 'Supply Chain Manager' }
                        ]
                    },
                ]
            },
            {
                role: 'finance_manager', label: 'Finance Manager', dept: 'finance', reportsTo: 'CEO',
                children: [
                    { role: 'auditor', label: 'Auditor', dept: 'finance', reportsTo: 'Finance Manager' },
                    { role: 'accountant', label: 'Accountant', dept: 'finance', reportsTo: 'Finance Manager' },
                    { role: 'data_analyst', label: 'Data Analyst', dept: 'finance', reportsTo: 'Finance Manager' },
                ]
            },
            {
                role: 'hr_manager', label: 'HR Manager', dept: 'hr', reportsTo: 'CEO',
                children: [
                    { role: 'hr', label: 'HR', dept: 'hr', reportsTo: 'HR Manager' },
                    { role: 'training_coordinator', label: 'Training Coordinator', dept: 'hr', reportsTo: 'HR Manager' },
                ]
            },
            {
                role: 'procurement_manager', label: 'Procurement Manager', dept: 'procurement', reportsTo: 'CEO',
                children: [
                    { role: 'buyer', label: 'Sourcing Buyer', dept: 'procurement', reportsTo: 'Procurement Manager' }
                ]
            },
            {
                role: 'it_support', label: 'IT Support', dept: 'support', reportsTo: 'CEO',
            },
        ]
    }
];

const RoleCard = ({ node, depth, isDarkMode }: { node: HierarchyNode; depth: number; isDarkMode: boolean }) => {
    const [open, setOpen] = React.useState(depth < 2);
    const colors = DEPT_COLORS[node.dept] || DEPT_COLORS.support;
    const hasChildren = node.children && node.children.length > 0;
    const isRoot = depth === 0;

    const bg = isDarkMode ? colors.bgDark : colors.bg;
    const border = isDarkMode ? colors.borderDark : colors.border;
    const textColor = isDarkMode ? colors.textDark : colors.text;
    const subColor = isDarkMode ? '#6b8070' : '#7a9080';

    return (
        <div className={depth === 0 ? 'ml-0' : 'ml-5'}>
            <div
                onClick={() => hasChildren && setOpen(o => !o)}
                className={`flex items-center gap-[10px] mb-1.5 rounded-[10px] transition-all duration-150 select-none ${
                    isRoot ? 'px-[18px] py-[12px] max-w-[280px]' : 'px-[14px] py-[9px] max-w-[260px]'
                } ${hasChildren ? 'cursor-pointer' : 'cursor-default'}`}
                ref={(el) => {
                    if (el) {
                        el.style.border = `1.5px solid ${border}`;
                        el.style.background = bg;
                    }
                }}
            >
                <span
                    className={`rounded-full shrink-0 ${isRoot ? 'w-3 h-3' : 'w-2 h-2'}`}
                    ref={(el) => {
                        if (el) el.style.background = colors.dot;
                    }}
                />

                <div className="flex-1 min-w-0">
                    <div
                        className={`truncate ${isRoot ? 'font-bold text-[15px]' : 'font-semibold text-[13px]'}`}
                        ref={(el) => {
                            if (el) el.style.color = textColor;
                        }}
                    >{node.label}</div>
                    {node.reportsTo && (
                        <div
                            className="text-[10px] mt-[1px]"
                            ref={(el) => {
                                if (el) el.style.color = subColor;
                            }}
                        >
                            Reports to {node.reportsTo}
                        </div>
                    )}
                </div>

                {hasChildren && (
                    <span
                        className={`text-[11px] opacity-60 transition-transform duration-200 inline-block font-bold ${
                            open ? 'rotate-90' : 'rotate-0'
                        }`}
                        ref={(el) => {
                            if (el) el.style.color = textColor;
                        }}
                    >▶</span>
                )}
            </div>

            {hasChildren && open && (
                <div
                    className={`pl-3 mb-1 ${isRoot ? 'ml-2.5' : 'ml-[14px]'}`}
                    ref={(el) => {
                        if (el) el.style.borderLeft = `2px solid ${border}`;
                    }}
                >
                    {node.children!.map(child => (
                        <RoleCard key={child.role} node={child} depth={depth + 1} isDarkMode={isDarkMode} />
                    ))}
                </div>
            )}
        </div>
    );
};

const HierarchyModal = ({ onClose, isDark }: { onClose: () => void; isDark: boolean }) => {
    // Uses the app's Woody Forest design tokens
    const bg       = isDark ? '#18201B' : '#F7F3ED';
    const surface  = isDark ? '#1E2822' : '#ffffff';
    const card     = isDark ? '#232E27' : '#ffffff';
    const border   = isDark ? 'rgba(169,203,162,0.1)' : '#E2DCCE';
    const text     = isDark ? '#e5e5e5' : '#111827';
    const subtext  = isDark ? '#7a9a82' : '#6b7a6e';
    const primary  = isDark ? '#A9CBA2' : '#2C5E3B';
    const accent   = isDark ? '#2C5E3B' : '#4D6E56';

    const depts = [
        { key: 'executive',   label: 'Executive',   emoji: '👑' },
        { key: 'store',       label: 'Store Ops',   emoji: '🏪' },
        { key: 'warehouse',   label: 'Warehouse',   emoji: '📦' },
        { key: 'finance',     label: 'Finance',     emoji: '💰' },
        { key: 'hr',          label: 'HR',          emoji: '👥' },
        { key: 'procurement', label: 'Procurement', emoji: '🔗' },
        { key: 'support',     label: 'Support',     emoji: '🛠' },
    ];

    return (
        <div
            className="fixed inset-0 z-[9999] backdrop-blur-[8px] flex items-stretch bg-[#0a180c]/75"
            ref={(el) => {
                if (el) el.style.animation = 'hmFadeIn 0.2s ease';
            }}
        >
            <style>{`
                @keyframes hmFadeIn  { from { opacity:0 } to { opacity:1 } }
                @keyframes hmSlideUp { from { transform:translateY(20px); opacity:0 } to { transform:translateY(0); opacity:1 } }
                .hm-scroll::-webkit-scrollbar { width: 4px; }
                .hm-scroll::-webkit-scrollbar-track { background: transparent; }
                .hm-scroll::-webkit-scrollbar-thumb { background: rgba(169,203,162,0.25); border-radius: 99px; }
                .hm-scroll::-webkit-scrollbar-thumb:hover { background: rgba(169,203,162,0.5); }
            `}</style>

            <div
                className="flex-1 flex flex-col overflow-hidden"
                ref={(el) => {
                    if (el) {
                        el.style.background = bg;
                        el.style.animation = 'hmSlideUp 0.25s ease';
                    }
                }}
            >
                {/* ── Header ── */}
                <div
                    className="flex items-center justify-between px-8 py-[18px] shrink-0"
                    ref={(el) => {
                        if (el) {
                            el.style.borderBottom = `1px solid ${border}`;
                            el.style.background = surface;
                        }
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-[18px]"
                            ref={(el) => {
                                if (el) el.style.background = `linear-gradient(135deg, ${accent}, ${primary})`;
                            }}
                        >🏢</div>
                        <div>
                            <div
                                className="font-bold text-[18px] tracking-[-0.3px] font-sans"
                                ref={(el) => {
                                    if (el) el.style.color = text;
                                }}
                            >Organisation Hierarchy</div>
                            <div
                                className="text-[11px] mt-[1px]"
                                ref={(el) => {
                                    if (el) el.style.color = subtext;
                                }}
                            >Click any role to expand or collapse its direct reports</div>
                        </div>
                    </div>

                    {/* Legend pills */}
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {depts.map(d => {
                            const c = DEPT_COLORS[d.key];
                            const pillBg     = isDark ? c.bgDark   : c.bg;
                            const pillBorder = isDark ? c.borderDark : c.border;
                            const pillText   = isDark ? c.textDark  : c.text;
                            return (
                                <div
                                    key={d.key}
                                    className="flex items-center gap-1.25 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                                    ref={(el) => {
                                        if (el) {
                                            el.style.background = pillBg;
                                            el.style.border = `1px solid ${pillBorder}`;
                                            el.style.color = pillText;
                                        }
                                    }}
                                >
                                    <span
                                        className="w-1.5 h-1.5 rounded-full"
                                        ref={(el) => {
                                            if (el) el.style.background = c.dot;
                                        }}
                                    />
                                    {d.emoji} {d.label}
                                </div>
                            );
                        })}

                        <button
                            onClick={onClose}
                            className="ml-2 w-[34px] h-[34px] rounded-full bg-transparent text-[18px] cursor-pointer flex items-center justify-center"
                            ref={(el) => {
                                if (el) {
                                    el.style.border = `1.5px solid ${border}`;
                                    el.style.color = subtext;
                                }
                            }}
                            title="Close"
                        >×</button>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="flex-1 overflow-hidden grid grid-cols-[320px_1fr]">
                    {/* Left: Collapsible Tree */}
                    <div
                        className="hm-scroll p-5 overflow-y-auto"
                        ref={(el) => {
                            if (el) {
                                el.style.borderRight = `1px solid ${border}`;
                                el.style.background = surface;
                            }
                        }}
                    >
                        <div
                            className="text-[10px] font-bold tracking-[0.12em] uppercase mb-3"
                            ref={(el) => {
                                if (el) el.style.color = subtext;
                            }}
                        >Reporting Tree</div>
                        {HIERARCHY_TREE.map(node => (
                            <RoleCard key={node.role} node={node} depth={0} isDarkMode={isDark} />
                        ))}
                    </div>

                    {/* Right: Department swimlane cards */}
                    <div
                        className="hm-scroll px-6 py-5 overflow-y-auto"
                        ref={(el) => {
                            if (el) el.style.background = bg;
                        }}
                    >
                        <div
                            className="text-[10px] font-bold tracking-[0.12em] uppercase mb-3.5"
                            ref={(el) => {
                                if (el) el.style.color = subtext;
                            }}
                        >By Department</div>

                        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3.5">
                            {[
                                {
                                    dept: 'executive', title: 'Executive', emoji: '👑',
                                    roles: [
                                        { role: 'super_admin',      label: 'CEO',                sub: '— Owner / Board' },
                                        { role: 'regional_manager', label: 'Regional Manager',   sub: '→ CEO' },
                                        { role: 'operations_manager', label: 'Operations Manager', sub: '→ Regional Manager' },
                                    ]
                                },
                                {
                                    dept: 'store', title: 'Store Operations', emoji: '🏪',
                                    roles: [
                                        { role: 'store_manager',     label: 'Store Manager',     sub: '→ Operations Manager' },
                                        { role: 'assistant_manager', label: 'Assistant Manager', sub: '→ Store Manager' },
                                        { role: 'shift_lead',        label: 'Shift Lead',        sub: '→ Assistant Manager' },
                                        { role: 'store_supervisor',  label: 'Store Supervisor',  sub: '→ Store Manager' },
                                        { role: 'cashier',           label: 'Cashier',           sub: '→ Shift Lead' },
                                        { role: 'sales_associate',   label: 'Sales Associate',   sub: '→ Shift Lead' },
                                        { role: 'customer_service',  label: 'Customer Service',  sub: '→ Shift Lead' },
                                        { role: 'merchandiser',      label: 'Merchandiser',      sub: '→ Store Manager' },
                                        { role: 'returns_clerk',     label: 'Returns Clerk',     sub: '→ Store Manager' },
                                    ]
                                },
                                {
                                    dept: 'warehouse', title: 'Warehouse', emoji: '📦',
                                    roles: [
                                        { role: 'warehouse_manager',  label: 'Warehouse Manager',    sub: '→ Operations Manager' },
                                        { role: 'logistics_manager',  label: 'Logistics Manager',    sub: '→ Operations Manager' },
                                        { role: 'inventory_manager',  label: 'Inventory Manager',    sub: '→ Operations Manager' },
                                        { role: 'dispatch_manager',   label: 'Dispatch Manager',     sub: '→ Logistics Manager' },
                                        { role: 'dispatcher',         label: 'Dispatcher',           sub: '→ Dispatch Manager' },
                                        { role: 'driver',             label: 'Driver',               sub: '→ Dispatch Manager' },
                                        { role: 'inventory_specialist', label: 'Inventory Specialist', sub: '→ Inventory Manager' },
                                        { role: 'stock_clerk',        label: 'Stock Clerk',          sub: '→ Inventory Manager' },
                                        { role: 'receiver',           label: 'Receiver',             sub: '→ Warehouse Manager' },
                                        { role: 'picker',             label: 'Picker',               sub: '→ Warehouse Manager' },
                                        { role: 'packer',             label: 'Packer',               sub: '→ Warehouse Manager' },
                                        { role: 'forklift_operator',  label: 'Forklift Operator',    sub: '→ Warehouse Manager' },
                                    ]
                                },
                                {
                                    dept: 'finance', title: 'Finance', emoji: '💰',
                                    roles: [
                                        { role: 'finance_manager', label: 'Finance Manager', sub: '→ CEO' },
                                        { role: 'auditor',         label: 'Auditor',         sub: '→ Finance Manager' },
                                        { role: 'accountant',      label: 'Accountant',      sub: '→ Finance Manager' },
                                        { role: 'data_analyst',    label: 'Data Analyst',    sub: '→ Finance Manager' },
                                    ]
                                },
                                {
                                    dept: 'hr', title: 'Human Resources', emoji: '👥',
                                    roles: [
                                        { role: 'hr_manager',           label: 'HR Manager',           sub: '→ CEO' },
                                        { role: 'hr',                   label: 'HR Staff',             sub: '→ HR Manager' },
                                        { role: 'training_coordinator', label: 'Training Coordinator', sub: '→ HR Manager' },
                                    ]
                                },
                                {
                                    dept: 'procurement', title: 'Procurement', emoji: '🔗',
                                    roles: [
                                        { role: 'procurement_manager',  label: 'Procurement Manager',  sub: '→ CEO' },
                                        { role: 'buyer',                label: 'Sourcing Buyer',       sub: '→ Procurement Manager' },
                                        { role: 'supply_chain_manager', label: 'Supply Chain Manager', sub: '→ Regional Manager' },
                                        { role: 'demand_planner',       label: 'Demand Planner',       sub: '→ Supply Chain Manager' },
                                    ]
                                },
                                {
                                    dept: 'support', title: 'Support & Security', emoji: '🛡',
                                    roles: [
                                        { role: 'security_manager', label: 'Security & LP Manager', sub: '→ Operations Manager' },
                                        { role: 'loss_prevention',  label: 'Loss Prevention',  sub: '→ Security & LP Manager' },
                                        { role: 'it_support',       label: 'IT Support',       sub: '→ CEO (cross-functional)' },
                                    ]
                                },
                            ].map(section => {
                                const c = DEPT_COLORS[section.dept];
                                const cardBg      = isDark ? c.bgDark    : c.bg;
                                const cardBorder  = isDark ? c.borderDark : c.border;
                                const headerText  = isDark ? c.textDark   : c.text;
                                return (
                                    <div
                                        key={section.dept}
                                        className="rounded-xl overflow-hidden"
                                        ref={(el) => {
                                            if (el) {
                                                el.style.border = `1px solid ${cardBorder}`;
                                                el.style.background = card;
                                            }
                                        }}
                                    >
                                        {/* Dept header */}
                                        <div
                                            className="px-3.5 py-2.5 flex items-center gap-1.75"
                                            ref={(el) => {
                                                if (el) {
                                                    el.style.background = cardBg;
                                                    el.style.borderBottom = `1px solid ${cardBorder}`;
                                                }
                                            }}
                                        >
                                            <span className="text-[14px]">{section.emoji}</span>
                                            <span
                                                className="font-bold text-[12px]"
                                                ref={(el) => {
                                                    if (el) el.style.color = headerText;
                                                }}
                                            >{section.title}</span>
                                            <span
                                                className="ml-auto text-white rounded-full px-[7px] py-[1px] text-[10px] font-bold"
                                                ref={(el) => {
                                                    if (el) el.style.background = c.dot;
                                                }}
                                            >{section.roles.length}</span>
                                        </div>

                                        {/* Role rows */}
                                        <div className="py-1.5">
                                            {section.roles.map((r, i) => (
                                                <div
                                                    key={r.role}
                                                    className="flex items-center gap-2.25 px-3.5 py-1.5"
                                                    ref={(el) => {
                                                        if (el) {
                                                            el.style.borderBottom = i < section.roles.length - 1
                                                                ? `1px solid ${isDark ? 'rgba(169,203,162,0.05)' : '#f5f2ed'}`
                                                                : 'none';
                                                        }
                                                    }}
                                                >
                                                    <span
                                                        className="w-1.5 h-1.5 rounded-full shrink-0"
                                                        ref={(el) => {
                                                            if (el) el.style.background = c.dot;
                                                        }}
                                                    />
                                                    <div className="min-w-0">
                                                        <div
                                                            className="text-[12px] font-semibold truncate"
                                                            ref={(el) => {
                                                                if (el) el.style.color = text;
                                                            }}
                                                        >{r.label}</div>
                                                        <div
                                                            className="text-[10px]"
                                                            ref={(el) => {
                                                                if (el) el.style.color = subtext;
                                                            }}
                                                        >{r.sub}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div
                    className="px-8 py-2.5 flex items-center justify-between shrink-0 font-sans"
                    ref={(el) => {
                        if (el) {
                            el.style.borderTop = `1px solid ${border}`;
                            el.style.background = surface;
                        }
                    }}
                >
                    <div
                        className="text-[11px]"
                        ref={(el) => {
                            if (el) el.style.color = subtext;
                        }}
                    >
                        {Object.keys(ROLE_LABELS).length} roles across 7 departments
                    </div>
                    <button
                        onClick={onClose}
                        className="px-[22px] py-2 rounded-[10px] cursor-pointer font-semibold text-[13px] transition-all hover:opacity-90"
                        ref={(el) => {
                            if (el) {
                                el.style.background = isDark
                                    ? `linear-gradient(135deg, ${accent}, ${primary}30)`
                                    : `linear-gradient(135deg, #2C5E3B, #4D6E56)`;
                                el.style.color = isDark ? primary : '#F7F3ED';
                                el.style.border = `1px solid ${isDark ? primary + '40' : '#2C5E3B'}`;
                            }
                        }}
                    >Close</button>
                </div>
            </div>
        </div>
    );
};

// === TYPES ===

interface OrgNode {
    id: string;
    x: number;
    y: number;
    role: UserRole;
    label: string;
    employee?: Employee;
}

interface Connection {
    id: string;
    from: string;
    to: string;
    fromHandle: 'top' | 'bottom' | 'left' | 'right';
    toHandle: 'top' | 'bottom' | 'left' | 'right';
}

// === AVATAR COMPONENT ===
const AvatarImage = ({ url, fallbackUrl, x, y, size }: { url: string; fallbackUrl?: string; x: number; y: number; size: number }) => {
    // Try loading without crossOrigin first (works with most URLs)
    const [image, status] = useImage(url);
    const [fallbackImage] = useImage(fallbackUrl || '');

    // Use primary image if loaded, else try fallback
    const displayImage = (status === 'loaded' && image) ? image : fallbackImage;

    return (
        <Group x={x} y={y}>
            <Circle radius={size / 2} fill="#e2e8f0" stroke="#cbd5e1" strokeWidth={1} />
            {displayImage && (
                <Group clipFunc={(ctx) => ctx.arc(0, 0, size / 2, 0, Math.PI * 2, false)}>
                    <KonvaImage
                        image={displayImage}
                        width={size}
                        height={size}
                        x={-size / 2}
                        y={-size / 2}
                    />
                </Group>
            )}
        </Group>
    );
};

// === THEME HELPERS ===
const useTheme = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const checkTheme = () => {
            const hasDarkClass = document.documentElement.classList.contains('dark');
            setIsDark(hasDarkClass);
        };

        checkTheme();

        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

    return isDark;
};

// === CARD COMPONENT ===
const OrgCard = ({
    node,
    isSelected,
    onSelect,
    onDragMove,
    onDragEnd,
    onConnectStart,
    onConnectEnd,
    isDark,
    isEditing
}: {
    node: OrgNode;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onDragMove: (e: KonvaEventObject<DragEvent>, id: string) => void;
    onDragEnd: (e: KonvaEventObject<DragEvent>, id: string) => void;
    onConnectStart: (nodeId: string, handle: string) => void;
    onConnectEnd: (nodeId: string, handle: string) => void;
    isDark: boolean;
    isEditing: boolean;
}) => {
    const bgColor = isSelected ? (isDark ? '#3730a3' : '#e0e7ff') : (isDark ? '#1e293b' : '#ffffff');
    const strokeColor = isSelected ? '#6366f1' : (isDark ? '#334155' : '#e2e8f0');
    // Ensure text is visible on dark cards - standard slate-900 or white is fine, but check contrast
    const textColor = isDark ? '#f8fafc' : '#1e293b';
    const subTextColor = isDark ? '#cbd5e1' : '#64748b';
    const headerColor = ROLE_COLORS[node.role] || ROLE_COLORS.default;

    // Dynamic Sizing based on hierarchy level
    const sizeConfig = CARD_SIZES[node.role] || CARD_SIZES.default;
    const { width, height, level } = sizeConfig;

    // Avatar and text sizing based on hierarchy level (10% scale differences)
    const avatarSizes = { 1: 88, 2: 72, 3: 65, 4: 58 };
    const fontSizes = {
        1: { role: 16, name: 12 },
        2: { role: 15, name: 11 },
        3: { role: 14, name: 10 },
        4: { role: 13, name: 9 }
    };

    const avatarSize = avatarSizes[level as keyof typeof avatarSizes] || 58;
    const avatarY = height * 0.35; // Positioned for balance
    const textStartY = avatarY + avatarSize / 2 + 10;
    const roleFontSize = fontSizes[level as keyof typeof fontSizes]?.role || 13;
    const nameFontSize = fontSizes[level as keyof typeof fontSizes]?.name || 9;

    // Handles - Adjusted for new layout if needed, but relative calc remains safely robust
    const handles = [
        { id: 'top', x: width / 2, y: 0 },
        { id: 'bottom', x: width / 2, y: height },
        { id: 'left', x: 0, y: height / 2 },
        { id: 'right', x: width, y: height / 2 },
    ];

    // Robust Avatar URL Logic
    const primaryAvatarUrl = (node.employee?.avatar && node.employee.avatar.length > 0) ? node.employee.avatar : '';
    const fallbackAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(node.label || 'User')}&background=random&size=128`;
    const avatarUrl = primaryAvatarUrl || fallbackAvatarUrl;

    return (
        <Group
            id={node.id}
            x={node.x}
            y={node.y}
            draggable
            onDragStart={() => onSelect(node.id)}
            onDragMove={(e) => onDragMove(e, node.id)}
            onDragEnd={(e) => onDragEnd(e, node.id)}
            onClick={() => onSelect(node.id)}
            onTap={() => onSelect(node.id)}
        >
            {/* Main Card Body */}
            <Rect
                width={width}
                height={height}
                fill={bgColor}
                stroke={strokeColor}
                strokeWidth={isSelected ? 2 : 1}
                cornerRadius={12}
                shadowBlur={10}
                shadowColor="rgba(0,0,0,0.1)"
                shadowOpacity={0.2}
            />

            {/* Top Color Accent (Minimal) */}
            <Rect
                width={width}
                height={4}
                fill={headerColor}
                cornerRadius={[12, 12, 0, 0]}
            />

            {/* Avatar - Dynamic Size */}
            <AvatarImage
                url={avatarUrl}
                fallbackUrl={fallbackAvatarUrl}
                x={width / 2}
                y={avatarY}
                size={avatarSize}
            />

            {/* Text Wrapper - Centered below avatar */}
            <Group x={5} y={textStartY} width={width - 10}>
                {/* Role Label - Prominent */}
                <Text
                    text={ROLE_LABELS[node.role] || node.role}
                    fontSize={roleFontSize}
                    fontStyle="bold"
                    fill={headerColor}
                    width={width - 10}
                    align="center"
                    wrap="none"
                    ellipsis={true}
                />

                {/* Name - Smaller & Secondary */}
                <Text
                    text={node.label}
                    fontSize={nameFontSize}
                    fontStyle="normal"
                    fill={subTextColor}
                    y={roleFontSize + 4}
                    width={width - 10}
                    align="center"
                    wrap="none"
                    ellipsis={true}
                />
            </Group>

            {/* Connection Handles (Only visible in Edit Mode) */}
            {isEditing && handles.map(h => (
                <Circle
                    key={h.id}
                    x={h.x}
                    y={h.y}
                    radius={5}
                    fill="#3b82f6"
                    stroke="#ffffff"
                    strokeWidth={2}
                    opacity={0.9}
                    onMouseEnter={(e) => {
                        const stage = e.target.getStage();
                        if (stage) stage.container().style.cursor = 'crosshair';
                    }}
                    onMouseLeave={(e) => {
                        const stage = e.target.getStage();
                        if (stage) stage.container().style.cursor = 'default';
                    }}
                    onMouseDown={(e) => {
                        e.cancelBubble = true;
                        onConnectStart(node.id, h.id);
                    }}
                    onMouseUp={(e) => {
                        e.cancelBubble = true;
                        onConnectEnd(node.id, h.id);
                    }}
                />
            ))}
        </Group>
    );
};

// === MAIN COMPONENT ===
interface OrgChartProps {
    employees: Employee[];
    sites?: Site[];
}

const OrgChart: React.FC<OrgChartProps> = ({ employees, sites }) => {
    const isDark = useTheme(); // Theme Hook
    const [nodes, setNodes] = useState<OrgNode[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [showHierarchy, setShowHierarchy] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
    const [guideLines, setGuideLines] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });
    const [isEditing, setIsEditing] = useState(false); // Edit Mode State

    // Add Card Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addModalTab, setAddModalTab] = useState<'empty' | 'existing'>('empty');
    const [newCardRole, setNewCardRole] = useState<UserRole>('pos');
    const [newCardLabel, setNewCardLabel] = useState('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

    // Connection State
    const [isConnecting, setIsConnecting] = useState(false);
    const [tempConnection, setTempConnection] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
    const connectionStartRef = useRef<{ nodeId: string; handle: string } | null>(null);
    const stageRef = useRef<any>(null);

    // Initial Load
    useEffect(() => {
        const saved = localStorage.getItem('konva-org-chart');
        if (saved) {
            const data = JSON.parse(saved);
            setNodes(data.nodes || []);
            setConnections(data.connections || []);
        } else if (employees.length > 0) {
            // Create initial card for first employee if empty
            const emp = employees.find(e => e.role === 'super_admin') || employees[0];
            setNodes([{
                id: `node-${Date.now()}`,
                x: 100,
                y: 100,
                role: emp.role,
                label: emp.name,
                employee: emp
            }]);
        }
    }, [employees]);

    // Save on Change
    useEffect(() => {
        if (nodes.length > 0) {
            localStorage.setItem('konva-org-chart', JSON.stringify({ nodes, connections }));
        }
    }, [nodes, connections]);

    // === HANDLERS ===

    const handleDragMove = useCallback((e: KonvaEventObject<DragEvent>, id: string) => {
        const node = nodes.find(n => n.id === id);
        if (!node) return;

        const stage = e.target.getStage();
        if (!stage) return;

        const x = e.target.x();
        const y = e.target.y();

        const size = CARD_SIZES[node.role] || CARD_SIZES.default;
        const w = size.width;
        const h = size.height;

        let bestSnapX: { val: number, line: number, dist: number } | null = null;
        let bestSnapY: { val: number, line: number, dist: number } | null = null;

        for (const other of nodes) {
            if (other.id === id) continue;

            const otherSize = CARD_SIZES[other.role] || CARD_SIZES.default;
            const ow = otherSize.width;
            const oh = otherSize.height;

            // X Points (Vertical Lines)
            const xPoints = [
                { line: other.x, mySnap: other.x }, // Left
                { line: other.x + ow, mySnap: other.x + ow - w }, // Right
                { line: other.x + ow / 2, mySnap: other.x + ow / 2 - w / 2 }, // Center
            ];

            for (const pt of xPoints) {
                const dist = Math.abs(x - pt.mySnap);
                if (dist < SNAP_THRESHOLD && (!bestSnapX || dist < bestSnapX.dist)) {
                    bestSnapX = { val: pt.mySnap, line: pt.line, dist };
                }
            }

            // Y Points (Horizontal Lines)
            const yPoints = [
                { line: other.y, mySnap: other.y }, // Top
                { line: other.y + oh, mySnap: other.y + oh - h }, // Bottom
                { line: other.y + oh / 2, mySnap: other.y + oh / 2 - h / 2 }, // Middle
                { line: other.y + oh + 60, mySnap: other.y + oh + 60 }, // Standard Spacing
            ];

            for (const pt of yPoints) {
                const dist = Math.abs(y - pt.mySnap);
                if (dist < SNAP_THRESHOLD && (!bestSnapY || dist < bestSnapY.dist)) {
                    bestSnapY = { val: pt.mySnap, line: pt.line, dist };
                }
            }
        }

        // Apply Snap & Guide Lines
        if (bestSnapX) {
            e.target.x(bestSnapX.val);
            setGuideLines(prev => ({ ...prev, x: [bestSnapX!.line] }));
        } else {
            setGuideLines(prev => ({ ...prev, x: [] }));
        }

        if (bestSnapY) {
            e.target.y(bestSnapY.val);
            setGuideLines(prev => ({ ...prev, y: [bestSnapY!.line] }));
        } else {
            setGuideLines(prev => ({ ...prev, y: [] }));
        }
    }, [nodes]);

    const handleDragEnd = useCallback((e: KonvaEventObject<DragEvent>, id: string) => {
        const node = nodes.find(n => n.id === id);
        if (!node) return;

        const x = e.target.x();
        const y = e.target.y();

        const size = CARD_SIZES[node.role] || CARD_SIZES.default;
        const w = size.width;
        const h = size.height;

        let bestSnapX: number | null = null;
        let bestSnapY: number | null = null;
        let minDistX = SNAP_THRESHOLD;
        let minDistY = SNAP_THRESHOLD;

        nodes.forEach(other => {
            if (other.id === id) return;

            const otherSize = CARD_SIZES[other.role] || CARD_SIZES.default;
            const ow = otherSize.width;
            const oh = otherSize.height;

            // X Points
            const xPoints = [
                { mySnap: other.x },
                { mySnap: other.x + ow - w },
                { mySnap: other.x + ow / 2 - w / 2 },
            ];
            xPoints.forEach(pt => {
                const dist = Math.abs(x - pt.mySnap);
                if (dist < minDistX) {
                    minDistX = dist;
                    bestSnapX = pt.mySnap;
                }
            });

            // Y Points
            const yPoints = [
                { mySnap: other.y },
                { mySnap: other.y + oh - h },
                { mySnap: other.y + oh / 2 - h / 2 },
                { mySnap: other.y + oh + 60 },
            ];
            yPoints.forEach(pt => {
                const dist = Math.abs(y - pt.mySnap);
                if (dist < minDistY) {
                    minDistY = dist;
                    bestSnapY = pt.mySnap;
                }
            });
        });

        const finalX = bestSnapX !== null ? bestSnapX : x;
        const finalY = bestSnapY !== null ? bestSnapY : y;

        setNodes(nds => nds.map(n => n.id === id ? { ...n, x: finalX, y: finalY } : n));
        setGuideLines({ x: [], y: [] });
    }, [nodes]);

    // Connection Logic
    const handleConnectStart = (nodeId: string, handle: string) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        const size = CARD_SIZES[node.role] || CARD_SIZES.default;
        const { width, height } = size;

        let startX = node.x;
        let startY = node.y;

        // Calculate absolute handle position
        if (handle === 'top') { startX += width / 2; }
        else if (handle === 'bottom') { startX += width / 2; startY += height; }
        else if (handle === 'left') { startY += height / 2; }
        else if (handle === 'right') { startX += width; startY += height / 2; }

        setIsConnecting(true);
        setTempConnection({ startX, startY, endX: startX, endY: startY });
        connectionStartRef.current = { nodeId, handle };
    };

    const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
        const stage = stageRef.current;
        if (!stage) return;

        // If Ctrl or Meta key is pressed, zoom (Always prevent default for zoom)
        if (e.evt.ctrlKey || e.evt.metaKey) {
            e.evt.preventDefault();
            const oldScale = stage.scaleX();
            const pointer = stage.getPointerPosition();
            if (!pointer) return;

            const mousePointTo = {
                x: (pointer.x - stage.x()) / oldScale,
                y: (pointer.y - stage.y()) / oldScale,
            };

            const scaleBy = 1.1;
            const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
            const finalScale = Math.max(0.1, Math.min(newScale, 3));

            stage.scale({ x: finalScale, y: finalScale });

            const newPos = {
                x: pointer.x - mousePointTo.x * finalScale,
                y: pointer.y - mousePointTo.y * finalScale,
            };
            stage.position(newPos);
            stage.batchDraw();
        } else {
            // Panning: Only prevent default if we haven't hit a boundary in the scroll direction
            const oldPos = stage.position();
            const scale = stage.scaleX();
            const viewportWidth = stage.width();
            const viewportHeight = stage.height();

            const margin = 200;
            const minX = -(WORKSPACE_WIDTH * scale) + viewportWidth - margin;
            const maxX = margin;
            const minY = -(WORKSPACE_HEIGHT * scale) + viewportHeight - margin;
            const maxY = margin;

            const wouldX = oldPos.x - e.evt.deltaX;
            const wouldY = oldPos.y - e.evt.deltaY;

            const clampedX = Math.max(minX, Math.min(maxX, wouldX));
            const clampedY = Math.max(minY, Math.min(maxY, wouldY));

            // If we are actually changing position (not stuck at a border), prevent browser scroll
            const isAtXBoundary = (e.evt.deltaX > 0 && oldPos.x <= minX) || (e.evt.deltaX < 0 && oldPos.x >= maxX);
            const isAtYBoundary = (e.evt.deltaY > 0 && oldPos.y <= minY) || (e.evt.deltaY < 0 && oldPos.y >= maxY);

            // If we're not at a boundary in the primary scroll direction, consume the event
            if (!isAtYBoundary || Math.abs(e.evt.deltaX) > Math.abs(e.evt.deltaY)) {
                e.evt.preventDefault();
                stage.position({ x: clampedX, y: clampedY });
                stage.batchDraw();
            }
        }
    };

    const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
        if (!isConnecting || !tempConnection) return;

        const stage = e.target.getStage();
        if (!stage) return;

        const point = stage.getPointerPosition();
        if (point) {
            // Must account for stage transform (pan/zoom)
            const scale = stage.scaleX();
            const transform = stage.getAbsoluteTransform().copy();
            transform.invert();
            const pos = transform.point(point);

            setTempConnection(prev => prev ? { ...prev, endX: pos.x, endY: pos.y } : null);
        }
    };

    const handleConnectEnd = (nodeId: string, handle: string) => {
        if (!isConnecting || !connectionStartRef.current) return;

        if (connectionStartRef.current.nodeId !== nodeId) {
            // Check for existing connection
            const exists = connections.some(c =>
                (c.from === connectionStartRef.current!.nodeId && c.to === nodeId) ||
                (c.from === nodeId && c.to === connectionStartRef.current!.nodeId)
            );

            if (!exists) {
                // Create connection
                const newConn: Connection = {
                    id: `conn-${Date.now()}`,
                    from: connectionStartRef.current.nodeId,
                    to: nodeId,
                    fromHandle: connectionStartRef.current.handle as any,
                    toHandle: handle as any
                };
                setConnections(prev => [...prev, newConn]);
            }
        }

        setIsConnecting(false);
        setTempConnection(null);
        connectionStartRef.current = null;
    };

    const handleStageMouseUp = (e: KonvaEventObject<MouseEvent>) => {
        // If clicking on empty stage (not a shape), deselect all
        if (e.target === e.target.getStage()) {
            setSelectedId(null);
            setSelectedConnectionId(null);
        }

        if (isConnecting) {
            setIsConnecting(false);
            setTempConnection(null);
            connectionStartRef.current = null;
        }
    };

    // Helper to get handle coords (Updated for dynamic sizes)
    const getHandleCoords = (nodeId: string, handle: string) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return { x: 0, y: 0 };

        const size = CARD_SIZES[node.role] || CARD_SIZES.default;
        const { width, height } = size;

        let x = node.x;
        let y = node.y;
        if (handle === 'top') { x += width / 2; }
        else if (handle === 'bottom') { x += width / 2; y += height; }
        else if (handle === 'left') { y += height / 2; }
        else if (handle === 'right') { x += width; y += height / 2; }
        return { x, y };
    };

    // Helper to calculate SVG path data with fixed-radius rounded corners
    const pointsToSVG = (points: { x: number, y: number }[], radius: number = 10) => {
        if (points.length < 2) return "";
        let path = `M ${points[0].x} ${points[0].y}`;

        for (let i = 1; i < points.length; i++) {
            const p1 = points[i - 1];
            const p2 = points[i];
            const p3 = points[i + 1];

            if (p3) {
                // Calculate vector to p2 and p3
                const d1 = { x: p2.x - p1.x, y: p2.y - p1.y };
                const d2 = { x: p3.x - p2.x, y: p3.y - p2.y };
                const len1 = Math.sqrt(d1.x * d1.x + d1.y * d1.y);
                const len2 = Math.sqrt(d2.x * d2.x + d2.y * d2.y);

                const currentRadius = Math.min(radius, len1 / 2, len2 / 2);

                const q1 = {
                    x: p2.x - (d1.x / len1) * currentRadius,
                    y: p2.y - (d1.y / len1) * currentRadius
                };
                const q2 = {
                    x: p2.x + (d2.x / len2) * currentRadius,
                    y: p2.y + (d2.y / len2) * currentRadius
                };

                path += ` L ${q1.x} ${q1.y} Q ${p2.x} ${p2.y} ${q2.x} ${q2.y}`;
            } else {
                path += ` L ${p2.x} ${p2.y}`;
            }
        }
        return path;
    };
    // Helper to calculate curved/orthogonal path points with obstacle avoidance
    const getConnectionPath = (fromId: string, fromHandle: string, toId: string, toHandle: string) => {
        const start = getHandleCoords(fromId, fromHandle);
        const end = getHandleCoords(toId, toHandle);

        const offset = 30;
        const startOffset = { x: start.x, y: start.y };
        if (fromHandle === 'top') startOffset.y -= offset;
        else if (fromHandle === 'bottom') startOffset.y += offset;
        else if (fromHandle === 'left') startOffset.x -= offset;
        else if (fromHandle === 'right') startOffset.x += offset;

        const endOffset = { x: end.x, y: end.y };
        if (toHandle === 'top') endOffset.y -= offset;
        else if (toHandle === 'bottom') endOffset.y += offset;
        else if (toHandle === 'left') endOffset.x -= offset;
        else if (toHandle === 'right') endOffset.x += offset;

        const otherNodes = nodes.filter(n => n.id !== fromId && n.id !== toId);
        const isRectBlocked = (x1: number, y1: number, x2: number, y2: number) => {
            const minX = Math.min(x1, x2);
            const maxX = Math.max(x1, x2);
            const minY = Math.min(y1, y2);
            const maxY = Math.max(y1, y2);

            return otherNodes.some(n => {
                const s = CARD_SIZES[n.role] || CARD_SIZES.default;
                const margin = 15;
                const rx1 = n.x - margin;
                const rx2 = n.x + s.width + margin;
                const ry1 = n.y - margin;
                const ry2 = n.y + s.height + margin;

                // Check intersection
                return !(maxX < rx1 || minX > rx2 || maxY < ry1 || minY > ry2);
            });
        };

        let midX = (startOffset.x + endOffset.x) / 2;
        let midY = (startOffset.y + endOffset.y) / 2;

        // Attempt basic obstacle avoidance by shifting midpoints
        if (fromHandle === 'bottom' || fromHandle === 'top') {
            // Check if vertical segment or horizontal segment is blocked
            if (isRectBlocked(startOffset.x, startOffset.y, startOffset.x, midY) ||
                isRectBlocked(startOffset.x, midY, endOffset.x, midY)) {
                // Try shifting midY to find clearance
                const candidates = [midY, startOffset.y + 60, endOffset.y - 60, midY - 60, midY + 60];
                for (const c of candidates) {
                    if (!isRectBlocked(startOffset.x, startOffset.y, startOffset.x, c) &&
                        !isRectBlocked(startOffset.x, c, endOffset.x, c)) {
                        midY = c;
                        break;
                    }
                }
            }
            return [start, startOffset, { x: startOffset.x, y: midY }, { x: endOffset.x, y: midY }, endOffset, end];
        } else {
            if (isRectBlocked(startOffset.x, startOffset.y, midX, startOffset.y) ||
                isRectBlocked(midX, startOffset.y, midX, endOffset.y)) {
                const candidates = [midX, startOffset.x + 60, endOffset.x - 60, midX - 60, midX + 60];
                for (const c of candidates) {
                    if (!isRectBlocked(startOffset.x, startOffset.y, c, startOffset.y) &&
                        !isRectBlocked(c, startOffset.y, c, endOffset.y)) {
                        midX = c;
                        break;
                    }
                }
            }
            return [start, startOffset, { x: midX, y: startOffset.y }, { x: midX, y: endOffset.y }, endOffset, end];
        }
    };

    // Add Card Handler (Modified to open modal)
    const handleAddCardClick = () => {
        setIsAddModalOpen(true);
        setNewCardLabel('');
        setSelectedEmployeeId('');
    };

    const confirmAddCard = () => {
        let newNode: OrgNode;
        const centerX = -1 * (stageRef.current?.x() || 0) + window.innerWidth / 2;
        const centerY = -1 * (stageRef.current?.y() || 0) + 400; // Approx center

        if (addModalTab === 'empty') {
            newNode = {
                id: `node-${Date.now()}`,
                x: centerX,
                y: centerY,
                role: newCardRole,
                label: newCardLabel || ROLE_LABELS[newCardRole] || 'New Role',
            };
        } else {
            const emp = employees.find(e => e.id === selectedEmployeeId);
            if (!emp) return;

            // Check Duplicate
            if (nodes.some(n => n.employee?.id === emp.id)) {
                alert('This employee is already in the chart!');
                return;
            }

            newNode = {
                id: `node-${Date.now()}`,
                x: centerX,
                y: centerY,
                role: emp.role,
                label: emp.name,
                employee: emp
            };
        }

        setNodes(curr => [...curr, newNode]);
        setIsAddModalOpen(false);
    };

    const handleZoomIn = () => {
        const stage = stageRef.current;
        if (!stage) return;
        const oldScale = stage.scaleX();
        const newScale = Math.min(oldScale * 1.2, 3);
        stage.scale({ x: newScale, y: newScale });
        stage.batchDraw();
    };

    const handleZoomOut = () => {
        const stage = stageRef.current;
        if (!stage) return;
        const oldScale = stage.scaleX();
        const newScale = Math.max(oldScale / 1.2, 0.1);
        stage.scale({ x: newScale, y: newScale });
        stage.batchDraw();
    };

    const handleZoomFit = () => {
        const stage = stageRef.current;
        if (!stage) return;
        stage.scale({ x: 1, y: 1 });
        stage.position({ x: 0, y: 0 });
        stage.batchDraw();
    };

    const clearCanvas = () => {
        if (window.confirm("Clear all cards?")) {
            setNodes([]);
            setConnections([]);
        }
    }

    // Delete Node Handler - Instant
    const handleDeleteNode = useCallback((nodeId: string) => {
        setNodes(nds => nds.filter(n => n.id !== nodeId));
        setConnections(conns => conns.filter(c => c.from !== nodeId && c.to !== nodeId));
        setSelectedId(null);
    }, []);

    // Delete Connection Handler
    const handleDeleteConnection = useCallback((connId: string) => {
        setConnections(conns => conns.filter(c => c.id !== connId));
        setSelectedConnectionId(null);
    }, []);

    // Keyboard shortcut for delete
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'Delete' || e.key === 'Backspace')) {
                // Don't trigger if user is typing
                if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'SELECT') return;

                if (selectedId) {
                    handleDeleteNode(selectedId);
                } else if (selectedConnectionId) {
                    handleDeleteConnection(selectedConnectionId);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, selectedConnectionId, handleDeleteNode, handleDeleteConnection]);



    return (
        <div className="w-full h-full flex flex-col relative bg-transparent">
            {/* Full-screen Hierarchy Modal */}
            {showHierarchy && (
                <HierarchyModal onClose={() => setShowHierarchy(false)} isDark={isDark} />
            )}
            {/* Header Toolbar */}
            <div className={`flex items-center justify-between px-4 py-3 border-b z-10 shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-4">
                    <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Org Chart Editor <span className="text-xs font-normal text-gray-500 ml-2">(Konva)</span></h3>

                    {/* Integrated Explainer Text */}
                    <div className={`hidden lg:block text-[10px] uppercase tracking-wider font-semibold opacity-50 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        Scroll to Pan • Cmd + Scroll to Zoom • Drag Nodes to Snap
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Hierarchy View Button */}
                    <button
                        onClick={() => setShowHierarchy(true)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded border transition-colors ${
                            isDark
                                ? 'bg-violet-900/30 border-violet-700 text-violet-300 hover:bg-violet-900/50'
                                : 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100'
                        }`}
                        title="View full reporting hierarchy"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h12M3 17h6" />
                        </svg>
                        Hierarchy
                    </button>
                    {/* Zoom Controls */}
                    <div className={`flex items-center gap-1 px-2 py-1 rounded border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                        <button onClick={handleZoomOut} className={`p-1 rounded hover:bg-gray-200 ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'text-gray-600'}`} title="Zoom Out (-)">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                        </button>
                        <button onClick={handleZoomFit} className={`px-2 py-0.5 text-[10px] font-bold rounded hover:bg-gray-200 ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'text-gray-600'}`} title="Reset Zoom">
                            FIT
                        </button>
                        <button onClick={handleZoomIn} className={`p-1 rounded hover:bg-gray-200 ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'text-gray-600'}`} title="Zoom In (+)">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className={`px-3 py-1.5 text-sm font-medium rounded ${isEditing ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            {isEditing ? 'Done Editing' : 'Edit Mode'}
                        </button>
                        {isEditing && (
                            <>
                                {selectedId && (
                                    <button onClick={() => handleDeleteNode(selectedId)} className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-100">Delete Card</button>
                                )}
                                {selectedConnectionId && (
                                    <button onClick={() => handleDeleteConnection(selectedConnectionId)} className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-100">Delete Link</button>
                                )}
                                <button onClick={handleAddCardClick} className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-sm">+ Add Card</button>
                                <button onClick={clearCanvas} className={`px-3 py-1.5 text-sm font-medium rounded border ${isDark ? 'text-red-400 border-red-900/30 bg-red-900/10 hover:bg-red-900/20' : 'text-red-600 border-red-100 bg-red-50 hover:bg-red-100'}`}>Reset</button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className={`flex-1 overflow-hidden relative ${isConnecting ? 'cursor-crosshair' : 'cursor-grab'}`}>
                <Stage
                    width={window.innerWidth}
                    height={800} // Reset to sensible viewport height
                    draggable
                    onWheel={handleWheel}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleStageMouseUp}
                    dragBoundFunc={(pos) => {
                        const stage = stageRef.current;
                        if (!stage) return pos;
                        const scale = stage.scaleX();
                        const viewportWidth = stage.width();
                        const viewportHeight = stage.height();
                        const margin = 200;

                        const minX = -(WORKSPACE_WIDTH * scale) + viewportWidth - margin;
                        const maxX = margin;
                        const minY = -(WORKSPACE_HEIGHT * scale) + viewportHeight - margin;
                        const maxY = margin;

                        return {
                            x: Math.max(minX, Math.min(maxX, pos.x)),
                            y: Math.max(minY, Math.min(maxY, pos.y))
                        };
                    }}
                    ref={(stage) => {
                        if (stage) {
                            stage.container().style.background = 'transparent';
                            stageRef.current = stage;
                        } else {
                            stageRef.current = null;
                        }
                    }}
                >
                    <Layer>
                        {/* Guide Lines */}
                        {guideLines.x.map((gx, i) => (
                            <Line
                                key={`v-${i}`}
                                points={[gx, -WORKSPACE_HEIGHT, gx, WORKSPACE_HEIGHT * 2]}
                                stroke="#3b82f6" strokeWidth={1} dash={[5, 5]}
                            />
                        ))}
                        {guideLines.y.map((gy, i) => (
                            <Line
                                key={`h-${i}`}
                                points={[-WORKSPACE_WIDTH, gy, WORKSPACE_WIDTH * 2, gy]}
                                stroke="#3b82f6" strokeWidth={1} dash={[5, 5]}
                            />
                        ))}

                        {/* Connections */}
                        {connections.map(conn => {
                            const pathPoints = getConnectionPath(conn.from, conn.fromHandle, conn.to, conn.toHandle);
                            const pathData = pointsToSVG(pathPoints, 12);
                            const isSelected = selectedConnectionId === conn.id;

                            const last = pathPoints[pathPoints.length - 1];
                            const prev = pathPoints[pathPoints.length - 2];

                            return (
                                <Group key={conn.id} onClick={(e) => {
                                    e.cancelBubble = true;
                                    setSelectedConnectionId(conn.id);
                                    setSelectedId(null);
                                }}>
                                    <Path
                                        data={pathData}
                                        stroke={isSelected ? '#3b82f6' : (isDark ? '#475569' : '#cbd5e1')}
                                        strokeWidth={isSelected ? 4 : 2}
                                    />
                                    <Arrow
                                        points={[prev.x, prev.y, last.x, last.y]}
                                        stroke={isSelected ? '#3b82f6' : (isDark ? '#475569' : '#cbd5e1')}
                                        strokeWidth={isSelected ? 4 : 2}
                                        fill={isSelected ? '#3b82f6' : (isDark ? '#475569' : '#cbd5e1')}
                                        pointerLength={10}
                                        pointerWidth={10}
                                    />
                                    {/* Invisible hit area */}
                                    <Path
                                        data={pathData}
                                        stroke="transparent"
                                        strokeWidth={20}
                                    />
                                </Group>
                            );
                        })}

                        {/* Temp Connection Line */}
                        {tempConnection && (
                            <Line
                                points={[
                                    tempConnection.startX, tempConnection.startY,
                                    (tempConnection.startX + tempConnection.endX) / 2, tempConnection.startY,
                                    (tempConnection.startX + tempConnection.endX) / 2, tempConnection.endY,
                                    tempConnection.endX, tempConnection.endY
                                ]}
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dash={[5, 5]}
                            />
                        )}

                        {/* Nodes */}
                        {nodes.map(node => (
                            <OrgCard
                                key={node.id}
                                node={node}
                                isSelected={selectedId === node.id}
                                onSelect={(id) => {
                                    if (isEditing) {
                                        setSelectedId(id);
                                        setSelectedConnectionId(null);
                                    }
                                }}
                                onDragMove={handleDragMove}
                                onDragEnd={handleDragEnd}
                                onConnectStart={handleConnectStart}
                                onConnectEnd={handleConnectEnd}
                                isDark={isDark}
                                isEditing={isEditing}
                            />
                        ))}
                    </Layer>
                </Stage>
            </div>

            {/* Add Card Modal */}
            {
                isAddModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsAddModalOpen(false)}>
                        <div className={`w-full max-w-md rounded-lg shadow-xl p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Add New Card</h3>

                            {/* Tabs */}
                            <div className="flex border-b mb-4">
                                <button
                                    onClick={() => setAddModalTab('empty')}
                                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${addModalTab === 'empty' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Empty Card
                                </button>
                                <button
                                    onClick={() => setAddModalTab('existing')}
                                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${addModalTab === 'existing' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Existing Employee
                                </button>
                            </div>

                            {/* Tab Content */}
                            {addModalTab === 'empty' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Role/Position</label>
                                        <select
                                            value={newCardRole}
                                            onChange={(e) => setNewCardRole(e.target.value as UserRole)}
                                            title="Select a role or position"
                                            className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                        >
                                            {Object.entries(ROLE_LABELS).map(([role, label]) => (
                                                <option key={role} value={role}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Label (Optional)</label>
                                        <input
                                            type="text"
                                            value={newCardLabel}
                                            onChange={(e) => setNewCardLabel(e.target.value)}
                                            placeholder="e.g. John Doe or Leave empty for role name"
                                            className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Select Employee</label>
                                    <select
                                        value={selectedEmployeeId}
                                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                        title="Select an employee"
                                        className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                    >
                                        <option value="">-- Select an employee --</option>
                                        {employees
                                            .filter(emp => !nodes.some(n => n.employee?.id === emp.id))
                                            .map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.name} ({ROLE_LABELS[emp.role] || emp.role})</option>
                                            ))
                                        }
                                    </select>
                                    {employees.filter(emp => !nodes.some(n => n.employee?.id === emp.id)).length === 0 && (
                                        <p className="text-sm text-gray-500 mt-2">All employees are already in the chart.</p>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className={`px-4 py-2 text-sm rounded ${isDark ? 'text-gray-300 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmAddCard}
                                    disabled={addModalTab === 'existing' && !selectedEmployeeId}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Add Card
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default OrgChart;
