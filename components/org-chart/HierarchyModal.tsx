import React from 'react';
import { HierarchyNode, DEPT_COLORS, ROLE_LABELS, HIERARCHY_TREE } from './types';
import { RoleCard } from './RoleCard';

interface HierarchyModalProps {
    onClose: () => void;
    isDark: boolean;
}

export const HierarchyModal: React.FC<HierarchyModalProps> = ({ onClose, isDark }) => {
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
export default HierarchyModal;
