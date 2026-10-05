import React, { useState, useEffect } from 'react';
import { 
    AlertTriangle, ShieldAlert, Plus, Scale, CheckCircle2, 
    XCircle, Clock, FileText, User
} from 'lucide-react';
import { disciplinaryService } from '../../../services/disciplinary.service';
import type { DisciplinaryRecord, DisciplinaryType, DisciplinarySeverity } from '../../../types/hr-advanced';
import { useStore } from '../../../contexts/CentralStore';
import { useData } from '../../../contexts/DataContext';

export default function DisciplinaryRegisterTab() {
    const { user, showToast } = useStore();
    const { effectiveCountry, employees } = useData();
    const country = effectiveCountry || 'ET';

    const [records, setRecords] = useState<DisciplinaryRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);

    // Notice form states
    const [targetEmpId, setTargetEmpId] = useState('');
    const [recordType, setRecordType] = useState<DisciplinaryType>('Written Warning');
    const [severity, setSeverity] = useState<DisciplinarySeverity>('Medium');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [actionTaken, setActionTaken] = useState('');

    const loadRecords = async () => {
        setIsLoading(true);
        try {
            const data = await disciplinaryService.fetchDisciplinaryRecords(country);
            setRecords(data);
        } catch {
            // Handled
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadRecords();
    }, [country]);

    const handleIssueNotice = async (e: React.FormEvent) => {
        e.preventDefault();
        const emp = employees.find(e => e.id === targetEmpId);
        if (!emp) {
            showToast('Please select a target employee', 'warning');
            return;
        }

        try {
            await disciplinaryService.issueDisciplinaryNotice({
                country_code: country,
                employee_id: emp.id,
                employee_name: emp.name,
                record_type: recordType,
                severity,
                title,
                description,
                action_taken: actionTaken,
                issued_by: user?.name || 'Supervisory Manager',
                issued_by_role: user?.role || 'store_manager'
            });
            showToast(`Disciplinary notice issued to ${emp.name}`, 'success');
            setIsNoticeModalOpen(false);
            setTitle('');
            setDescription('');
            setActionTaken('');
            loadRecords();
        } catch {
            showToast('Failed to issue notice', 'error');
        }
    };

    const handleResolveAppeal = async (recordId: string, resolution: 'Upheld' | 'Overturned') => {
        try {
            await disciplinaryService.resolveAppeal(recordId, resolution, {
                id: user?.id || 'hr_dir',
                name: user?.name || 'HR Director',
                role: user?.role || 'hr_manager'
            });
            showToast(`Appeal has been ${resolution.toLowerCase()}`, 'info');
            loadRecords();
        } catch (err: any) {
            showToast(err.message || 'Adjudication rejected under 4-Eyes rule', 'error');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white/80 dark:bg-black/30 rounded-3xl border border-[#E2DCCE] dark:border-white/10 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-500/10 rounded-2xl text-red-600 dark:text-red-400">
                        <Scale size={24} />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-[#1E3F27] dark:text-[#EAE5D9]">
                            Disciplinary & Grievance Register
                        </h3>
                        <p className="text-xs text-stone-500 font-medium">
                            Formal policy warnings, misconduct investigations, and independent 4-Eyes appeals
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setIsNoticeModalOpen(true)}
                    className="woody-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
                >
                    <Plus size={15} />
                    <span>Issue Disciplinary Notice</span>
                </button>
            </div>

            {/* Records List */}
            {records.length === 0 ? (
                <div className="text-center py-12 bg-white/80 dark:bg-black/20 rounded-3xl border border-dashed border-[#E2DCCE] dark:border-white/10 space-y-2">
                    <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
                    <p className="font-bold text-sm text-[#1E3F27] dark:text-[#EAE5D9]">
                        Zero Active Disciplinary Notices
                    </p>
                    <p className="text-xs text-stone-400">
                        No active warnings or grievances recorded for {country} operations.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {records.map(rec => (
                        <div
                            key={rec.id}
                            className="p-5 bg-white/80 dark:bg-black/30 rounded-2xl border border-[#E2DCCE] dark:border-white/10 space-y-3 shadow-2xs"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-white/5 pb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-sm text-[#1E3F27] dark:text-[#EAE5D9]">
                                            {rec.title}
                                        </h4>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border ${
                                            rec.severity === 'Critical' || rec.severity === 'High'
                                                ? 'bg-red-50 text-red-800 border-red-200'
                                                : 'bg-amber-50 text-amber-800 border-amber-200'
                                        }`}>
                                            {rec.severity} Severity
                                        </span>
                                    </div>
                                    <p className="text-xs text-stone-500 font-medium mt-0.5">
                                        Issued to: <strong className="text-stone-800 dark:text-stone-200">{rec.employee_name}</strong> ({rec.employee_id}) • {rec.record_type}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-mono text-stone-400">
                                        Issued: {rec.issued_at ? new Date(rec.issued_at).toLocaleDateString() : 'Recent'}
                                    </span>
                                    {rec.appeal_status === 'Pending Appeal' && (
                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200">
                                            Appeal Pending
                                        </span>
                                    )}
                                </div>
                            </div>

                            <p className="text-xs text-stone-600 dark:text-stone-300">
                                {rec.description}
                            </p>

                            <div className="p-3 bg-stone-50 dark:bg-black/40 rounded-xl text-xs flex items-center justify-between">
                                <span className="font-medium text-stone-600 dark:text-stone-400">
                                    Action: <strong>{rec.action_taken}</strong>
                                </span>
                                <span className="text-stone-400 text-[11px]">
                                    Issued by: {rec.issued_by} ({rec.issued_by_role})
                                </span>
                            </div>

                            {/* Appeal Resolution Controls */}
                            {rec.appeal_status === 'Pending Appeal' && user?.role === 'hr_manager' && (
                                <div className="flex items-center justify-end gap-2 pt-1">
                                    <button
                                        onClick={() => handleResolveAppeal(rec.id, 'Overturned')}
                                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 dark:hover:bg-white/5 border border-stone-200 cursor-pointer"
                                    >
                                        Overturn Warning
                                    </button>
                                    <button
                                        onClick={() => handleResolveAppeal(rec.id, 'Upheld')}
                                        className="woody-btn-primary px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                                    >
                                        Uphold Sanction
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Notice Modal */}
            {isNoticeModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <form onSubmit={handleIssueNotice} className="bg-white dark:bg-[#18201B] rounded-3xl border border-[#E2DCCE] dark:border-white/10 p-6 max-w-lg w-full space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-white/5">
                            <AlertTriangle className="text-amber-500" size={20} />
                            <h4 className="font-black text-sm text-[#1E3F27] dark:text-[#EAE5D9]">
                                Issue Formal Disciplinary Notice
                            </h4>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Target Personnel</label>
                            <select
                                value={targetEmpId}
                                onChange={(e) => setTargetEmpId(e.target.value)}
                                required
                                className="w-full px-3 py-2 bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 rounded-xl text-xs font-bold"
                            >
                                <option value="">Select Employee...</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.name} ({emp.code || emp.id}) - {emp.role}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Notice Type</label>
                                <select
                                    value={recordType}
                                    onChange={(e) => setRecordType(e.target.value as DisciplinaryType)}
                                    className="w-full px-3 py-2 bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 rounded-xl text-xs"
                                >
                                    <option value="Verbal Warning">Verbal Warning</option>
                                    <option value="Written Warning">Written Warning</option>
                                    <option value="Final Warning">Final Warning</option>
                                    <option value="Suspension">Suspension</option>
                                    <option value="Formal Investigation">Formal Investigation</option>
                                    <option value="Grievance">Grievance</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Severity</label>
                                <select
                                    value={severity}
                                    onChange={(e) => setSeverity(e.target.value as DisciplinarySeverity)}
                                    className="w-full px-3 py-2 bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 rounded-xl text-xs"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Incident Subject / Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Unexplained Cash Discrepancy at POS Till 2"
                                required
                                className="w-full px-3 py-2 bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 rounded-xl text-xs"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Description & Evidence</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Detail the documented facts, CCTV reviews, or witness statements..."
                                rows={3}
                                required
                                className="w-full px-3 py-2 bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 rounded-xl text-xs resize-none"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Mandated Corrective Action</label>
                            <input
                                type="text"
                                value={actionTaken}
                                onChange={(e) => setActionTaken(e.target.value)}
                                placeholder="e.g. Mandatory retraining on cash handling and 3-month probation"
                                required
                                className="w-full px-3 py-2 bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 rounded-xl text-xs"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-stone-100 dark:border-white/5">
                            <button
                                type="button"
                                onClick={() => setIsNoticeModalOpen(false)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-400"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="woody-btn-primary px-4 py-2 rounded-xl text-xs font-bold"
                            >
                                Issue Formal Notice
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
