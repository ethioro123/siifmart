import React from 'react';
import { OrgLayoutNode, ROLE_LABELS, DEPT_COLORS } from '../types';
import { ChevronDown, ChevronRight, MapPin, ShieldCheck, User } from 'lucide-react';

interface OrgTreeNodeCardProps {
    layoutNode: OrgLayoutNode;
    isDark: boolean;
    onlineIds?: Set<string>;
    onSelect: (layoutNode: OrgLayoutNode) => void;
    onToggleCollapse: (nodeId: string) => void;
}

export const OrgTreeNodeCard: React.FC<OrgTreeNodeCardProps> = ({
    layoutNode,
    isDark,
    onlineIds,
    onSelect,
    onToggleCollapse
}) => {
    const { node, isCollapsed, hasChildren, isSearchMatch } = layoutNode;
    const emp = node.employee;
    const roleLabel = ROLE_LABELS[node.role] || node.role;
    const deptConfig = DEPT_COLORS[node.department] || DEPT_COLORS.support;

    const isOnline = onlineIds ? (emp?.id ? onlineIds.has(emp.id) : false) : false;
    const avatarUrl = emp?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(node.label)}&background=2C5E3B&color=EAE5D9&size=96`;

    return (
        <div
            style={{
                transform: `translate(${layoutNode.x}px, ${layoutNode.y}px)`,
                width: `${layoutNode.width}px`,
                height: `${layoutNode.height}px`,
            }}
            className="absolute top-0 left-0 transition-transform duration-200"
        >
            <div
                onClick={() => onSelect(layoutNode)}
                className={`group relative h-full w-full rounded-xl border p-2.5 flex flex-col justify-between cursor-pointer select-none transition-all duration-150 ${
                    isDark
                        ? 'bg-[#1E2822] hover:bg-[#25322A] border-[#2C4D35] text-[#FAF8F5] shadow-md shadow-black/40'
                        : 'bg-white hover:bg-[#FAF8F5] border-[#E2DCCE] text-[#1E3F27] shadow-sm hover:shadow-md'
                } ${
                    isSearchMatch
                        ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-transparent shadow-lg shadow-amber-500/20'
                        : ''
                }`}
            >
                {/* Header row: Avatar, Name, Code */}
                <div className="flex items-start gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                        <img
                            src={avatarUrl}
                            alt={node.label}
                            className="w-10 h-10 rounded-full object-cover border border-[#2C5E3B]/20 dark:border-white/10"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(node.label)}&background=2C5E3B&color=EAE5D9&size=96`;
                            }}
                        />
                        <div
                            title={isOnline ? 'Online now' : 'Offline'}
                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#1E2822] transition-colors duration-500 ${
                                isOnline
                                    ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.7)] animate-pulse'
                                    : 'bg-stone-300 dark:bg-stone-600'
                            }`}
                        />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs truncate leading-tight group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors">
                                {node.label}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                                {emp?.status === 'On Leave' && (
                                    <span className="text-[8px] font-semibold px-1 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                        Leave
                                    </span>
                                )}
                                {emp?.code && (
                                    <span className={`text-[9px] font-mono px-1 py-0.5 rounded font-semibold ${
                                        isDark ? 'bg-black/30 text-emerald-400' : 'bg-[#EAE5D9]/70 text-[#2C5E3B]'
                                    }`}>
                                        {emp.code}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Role pill */}
                        <div className="mt-1 flex items-center gap-1">
                            <span
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full truncate"
                                style={{
                                    backgroundColor: isDark ? deptConfig.bgDark : deptConfig.bg,
                                    color: isDark ? deptConfig.textDark : deptConfig.text,
                                    border: `1px solid ${isDark ? deptConfig.borderDark : deptConfig.border}`
                                }}
                            >
                                {roleLabel}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer row: Site & Reports Counter */}
                <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400 truncate max-w-[120px]" title={node.siteName || 'All Sites'}>
                        <MapPin size={11} className="shrink-0 text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        <span className="truncate">{node.siteName || 'All Sites'}</span>
                    </div>

                    {hasChildren && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleCollapse(node.id);
                            }}
                            className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full font-bold text-[10px] transition-colors cursor-pointer ${
                                isDark
                                    ? 'bg-[#2C5E3B]/40 hover:bg-[#2C5E3B]/70 text-[#A9CBA2] border border-[#2C5E3B]'
                                    : 'bg-[#2C5E3B]/10 hover:bg-[#2C5E3B]/20 text-[#2C5E3B] border border-[#2C5E3B]/30'
                            }`}
                            title={isCollapsed ? 'Expand direct reports' : 'Collapse direct reports'}
                        >
                            <span>{node.directReportCount}</span>
                            {isCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrgTreeNodeCard;
