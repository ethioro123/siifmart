import React from 'react';
import { Camera, Building, CreditCard, MessageSquare, Key, AlertTriangle, Trash2, User, UserCheck, ShieldCheck } from 'lucide-react';
import { Employee } from '../../types';
import { getEmployeeJobTitle } from '../../utils/roles';
import { formatDisplayEmployeeId } from '../../utils/employeeIdGenerator';

interface StaffProfileHeaderProps {
    employee: Employee;
    sites?: any[];
    isOwnProfile: boolean;
    canManageEmployees: boolean;
    canResetPassword: boolean;
    canTerminate: boolean;
    canDelete: boolean;
    canApprove?: boolean;
    isOnline?: boolean;
    onPhotoRequest: () => void;
    onIdCard: () => void;
    onMessage: () => void;
    onResetPassword: () => void;
    onTerminate: () => void;
    onDelete: () => void;
    onApprove?: () => void;
    photoInputRef: React.RefObject<HTMLInputElement | null>;
    handleProfilePhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function StaffProfileHeader({
    employee, sites, isOwnProfile, canManageEmployees, canResetPassword, canTerminate, canDelete,
    canApprove, isOnline,
    onPhotoRequest, onIdCard, onMessage, onResetPassword, onTerminate, onDelete, onApprove,
    photoInputRef, handleProfilePhotoSelect
}: StaffProfileHeaderProps) {
    const isPending = employee.status === 'Pending Approval';
    const isActive = employee.status === 'Active';

    return (
        <div className="rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] p-4 sm:p-6 mb-4 sm:mb-5 shadow-[var(--shadow-sm)]">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6">
                {/* Avatar with Presence Ring */}
                <div className="relative shrink-0 group select-none">
                    <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] shadow-xs relative">
                        {employee.avatar ? (
                            <img src={employee.avatar} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt={employee.name} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[var(--theme-text-muted)]">
                                <User size={40} />
                            </div>
                        )}
                        {(isOwnProfile || canManageEmployees) && (
                            <button
                                type="button"
                                onClick={onPhotoRequest}
                                className="absolute bottom-1 right-1 flex h-11 w-11 items-center justify-center rounded-xl border border-white/40 bg-black/65 text-white transition-opacity cursor-pointer md:inset-0 md:h-auto md:w-auto md:flex-col md:rounded-none md:border-0 md:bg-black/50 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                                title="Change Profile Photo"
                                aria-label="Change profile photo"
                            >
                                <Camera size={18} className="md:mb-1 md:h-5 md:w-5" />
                                <span className="sr-only md:not-sr-only md:text-xs md:font-semibold">Edit</span>
                            </button>
                        )}
                    </div>

                    {/* Online / Offline Presence Badge */}
                    <div
                        title={isOnline ? 'Online now' : 'Offline'}
                        className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full border-2 border-[var(--theme-bg-card)] text-[11px] font-semibold flex items-center gap-1 shadow-xs ${
                            isOnline
                                ? 'bg-[var(--theme-status-success-bg)] text-white'
                                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-neutral-400'}`} />
                        <span>{isOnline ? 'Online' : 'Offline'}</span>
                    </div>

                    <input type="file" ref={photoInputRef} onChange={handleProfilePhotoSelect} className="hidden" accept="image/*" title="Upload Profile Photo" />
                </div>

                {/* Identity & Status */}
                <div className="flex-1 text-center md:text-left min-w-0">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="min-w-0">
                            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--theme-text-primary)] tracking-tight truncate">
                                {employee.name}
                            </h2>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--theme-status-info-bg)] text-[var(--theme-accent)] border border-[var(--theme-status-info-border)]">
                                    <ShieldCheck size={13} />
                                    {getEmployeeJobTitle(employee)}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                                    <Building size={13} className="text-[var(--theme-text-muted)]" />
                                    {employee.department || 'Retail Operations'}
                                </span>
                                <span className="inline-flex items-center font-mono text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] tabular-nums">
                                    ID: {formatDisplayEmployeeId(employee, sites)}
                                </span>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="self-center lg:self-start shrink-0">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                                isActive
                                    ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]'
                                    : isPending
                                        ? 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]'
                                        : 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)]'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                    isActive ? 'bg-[var(--theme-status-success-bg)]' : isPending ? 'bg-[var(--theme-status-warning-bg)] animate-pulse' : 'bg-[var(--theme-status-danger-bg)]'
                                }`} />
                                {employee.status}
                            </span>
                        </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-4 pt-3 border-t border-[var(--theme-border-subtle)]">
                        <button
                            type="button"
                            onClick={onIdCard}
                            className="min-h-11 px-3 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-panel-hover)] border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-primary)] transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                        >
                            <CreditCard size={14} className="text-[var(--theme-text-secondary)]" />
                            <span>ID Card</span>
                        </button>

                        {!isOwnProfile && (
                            <>
                                {canApprove && onApprove && (
                                    <button
                                        type="button"
                                        onClick={onApprove}
                                        className="min-h-11 px-3.5 rounded-xl bg-[var(--theme-accent)] hover:opacity-95 text-white text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 shadow-xs"
                                    >
                                        <UserCheck size={14} />
                                        <span>Approve & Activate</span>
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={onMessage}
                                    className="min-h-11 px-3 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-panel-hover)] border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-primary)] transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                                >
                                    <MessageSquare size={14} className="text-[var(--theme-text-secondary)]" />
                                    <span>Message</span>
                                </button>

                                {canResetPassword && (
                                    <button
                                        type="button"
                                        onClick={onResetPassword}
                                        className="min-h-11 px-3 rounded-xl bg-[var(--theme-status-warning-bg)] bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] text-xs font-semibold text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                                    >
                                        <Key size={14} />
                                        <span>Reset</span>
                                    </button>
                                )}

                                {canTerminate && employee.status !== 'Terminated' && (
                                    <button
                                        type="button"
                                        onClick={onTerminate}
                                        className="min-h-11 px-3 rounded-xl bg-[var(--theme-status-danger-bg)] bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] text-xs font-semibold text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                                    >
                                        <AlertTriangle size={14} />
                                        <span>Terminate</span>
                                    </button>
                                )}

                                {canDelete && (
                                    <button
                                        type="button"
                                        onClick={onDelete}
                                        className="min-h-11 px-3 rounded-xl bg-[var(--theme-status-danger-bg)] bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] text-xs font-semibold text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                                    >
                                        <Trash2 size={14} />
                                        <span>Delete</span>
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
