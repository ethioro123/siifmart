import React from 'react';
import { Camera, Building, CreditCard, MessageSquare, Key, AlertTriangle, Trash2, User } from 'lucide-react';
import { Employee } from '../../types';
import { formatRole } from '../../utils/formatting';

interface StaffProfileHeaderProps {
    employee: Employee;
    isOwnProfile: boolean;
    canManageEmployees: boolean;
    canResetPassword: boolean;
    canTerminate: boolean;
    canDelete: boolean;
    onPhotoRequest: () => void;
    onIdCard: () => void;
    onMessage: () => void;
    onResetPassword: () => void;
    onTerminate: () => void;
    onDelete: () => void;
    photoInputRef: React.RefObject<HTMLInputElement | null>;
    handleProfilePhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function StaffProfileHeader({
    employee, isOwnProfile, canManageEmployees, canResetPassword, canTerminate, canDelete,
    onPhotoRequest, onIdCard, onMessage, onResetPassword, onTerminate, onDelete,
    photoInputRef, handleProfilePhotoSelect
}: StaffProfileHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 mb-8 p-4 md:p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-cyber-primary/10 transition-all"></div>
            
            <div className="relative">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden border-4 border-cyber-primary/30 shadow-lg dark:shadow-2xl relative bg-gray-200 dark:bg-gray-800">
                    {employee.avatar ? <img src={employee.avatar} className="w-full h-full object-cover" alt={employee.name} /> : <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600"><User size={48} /></div>}
                    {(isOwnProfile || canManageEmployees) && (
                        <button onClick={onPhotoRequest} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer z-10" title="Change Photo"><Camera size={28} className="text-white" /></button>
                    )}
                </div>
                <input type="file" ref={photoInputRef} onChange={handleProfilePhotoSelect} className="hidden" accept="image/*" title="Upload Profile Photo" />
            </div>

            <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-1 uppercase tracking-tight">{employee.name}</h2>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center mt-2">
                            <span className="px-3 py-1 bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/20 rounded-full text-xs font-bold uppercase tracking-wider">{formatRole(employee.role)}</span>
                            <span className="text-gray-600 dark:text-gray-400 text-sm font-medium flex items-center gap-1.5"><Building size={14} /> {employee.department}</span>
                            <span className="text-cyan-600 dark:text-cyan-400 font-mono text-xs font-bold bg-cyan-100 dark:bg-cyan-400/10 px-2 py-0.5 rounded">ID: {employee.code || 'EMP-' + employee.id.substring(0, 5).toUpperCase()}</span>
                        </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black border tracking-widest uppercase ${employee.status === 'Active' ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20' : employee.status === 'Pending Approval' ? 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20' : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20'}`}>{employee.status}</span>
                </div>

                <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center md:justify-start gap-2 mt-6 w-full md:w-auto">
                    <button onClick={onIdCard} className="flex items-center justify-center md:justify-start gap-2 text-[10px] md:text-xs font-bold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-white px-3 md:px-4 py-3 md:py-2 rounded-xl border border-gray-200 dark:border-white/10 transition-all uppercase tracking-widest"><CreditCard size={14} /> ID Card</button>
                    {!isOwnProfile && (
                        <>
                            <button onClick={onMessage} className="flex items-center justify-center md:justify-start gap-2 text-[10px] md:text-xs font-bold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-white px-3 md:px-4 py-3 md:py-2 rounded-xl border border-gray-200 dark:border-white/10 transition-all uppercase tracking-widest"><MessageSquare size={14} /> Message</button>
                            {canResetPassword && <button onClick={onResetPassword} className="flex items-center justify-center md:justify-start gap-2 text-[10px] md:text-xs font-bold bg-yellow-100 dark:bg-yellow-400/10 hover:bg-yellow-200 dark:hover:bg-yellow-400/20 text-yellow-600 dark:text-yellow-500 px-3 md:px-4 py-3 md:py-2 rounded-xl border border-yellow-200 dark:border-yellow-400/20 transition-all uppercase tracking-widest"><Key size={14} /> Reset</button>}
                            {canTerminate && employee.status !== 'Terminated' && <button onClick={onTerminate} className="flex items-center justify-center md:justify-start gap-2 text-[10px] md:text-xs font-bold bg-orange-100 dark:bg-orange-500/10 hover:bg-orange-200 dark:hover:bg-orange-500/20 text-orange-600 dark:text-orange-500 px-3 md:px-4 py-3 md:py-2 rounded-xl border border-orange-200 dark:border-orange-500/20 transition-all uppercase tracking-widest"><AlertTriangle size={14} /> Terminate</button>}
                            {canDelete && <button onClick={onDelete} className="flex items-center justify-center md:justify-start gap-2 text-[10px] md:text-xs font-bold bg-red-100 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/20 text-red-600 dark:text-red-500 px-3 md:px-4 py-3 md:py-2 rounded-xl border border-red-200 dark:border-red-500/20 transition-all uppercase tracking-widest"><Trash2 size={14} /> Delete</button>}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
