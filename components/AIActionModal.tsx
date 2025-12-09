import React from 'react';
import { Check, X, AlertTriangle, ArrowRight, FileText, Package, User } from 'lucide-react';
import { aiActionExecutorService } from '../services/ai-action-executor.service';

interface AIActionModalProps {
    action: any;
    onConfirm: () => void;
    onCancel: () => void;
    userRole: string;
}

export function AIActionModal({ action, onConfirm, onCancel, userRole }: AIActionModalProps) {
    const [executing, setExecuting] = React.useState(false);
    const [result, setResult] = React.useState<any>(null);
    const [error, setError] = React.useState<string | null>(null);

    const handleConfirm = async () => {
        setExecuting(true);
        setError(null);

        try {
            const res = await aiActionExecutorService.executeAction(action, userRole);
            if (res.success) {
                setResult(res);
                setTimeout(() => {
                    onConfirm();
                }, 2000);
            } else {
                setError(res.message);
            }
        } catch (err: any) {
            setError(err.message || 'Action failed');
        } finally {
            setExecuting(false);
        }
    };

    if (result) {
        return (
            <div className="bg-black/80 backdrop-blur-xl rounded-2xl p-8 border border-green-500/30 animate-in fade-in zoom-in duration-300 shadow-[0_0_30px_rgba(74,222,128,0.1)]">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-400 border border-green-500/20 shadow-[0_0_15px_rgba(74,222,128,0.2)]">
                        <Check size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2 tracking-wide">Action Executed</h3>
                        <p className="text-gray-400">{result.message}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden animate-in fade-in zoom-in duration-300 shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
                        <ZapIcon />
                    </div>
                    <span className="font-bold text-white tracking-wide">CONFIRM ACTION</span>
                </div>
                <button onClick={onCancel} className="text-gray-500 hover:text-white transition-colors" aria-label="Close modal">
                    <X size={18} />
                </button>
            </div>

            {/* Content */}
            <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 shadow-inner">
                        {getActionIcon(action.type)}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">{action.description}</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Please review the parameters below before confirming execution.
                        </p>
                    </div>
                </div>

                {/* Details Card */}
                <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/50"></div>
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Execution Parameters</h4>
                    <div className="space-y-3">
                        {Object.entries(action.params).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center text-sm group">
                                <span className="text-gray-400 capitalize group-hover:text-gray-300 transition-colors">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <span className="text-purple-300 font-mono bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20 text-xs">
                                    {String(value)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Warning for sensitive actions */}
                {['delete', 'adjust_stock'].some(t => action.type.includes(t)) && (
                    <div className="flex gap-3 items-start p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl mb-6">
                        <AlertTriangle size={18} className="text-yellow-500 mt-0.5" />
                        <p className="text-xs text-yellow-200/80 leading-relaxed">
                            <strong className="text-yellow-500 block mb-1">Warning: Irreversible Action</strong>
                            This operation will directly modify system records. Ensure all data is correct.
                        </p>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6 text-sm text-red-400 flex items-center gap-3">
                        <AlertTriangle size={18} />
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl transition-all border border-white/5 font-medium"
                        disabled={executing}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl transition-all flex items-center justify-center gap-2 font-bold shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] border border-white/10"
                        disabled={executing}
                    >
                        {executing ? (
                            <>Processing...</>
                        ) : (
                            <>
                                Execute <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

function getActionIcon(type: string) {
    switch (type) {
        case 'create_po': return <FileText className="text-blue-400" size={24} />;
        case 'adjust_stock': return <Package className="text-orange-400" size={24} />;
        case 'assign_job': return <User className="text-green-400" size={24} />;
        default: return <ZapIcon />;
    }
}

const ZapIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
);
