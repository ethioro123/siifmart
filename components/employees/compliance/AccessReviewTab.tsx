import React, { useState, useMemo } from 'react';
import { 
    Shield, UserX, Clock, AlertTriangle, CheckCircle2, 
    Download, FileText, Landmark, Search
} from 'lucide-react';
import { useData } from '../../../contexts/DataContext';
import { useStore } from '../../../contexts/CentralStore';
import { hrAnalyticsService } from '../../../services/hr-analytics.service';

export default function AccessReviewTab() {
    const { user, showToast } = useStore();
    const { employees, effectiveCountry } = useData();
    const country = effectiveCountry || 'ET';

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('All');
    const [filterDormantOnly, setFilterDormantOnly] = useState(false);

    // Compute Access Audit Records
    const accessRecords = useMemo(() => {
        return hrAnalyticsService.getAccessAuditReport(employees, country, 30);
    }, [employees, country]);

    // Compute Statutory Report
    const statutoryReport = useMemo(() => {
        return hrAnalyticsService.getStatutoryComplianceReport(employees, country);
    }, [employees, country]);

    const filteredRecords = useMemo(() => {
        return accessRecords.filter(r => {
            const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.role.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = selectedRole === 'All' || r.role === selectedRole;
            const matchesDormant = !filterDormantOnly || r.is_dormant;
            return matchesSearch && matchesRole && matchesDormant;
        });
    }, [accessRecords, searchTerm, selectedRole, filterDormantOnly]);

    const dormantCount = useMemo(() => {
        return accessRecords.filter(r => r.is_dormant).length;
    }, [accessRecords]);

    const handleRequestDeactivation = async (targetUserId: string, targetName: string) => {
        try {
            await hrAnalyticsService.requestAccountDeactivation(
                targetUserId,
                { id: user?.id || 'hr_officer', name: user?.name || 'HR Officer', role: user?.role || 'hr' },
                'Dormant account inactivity > 30 days identified in HR security audit.'
            );
            showToast(`Deactivation request logged for ${targetName}. Sent to CEO/Admin for 4-Eyes sign-off.`, 'success');
        } catch {
            showToast('Failed to log deactivation request', 'error');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white/80 dark:bg-black/30 rounded-3xl border border-[#E2DCCE] dark:border-white/10 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-600 dark:text-amber-400">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-[#1E3F27] dark:text-[#EAE5D9]">
                            Access Review & Dormant Account Audit
                        </h3>
                        <p className="text-xs text-stone-500 font-medium">
                            Role attribution, dormant account detection, and statutory compliance ({country})
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 text-amber-800 dark:text-amber-300 text-xs font-bold">
                        {dormantCount} Dormant Accounts Flagged
                    </div>
                </div>
            </div>

            {/* Statutory Compliance Executive Card */}
            <div className="p-6 bg-stone-50 dark:bg-black/40 rounded-3xl border border-[#E2DCCE] dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Landmark size={18} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        <h4 className="text-sm font-bold text-[#1E3F27] dark:text-[#EAE5D9]">
                            National Statutory Compliance Overview: {statutoryReport.statutoryAuthority}
                        </h4>
                    </div>
                    <span className="text-[11px] font-mono text-stone-400">
                        Active Roster: {statutoryReport.employeeCount} Personnel
                    </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div className="p-3 bg-white dark:bg-black/30 rounded-xl border border-stone-200 dark:border-white/5">
                        <span className="text-[10px] text-stone-400 uppercase font-black">Gross Payroll</span>
                        <p className="text-sm font-mono font-bold text-stone-800 dark:text-stone-200">
                            {statutoryReport.totalGrossPayroll.toLocaleString()} {country === 'KE' ? 'KSh' : 'ETB'}
                        </p>
                    </div>

                    <div className="p-3 bg-white dark:bg-black/30 rounded-xl border border-stone-200 dark:border-white/5">
                        <span className="text-[10px] text-stone-400 uppercase font-black">Statutory Tax Withheld</span>
                        <p className="text-sm font-mono font-bold text-stone-800 dark:text-stone-200">
                            {statutoryReport.totalTaxWithheld.toLocaleString()} {country === 'KE' ? 'KSh' : 'ETB'}
                        </p>
                    </div>

                    <div className="p-3 bg-white dark:bg-black/30 rounded-xl border border-stone-200 dark:border-white/5">
                        <span className="text-[10px] text-stone-400 uppercase font-black">Pension Fund (POESSA / NSSF)</span>
                        <p className="text-sm font-mono font-bold text-stone-800 dark:text-stone-200">
                            {statutoryReport.totalPensionContributions.toLocaleString()} {country === 'KE' ? 'KSh' : 'ETB'}
                        </p>
                    </div>

                    <div className="p-3 bg-white dark:bg-black/30 rounded-xl border border-stone-200 dark:border-white/5">
                        <span className="text-[10px] text-stone-400 uppercase font-black">Net Disbursed</span>
                        <p className="text-sm font-mono font-bold text-stone-800 dark:text-stone-200">
                            {statutoryReport.netPayrollDisbursed.toLocaleString()} {country === 'KE' ? 'KSh' : 'ETB'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search employee, email, or role..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-black/30 border border-stone-200 dark:border-white/10 rounded-xl text-xs"
                    />
                </div>

                <label className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-black/30 border border-stone-200 dark:border-white/10 rounded-xl text-xs font-bold cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={filterDormantOnly}
                        onChange={(e) => setFilterDormantOnly(e.target.checked)}
                        className="rounded text-[#2C5E3B] focus:ring-0"
                    />
                    <span>Dormant Only (&gt; 30 Days)</span>
                </label>
            </div>

            {/* Audit Table */}
            <div className="bg-white dark:bg-black/30 rounded-3xl border border-[#E2DCCE] dark:border-white/10 overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 dark:bg-white/5 border-b border-stone-200 dark:border-white/10 text-stone-500 font-bold uppercase text-[10px]">
                        <tr>
                            <th className="p-4">Personnel</th>
                            <th className="p-4">Assigned Role</th>
                            <th className="p-4">Last Login</th>
                            <th className="p-4">Security Status</th>
                            <th className="p-4 text-right">Zero-Trust Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-white/5">
                        {filteredRecords.map(rec => (
                            <tr key={rec.user_id} className="hover:bg-stone-50/50 dark:hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                    <p className="font-bold text-stone-900 dark:text-white">{rec.name}</p>
                                    <p className="text-[10px] text-stone-400 font-mono">{rec.email}</p>
                                </td>
                                <td className="p-4 font-mono font-medium">
                                    {rec.role}
                                </td>
                                <td className="p-4 font-mono">
                                    {rec.last_login_at ? (
                                        <span>{rec.days_since_last_login} days ago</span>
                                    ) : (
                                        <span className="text-stone-400 italic">Never logged in</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    {rec.is_dormant ? (
                                        <span className="px-2 py-0.5 rounded-lg bg-red-50 text-red-700 border border-red-200 text-[10px] font-black uppercase">
                                            Dormant
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase">
                                            Active
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    {rec.is_dormant && (
                                        <button
                                            onClick={() => handleRequestDeactivation(rec.user_id, rec.name)}
                                            className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold cursor-pointer transition-colors"
                                        >
                                            Request Deactivation
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
