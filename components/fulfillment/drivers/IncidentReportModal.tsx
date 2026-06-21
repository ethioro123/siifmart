import React, { useState } from 'react';
import { 
    X, AlertTriangle, Clock, Truck, ShieldAlert, 
    MessageSquare, Send, CheckCircle, Navigation
} from 'lucide-react';
import { User, WMSJob } from '../../../types';
import Button from '../../shared/Button';

interface IncidentReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    activeJob?: WMSJob | null;
    onReport: (data: { 
        type: string; 
        description: string; 
        priority: 'High' | 'Critical';
        jobId?: string;
    }) => Promise<void>;
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({
    isOpen,
    onClose,
    user,
    activeJob,
    onReport
}) => {
    const [issueType, setIssueType] = useState('Traffic / Delay');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!isOpen) return null;

    const issueTypes = [
        { label: 'Traffic / Delay', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { label: 'Vehicle Issue', icon: Truck, color: 'text-orange-400', bg: 'bg-orange-500/10' },
        { label: 'Customer Not Found', icon: Navigation, color: 'text-[#A9CBA2]', bg: 'bg-[#2C5E3B]/10' },
        { label: 'Security / Access', icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10' },
        { label: 'Package Damage', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-600/10' },
        { label: 'Other', icon: MessageSquare, color: 'text-gray-400', bg: 'bg-white/5' }
    ];

    const handleSubmit = async () => {
        if (!description) return;
        setIsSubmitting(true);
        try {
            await onReport({
                type: issueType,
                description,
                priority: issueType.includes('Security') || issueType.includes('Damage') ? 'Critical' : 'High',
                jobId: activeJob?.id
            });
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                setIsSuccess(false);
                setDescription('');
            }, 2000);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#0c0c0e] w-full max-w-md rounded-[2rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-red-500/5 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/20 rounded-xl border border-red-500/30">
                            <AlertTriangle className="text-red-400" size={20} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">Report Incident</h2>
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Immediate Management Alert</p>
                        </div>
                    </div>
                    <button onClick={onClose} aria-label="Close" className="p-2 hover:bg-white/5 rounded-full text-gray-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {isSuccess ? (
                        <div className="py-10 flex flex-col items-center text-center animate-in zoom-in-95">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30 mb-4">
                                <CheckCircle className="text-green-400" size={32} />
                            </div>
                            <h3 className="text-white font-black uppercase tracking-widest text-sm mb-1">Report Logged</h3>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">Management has been notified</p>
                        </div>
                    ) : (
                        <>
                            {/* Type Selection */}
                            <div className="grid grid-cols-2 gap-2">
                                {issueTypes.map((type) => (
                                    <button
                                        key={type.label}
                                        onClick={() => setIssueType(type.label)}
                                        className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                                            issueType === type.label 
                                                ? 'bg-white/10 border-white/20 shadow-inner' 
                                                : 'bg-white/5 border-transparent opacity-60 grayscale-[0.5]'
                                        }`}
                                    >
                                        <div className={`p-1.5 rounded-md ${type.bg}`}>
                                            <type.icon size={12} className={type.color} />
                                        </div>
                                        <span className="text-[10px] font-black text-white text-left leading-tight uppercase tracking-tight">{type.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Details Input */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Incident Intel</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="DESCRIBE THE SITUATION..."
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-white placeholder:text-gray-700 min-h-[100px] focus:outline-none focus:border-red-500/30 transition-all font-mono uppercase tracking-widest"
                                />
                            </div>

                            {/* Submit */}
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !description}
                                className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:bg-gray-800 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-600/20"
                            >
                                <Send size={14} />
                                {isSubmitting ? 'SENDING...' : 'TRANSMIT REPORT'}
                            </button>
                        </>
                    )}
                </div>

                {/* Footer Context */}
                {!isSuccess && activeJob && (
                    <div className="p-4 bg-white/5 border-t border-white/5 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-gray-600 tracking-widest uppercase">
                            Linked to Job: <span className="text-gray-400">#{activeJob.id.toUpperCase().slice(0,8)}</span>
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
