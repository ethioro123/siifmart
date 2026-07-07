import React from 'react';
import { HierarchyNode, DEPT_COLORS } from './types';

interface RoleCardProps {
    node: HierarchyNode;
    depth: number;
    isDarkMode: boolean;
}

export const RoleCard: React.FC<RoleCardProps> = ({ node, depth, isDarkMode }) => {
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
                    >
                        {node.label}
                    </div>
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
                    >
                        ▶
                    </span>
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
export default RoleCard;
