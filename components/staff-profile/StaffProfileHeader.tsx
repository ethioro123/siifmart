import React from 'react';
import { Camera, Building, CreditCard, MessageSquare, Key, AlertTriangle, Trash2, User, UserCheck, ShieldCheck, Clock } from 'lucide-react';
import { Employee } from '../../types';
import { formatRole } from '../../utils/formatting';
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
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-[#FAF8F5] to-emerald-50/30 dark:from-[#151D18] dark:via-[#18201B] dark:to-[#101612] border border-[#E2DCCE] dark:border-white/10 p-5 sm:p-7 mb-6 shadow-sm">
            {/* Ambient Lighting */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 dark:bg-emerald-400/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-amber-500/5 dark:bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-5 sm:gap-7">
                {/* Avatar with Presence Ring */}
                <div className="relative flex-shrink-0 group">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-4 ring-emerald-600/10 dark:ring-emerald-400/15 border-2 border-white dark:border-[#1E2822] shadow-md bg-stone-100 dark:bg-black/40 relative">
                        {employee.avatar ? (
                            <img src={employee.avatar} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt={employee.name} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400 dark:text-stone-600">
                                <User size={44} />
                            </div>
                        )}
                        {(isOwnProfile || canManageEmployees) && (
                            <button
                                onClick={onPhotoRequest}
                                className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                title="Change Profile Photo"
                            >
                                <Camera size={22} className="mb-1" />
                                <span className="text-[10px] font-bold">Edit</span>
                            </button>
                        )}
                    </div>

                    {/* Online / Offline Presence Badge */}
                    <div
                        title={isOnline ? 'Online now' : 'Offline'}
                        className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full border-2 border-white dark:border-[#18201B] text-[10px] font-bold flex items-center gap-1 shadow-xs ${
                            isOnline 
                                ? 'bg-emerald-500 text-white' 
                                : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                        }`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-stone-400'}`} />
                        <span>{isOnline ? 'Online' : 'Offline'}</span>
                    </div>

                    <input type="file" ref={photoInputRef} onChange={handleProfilePhotoSelect} className="hidden" accept="image/*" title="Upload Profile Photo" />
                </div>

                {/* Identity & Status */}
                <div className="flex-1 text-center md:text-left min-w-0">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="min-w-0">
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E3F27] dark:text-[#EAE5D9] tracking-tight truncate">
                                {employee.name}
                            </h2>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#2C5E3B]/10 dark:bg-emerald-500/15 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20 dark:border-emerald-500/30">
                                    <ShieldCheck size={13} />
                                    {formatRole(employee.role)}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-white/10">
                                    <Building size={13} className="text-stone-400" />
                                    {employee.department || 'Retail Operations'}
                                </span>
                                <span className="inline-flex items-center font-mono text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-white/5 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-white/10">
                                    ID: {formatDisplayEmployeeId(employee, sites)}
                                </span>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="self-center lg:self-start flex-shrink-0">
                            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold border ${
                                isActive 
                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/25'
                                    : isPending
                                        ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/25'
                                        : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/25'
                            }`}>
                                <span className={`w-2 h-2 rounded-full ${
                                    isActive ? 'bg-emerald-500' : isPending ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'
                                }`} />
                                {employee.status}
                            </span>
                        </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mt-5">
                        <button
                            onClick={onIdCard}
                            className="inline-flex items-center gap-1.5 text-xs font-bold bg-white dark:bg-white/5 hover:bg-stone-50 dark:hover:bg-white/10 text-stone-700 dark:text-[#EAE5D9] border border-[#E2DCCE] dark:border-white/10 px-3.5 py-2 rounded-xl transition-all shadow-xs hover:shadow-sm active:scale-98 cursor-pointer"
                        >
                            <CreditCard size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                            <span>ID Card</span>
                        </button>

                        {!isOwnProfile && (
                            <>
                                {canApprove && onApprove && (
                                    <button
                                        onClick={onApprove}
                                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-4 py-2 rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all active:scale-98 cursor-pointer"
                                    >
                                        <UserCheck size={14} />
                                        <span>Approve & Activate</span>
                                    </button>
                                )}

                                <button
                                    onClick={onMessage}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold bg-white dark:bg-white/5 hover:bg-[#2C5E3B]/5 dark:hover:bg-white/10 text-stone-700 dark:text-[#EAE5D9] hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] border border-[#E2DCCE] dark:border-white/10 px-3.5 py-2 rounded-xl transition-all shadow-xs hover:shadow-sm active:scale-98 cursor-pointer"
                                >
                                    <MessageSquare size={14} className="text-stone-500 dark:text-stone-400" />
                                    <span>Message</span>
                                </button>

                                {canResetPassword && (
                                    <button
                                        onClick={onResetPassword}
                                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20 px-3.5 py-2 rounded-xl transition-all shadow-xs active:scale-98 cursor-pointer"
                                    >
                                        <Key size={14} />
                                        <span>Reset</span>
                                    </button>
                                )}

                                {canTerminate && employee.status !== 'Terminated' && (
                                    <button
                                        onClick={onTerminate}
                                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 px-3.5 py-2 rounded-xl transition-all shadow-xs active:scale-98 cursor-pointer"
                                    >
                                        <AlertTriangle size={14} />
                                        <span>Terminate</span>
                                    </button>
                                )}

                                {canDelete && (
                                    <button
                                        onClick={onDelete}
                                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20 px-3.5 py-2 rounded-xl transition-all shadow-xs active:scale-98 cursor-pointer"
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
