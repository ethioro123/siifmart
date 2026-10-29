import React from 'react';
import { OrgLayoutNode, ROLE_LABELS, DEPT_COLORS } from '../types';
import { ChevronDown, ChevronRight, MapPin, ShieldCheck, User } from 'lucide-react';
import { formatDisplayEmployeeId } from '../../../utils/employeeIdGenerator';
import { getEmployeeJobTitle } from '../../../utils/roles';

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
    const roleLabel = emp ? getEmployeeJobTitle(emp) : (ROLE_LABELS[node.role] || node.role);
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
                        ? 'bg-[#1E2822] hover:bg-[#25322A] border-[#2C4D35] text-[var(--theme-text-primary)] shadow-md '
                        : 'bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-app)] border-[var(--theme-border)] text-[var(--theme-text-primary)] shadow-sm hover:shadow-md'
                } ${
                    isSearchMatch
                        ? 'ring-2 ring-[var(--theme-status-warning-border)] ring-offset-2 ring-offset-transparent shadow-lg '
                        : ''
                }`}
            >
                {/* Header row: Avatar, Name, Code */}
                <div className="flex items-start gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                        <img
                            src={avatarUrl}
                            alt={node.label}
                            className="w-10 h-10 rounded-full object-cover border border-[var(--theme-border)]/20 border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)]"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(node.label)}&background=2C5E3B&color=EAE5D9&size=96`;
                            }}
                        />
                        <div
                            title={isOnline ? 'Online now' : 'Offline'}
                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--theme-border)] dark:border-[var(--theme-border)] transition-colors duration-500 ${
                                isOnline
                                    ? 'bg-[var(--theme-status-success-bg)] shadow-[0_0_5px_rgba(52,211,153,0.7)] animate-pulse'
                                    : 'bg-[var(--theme-bg-card-hover)] bg-[var(--theme-bg-card-hover)]'
                            }`}
                        />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs truncate leading-tight group-hover:text-[var(--theme-primary)] dark:group-hover:text-[var(--theme-text-secondary)] transition-colors">
                                {node.label}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                                {emp?.status === 'On Leave' && (
                                    <span className="text-[8px] font-semibold px-1 py-0.2 rounded bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]">
                                        Leave
                                    </span>
                                )}
                                {emp?.code && (
                                    <span className={`text-[9px] font-mono px-1 py-0.5 rounded font-semibold ${
                                        isDark ? 'bg-[color-mix(in_srgb,var(--theme-overlay)_30%,transparent)] text-[var(--theme-status-success-text)]' : 'bg-[var(--theme-bg-subtle)]/70 text-[var(--theme-primary)]'
                                    }`}>
                                        {formatDisplayEmployeeId(emp)}
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
                <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)]">
                    <div className="flex items-center gap-1 text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)] truncate max-w-[120px]" title={node.siteName || 'All Sites'}>
                        <MapPin size={11} className="shrink-0 text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)]" />
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
                                    ? 'bg-[var(--theme-primary)]/40 hover:bg-[var(--theme-primary)]/70 text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'
                                    : 'bg-[var(--theme-primary)]/10 hover:bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] border border-[var(--theme-border)]/30'
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
