// EmployeeRowCard.tsx - Modern elegant employee row component
import React from 'react';
import {
    Mail, Phone, MapPin, Briefcase, Star, ClipboardList, MessageSquare,
    Key, Trash2, ArrowRight, UserCheck, Clock, Trophy, Zap, Gift
} from 'lucide-react';
import { Employee, Site, UserRole, WorkerPoints } from '../types';
import { CURRENCY_SYMBOL } from '../constants';
import { formatCompactNumber } from '../utils/formatting';

interface EmployeeRowProps {
    employee: Employee;
    sites: Site[];
    roleConfig: any;
    pendingTasks: number;
    onSelect: () => void;
    onMessage: () => void;
    onResetPassword?: () => void;
    onDelete?: () => void;
    onApprove?: () => void;
    canResetPassword: boolean;
    canDelete: boolean;
    canApprove: boolean;
    isSuperAdmin: boolean;
    // Gamification props
    workerPoints?: WorkerPoints;
    estimatedBonus?: number;
    bonusTierName?: string;
    key?: React.Key;
}

export default function EmployeeRow({
    employee,
    sites,
    roleConfig,
    pendingTasks,
    onSelect,
    onMessage,
    onResetPassword,
    onDelete,
    onApprove,
    canResetPassword,
    canDelete,
    canApprove,
    isSuperAdmin,
    workerPoints,
    estimatedBonus,
    bonusTierName
}: EmployeeRowProps) {
    const isPending = employee.status === 'Pending Approval';
    const employeeSite = sites.find(s => s.id === employee.siteId || s.id === employee.site_id);
    const [imgError, setImgError] = React.useState(false);

    // Determine if this is a warehouse or store employee for display
    const isWarehouseWorker = employeeSite?.type === 'Warehouse' || employeeSite?.type === 'Distribution Center';

    return (
        <div
            className={`px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-white/5 transition-all group cursor-pointer ${isPending ? 'bg-yellow-500/5 border-l-2 border-l-yellow-500' : ''
                }`}
            onClick={onSelect}
        >
            {/* Employee Info */}
            <div className="col-span-8 sm:col-span-6 lg:col-span-4 flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                    {employee.avatar && !imgError ? (
                        <img
                            src={employee.avatar}
                            alt={employee.name}
                            className="w-12 h-12 rounded-xl border-2 border-white/10 object-cover group-hover:border-cyber-primary/50 transition-all"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-xl border-2 border-white/10 bg-white/5 flex items-center justify-center group-hover:border-cyber-primary/50 transition-all">
                            <span className="font-bold text-gray-400 group-hover:text-cyber-primary">
                                {employee.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </span>
                        </div>
                    )}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-cyber-dark ${employee.status === 'Active' ? 'bg-green-500' :
                        employee.status === 'Pending Approval' ? 'bg-yellow-500 animate-pulse' :
                            'bg-red-500'
                        }`}></div>
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white truncate group-hover:text-cyber-primary transition-colors">
                        {employee.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <Mail size={11} className="text-gray-500 shrink-0" />
                        <span className="text-xs text-gray-400 truncate">{employee.email}</span>
                    </div>
                    {employee.phone && employee.phone !== 'N/A' && (
                        <div className="flex items-center gap-2 mt-0.5">
                            <Phone size={11} className="text-gray-500 shrink-0" />
                            <span className="text-xs text-gray-400">{employee.phone}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Role & Status */}
            <div className="hidden sm:block sm:col-span-3 lg:col-span-2">
                <div className="flex flex-col gap-1.5">
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full border w-fit ${roleConfig.styles.badge}`}>
                        {employee.role.replace('_', ' ')}
                    </span>
                    {employee.department && (
                        <div className="flex items-center gap-1.5">
                            <Briefcase size={10} className="text-gray-500" />
                            <span className="text-[10px] text-gray-400 truncate">{employee.department}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Location */}
            <div className="hidden lg:block lg:col-span-2">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${employeeSite?.type === 'Store' || employeeSite?.type === 'Dark Store'
                        ? 'bg-green-500/20 text-green-400'
                        : employeeSite?.type === 'Warehouse' || employeeSite?.type === 'Distribution Center'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                        <MapPin size={12} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{employeeSite?.name || 'Central Operations'}</p>
                        <p className="text-[10px] text-gray-500">{employeeSite?.type || 'Administrative'}</p>
                    </div>
                </div>
            </div>

            {/* Performance & Points */}
            <div className="hidden lg:block lg:col-span-2">
                {isPending ? (
                    <div className="flex items-center gap-2 text-yellow-500">
                        <Clock size={14} className="animate-pulse" />
                        <span className="text-xs font-bold">Approval Pending</span>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {/* Points Display */}
                        {workerPoints ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <Trophy size={12} className="text-yellow-400" />
                                    <span className="text-xs text-white font-bold">{workerPoints.totalPoints.toLocaleString()} pts</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-bold">
                                        Lv.{workerPoints.level}
                                    </span>
                                </div>
                                {estimatedBonus && estimatedBonus > 0 && (
                                    <div className="flex items-center gap-2">
                                        <Gift size={12} className="text-green-400" />
                                        <span className="text-xs text-green-400 font-bold">
                                            {formatCompactNumber(estimatedBonus, { currency: CURRENCY_SYMBOL, maxFractionDigits: 0 })}
                                        </span>
                                        {bonusTierName && (
                                            <span className="text-[10px] text-gray-500">{bonusTierName}</span>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : estimatedBonus && estimatedBonus > 0 ? (
                            // Store employee with team bonus share
                            <div className="flex items-center gap-2">
                                <Gift size={12} className="text-green-400" />
                                <span className="text-xs text-green-400 font-bold">
                                    {formatCompactNumber(estimatedBonus, { currency: CURRENCY_SYMBOL, maxFractionDigits: 0 })}
                                </span>
                                <span className="text-[10px] text-gray-500">team share</span>
                            </div>
                        ) : (
                            // Fallback to performance
                            <div className="flex items-center gap-2">
                                <Star size={12} className="text-yellow-400" />
                                <span className="text-xs text-white font-bold">{employee.performanceScore}%</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <ClipboardList size={12} className="text-blue-400" />
                            <span className="text-xs text-gray-400">{pendingTasks} tasks</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="col-span-4 sm:col-span-3 lg:col-span-2 flex items-center justify-end gap-2">
                {isPending && canApprove ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onApprove?.();
                        }}
                        className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-xs font-bold border border-green-500/30 transition-all flex items-center gap-1.5"
                    >
                        <UserCheck size={12} /> Approve
                    </button>
                ) : (
                    <>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onMessage();
                            }}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-cyber-primary transition-colors"
                            title="Send Message"
                        >
                            <MessageSquare size={16} />
                        </button>

                        {canResetPassword && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onResetPassword?.();
                                }}
                                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-yellow-400 transition-colors"
                                title="Reset Password"
                            >
                                <Key size={16} />
                            </button>
                        )}

                        {isSuperAdmin && employee.status === 'Terminated' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete?.();
                                }}
                                className="p-2 rounded-lg transition-colors hover:bg-white/10 text-gray-400 hover:text-red-400"
                                title="Delete Employee"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect();
                            }}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white border border-white/5 hover:border-cyber-primary/50 transition-all flex items-center gap-1.5"
                        >
                            View <ArrowRight size={12} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
