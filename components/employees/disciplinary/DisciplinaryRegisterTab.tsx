import React, { useState, useEffect, useMemo } from 'react';
import {
    Scale, AlertTriangle, Plus, Search, Filter, Clock,
    CheckCircle2, XCircle, Eye, ShieldAlert, FileText, ArrowRight
} from 'lucide-react';
import { disciplinaryService } from '../../../services/disciplinary.service';
import type { DisciplinaryRecord, DisciplinaryType, DisciplinarySeverity } from '../../../types/hr-advanced';
import { useStore } from '../../../contexts/CentralStore';
import { useData } from '../../../contexts/DataContext';
import { DisciplinaryKPIs } from './DisciplinaryKPIs';
import { IssueNoticeModal } from './IssueNoticeModal';
import { AppealModal } from './AppealModal';
import { DisciplinaryDetailModal } from './DisciplinaryDetailModal';

const ADJUDICATION_ROLES = ['group_ceo', 'country_managing_director', 'country_hr_director', 'hr_generalist', 'regional_operations_manager', 'regional_hr_manager'];

export default function DisciplinaryRegisterTab() {
    const { user, showToast } = useStore();
    const { effectiveCountry, employees, activeSite } = useData();
    const country = effectiveCountry || 'ET';

    const [records, setRecords] = useState<DisciplinaryRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSeverity, setFilterSeverity] = useState('All');
    const [filterType, setFilterType] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');

    // Modals
    const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
    const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<DisciplinaryRecord | null>(null);

    const loadRecords = async () => {
        setIsLoading(true);
        try {
            const data = await disciplinaryService.fetchDisciplinaryRecords(country);
            setRecords(data);
        } catch {
            // Handled safely
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadRecords();
    }, [country]);

    const canAdjudicate = useMemo(() => {
        return ADJUDICATION_ROLES.includes(user?.role || '');
    }, [user?.role]);

    const handleResolveAppeal = async (recordId: string, resolution: 'Upheld' | 'Overturned') => {
        try {
            await disciplinaryService.resolveAppeal(
                recordId,
                resolution,
                {
                    id: user?.id || 'hr_dir',
                    name: user?.name || 'HR Officer',
                    role: user?.role || 'country_hr_director'
                }
            );
            showToast(`Appeal has been ${resolution.toLowerCase()} successfully`, 'info');
            loadRecords();
        } catch (err: any) {
            showToast(err.message || 'Adjudication rejected under Maker-Checker rule', 'error');
        }
    };

    const handleOpenFileAppeal = (rec: DisciplinaryRecord) => {
        setSelectedRecord(rec);
        setIsAppealModalOpen(true);
    };

    const handleOpenDetail = (rec: DisciplinaryRecord) => {
        setSelectedRecord(rec);
        setIsDetailModalOpen(true);
    };

    const filteredRecords = useMemo(() => {
        return records.filter(rec => {
            const matchesSearch =
                rec.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rec.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rec.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rec.action_taken.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesSeverity = filterSeverity === 'All' || rec.severity === filterSeverity;
            const matchesType = filterType === 'All' || rec.record_type === filterType;

            let matchesStatus = true;
            if (filterStatus === 'Active') {
                matchesStatus = rec.appeal_status !== 'Overturned';
            } else if (filterStatus !== 'All') {
                matchesStatus = rec.appeal_status === filterStatus;
            }

            return matchesSearch && matchesSeverity && matchesType && matchesStatus;
        });
    }, [records, searchTerm, filterSeverity, filterType, filterStatus]);

    return (
        <div className="space-y-5 sm:space-y-6 animate-in fade-in">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-[var(--shadow-sm)]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[var(--theme-status-info-bg)] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                        <Scale size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-semibold tracking-tight text-[var(--theme-text-primary)]">
                                Disciplinary & Grievance Register
                            </h3>
                            {canAdjudicate ? (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)]">
                                    Checker • Appeal Adjudication
                                </span>
                            ) : (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--theme-status-info-bg)] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] border border-[var(--theme-status-info-border)]">
                                    Maker • Incident Filing
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            Dual-control compliance, formal misconduct hearings, and independent 4-Eyes appeals ({country})
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => setIsNoticeModalOpen(true)}
                        className="h-10 px-4 rounded-xl bg-[var(--theme-accent)] text-[var(--theme-accent-contrast)] hover:opacity-95 text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-[0_2px_8px_rgba(0,113,227,0.25)] active:scale-[0.98] transition-all cursor-pointer"
                    >
                        <Plus size={15} />
                        <span>Issue Disciplinary Notice</span>
                    </button>
                </div>
            </div>

            {/* KPI Ribbon */}
            <DisciplinaryKPIs records={records} />

            {/* Filter Bar */}
            <div className="p-4 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-[var(--shadow-sm)] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {/* Search */}
                    <div className="relative">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)]" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search employee, ID, title..."
                            className="w-full pl-9 pr-3.5 py-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-secondary)] focus:outline-hidden focus:border-[var(--theme-border-focus)]"
                        />
                    </div>

                    {/* Severity Filter */}
                    <select
                        value={filterSeverity}
                        onChange={(e) => setFilterSeverity(e.target.value)}
                        className="px-3 py-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-primary)] focus:outline-hidden focus:border-[var(--theme-border-focus)]"
                    >
                        <option value="All">All Severities</option>
                        <option value="Critical">Critical Severity</option>
                        <option value="High">High Severity</option>
                        <option value="Medium">Medium Severity</option>
                        <option value="Low">Low Severity</option>
                    </select>

                    {/* Type Filter */}
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-3 py-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-primary)] focus:outline-hidden focus:border-[var(--theme-border-focus)]"
                    >
                        <option value="All">All Notice Types</option>
                        <option value="Verbal Warning">Verbal Warning</option>
                        <option value="Written Warning">Written Warning</option>
                        <option value="Final Warning">Final Warning</option>
                        <option value="Suspension">Suspension</option>
                        <option value="Formal Investigation">Formal Investigation</option>
                        <option value="Grievance">Grievance</option>
                    </select>

                    {/* Status Filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-primary)] focus:outline-hidden focus:border-[var(--theme-border-focus)]"
                    >
                        <option value="All">All Appeal Statuses</option>
                        <option value="Pending Appeal">Pending Appeal</option>
                        <option value="None">No Appeal (Standard)</option>
                        <option value="Upheld">Sanction Upheld</option>
                        <option value="Overturned">Warning Overturned</option>
                    </select>
                </div>
            </div>

            {/* Records List / States */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(n => (
                        <div key={n} className="p-5 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] animate-pulse space-y-3">
                            <div className="h-4 bg-[var(--theme-bg-subtle)] rounded-md w-1/3" />
                            <div className="h-3 bg-[var(--theme-bg-subtle)] rounded-md w-2/3" />
                            <div className="h-8 bg-[var(--theme-bg-subtle)] rounded-lg w-full" />
                        </div>
                    ))}
                </div>
            ) : filteredRecords.length === 0 ? (
                <div className="text-center py-12 bg-[var(--theme-bg-card)] rounded-2xl border border-dashed border-[var(--theme-border)] space-y-2">
                    {records.length === 0 ? (
                        <>
                            <CheckCircle2 size={36} className="mx-auto text-[var(--theme-status-success-text)]" />
                            <p className="font-bold text-sm text-[var(--theme-text-primary)]">
                                Zero Active Disciplinary Notices
                            </p>
                            <p className="text-xs text-[var(--theme-text-secondary)]">
                                No active warnings or grievances recorded for {country} operations.
                            </p>
                        </>
                    ) : (
                        <>
                            <AlertTriangle size={36} className="mx-auto text-[var(--theme-status-warning-text)]" />
                            <p className="font-bold text-sm text-[var(--theme-text-primary)]">
                                No Matching Records Found
                            </p>
                            <p className="text-xs text-[var(--theme-text-secondary)]">
                                Try adjusting your search keyword or severity/type filters.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchTerm('');
                                    setFilterSeverity('All');
                                    setFilterType('All');
                                    setFilterStatus('All');
                                }}
                                className="mt-2 text-xs font-semibold text-[var(--theme-accent)] dark:text-[var(--theme-accent)] hover:underline cursor-pointer"
                            >
                                Clear all filters
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredRecords.map(rec => {
                        const isIssuer = Boolean(
                            (user?.id && rec.issued_by === user.id) ||
                            (user?.name && rec.issued_by === user.name)
                        );
                        const isExpired = rec.expires_at ? new Date(rec.expires_at) < new Date() : false;

                        return (
                            <div
                                key={rec.id}
                                className="p-5 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-[var(--shadow-sm)] space-y-3 transition-all hover:border-[var(--theme-border-strong)]"
                            >
                                {/* Top Header Row */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--theme-border)] pb-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="font-bold text-sm text-[var(--theme-text-primary)]">
                                                {rec.title}
                                            </h4>
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                                rec.severity === 'Critical'
                                                    ? 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)]'
                                                    : rec.severity === 'High'
                                                    ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30'
                                                    : 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]'
                                            }`}>
                                                {rec.severity} Severity
                                            </span>
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                                                {rec.record_type}
                                            </span>
                                            {rec.site_id && (
                                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)]">
                                                    {rec.site_id}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-xs text-[var(--theme-text-secondary)] font-medium mt-1">
                                            Personnel: <strong className="text-[var(--theme-text-primary)]">{rec.employee_name}</strong> ({rec.employee_id.slice(0, 8)})
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 self-start sm:self-auto">
                                        <span className="text-[11px] font-mono text-[var(--theme-text-secondary)]">
                                            {rec.issued_at ? new Date(rec.issued_at).toLocaleDateString() : 'Recent'}
                                        </span>
                                        {rec.appeal_status === 'Pending Appeal' && (
                                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center gap-1 animate-pulse">
                                                <Clock size={11} /> Appeal Pending
                                            </span>
                                        )}
                                        {rec.appeal_status === 'Upheld' && (
                                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)]">
                                                Sanction Upheld
                                            </span>
                                        )}
                                        {rec.appeal_status === 'Overturned' && (
                                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)]">
                                                Overturned
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-xs text-[var(--theme-text-primary)] line-clamp-2 leading-relaxed">
                                    {rec.description}
                                </p>

                                {/* Action Taken & Validity Banner */}
                                <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-[var(--theme-border)]">
                                    <span className="text-[var(--theme-text-primary)] font-medium">
                                        Mandated Sanction: <strong className="text-[var(--theme-text-primary)]">{rec.action_taken}</strong>
                                    </span>
                                    <div className="flex items-center gap-3 text-[11px] text-[var(--theme-text-secondary)]">
                                        {rec.expires_at && (
                                            <span className={isExpired ? 'text-stone-400 line-through' : 'text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]'}>
                                                {isExpired ? `Expired (${rec.expires_at})` : `Expires: ${rec.expires_at}`}
                                            </span>
                                        )}
                                        <span>Issued by: {rec.issued_by} ({rec.issued_by_role})</span>
                                    </div>
                                </div>

                                {/* Controls Row */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--theme-border)]">
                                    <button
                                        type="button"
                                        onClick={() => handleOpenDetail(rec)}
                                        className="h-8 px-3 rounded-xl text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] flex items-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                        <Eye size={13} />
                                        <span>View Case File</span>
                                    </button>

                                    <div className="flex items-center gap-2">
                                        {/* Appeal Trigger Button */}
                                        {rec.appeal_status === 'None' && (
                                            <button
                                                type="button"
                                                onClick={() => handleOpenFileAppeal(rec)}
                                                className="h-8 px-3 rounded-xl text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 border border-purple-500/30 transition-all cursor-pointer"
                                            >
                                                File Appeal
                                            </button>
                                        )}

                                        {/* 4-Eyes Adjudication Controls */}
                                        {rec.appeal_status === 'Pending Appeal' && canAdjudicate && (
                                            <>
                                                {isIssuer ? (
                                                    <span className="text-[11px] text-[var(--theme-status-warning-text)] font-semibold px-2">
                                                        4-Eyes rule: Issuer cannot resolve
                                                    </span>
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleResolveAppeal(rec.id, 'Overturned')}
                                                            className="h-8 px-3 rounded-xl text-xs font-semibold text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] bg-[var(--theme-status-success-bg)] border border-[var(--theme-status-success-border)] transition-all cursor-pointer"
                                                        >
                                                            Overturn Warning
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleResolveAppeal(rec.id, 'Upheld')}
                                                            className="h-8 px-3 rounded-xl text-xs font-semibold text-white bg-[var(--theme-status-danger-bg)] bg-[var(--theme-status-danger-bg)] shadow-xs transition-all cursor-pointer"
                                                        >
                                                            Uphold Sanction
                                                        </button>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modals */}
            <IssueNoticeModal
                isOpen={isNoticeModalOpen}
                onClose={() => setIsNoticeModalOpen(false)}
                onSuccess={loadRecords}
                country={country}
                employees={employees}
            />

            <AppealModal
                isOpen={isAppealModalOpen}
                onClose={() => {
                    setIsAppealModalOpen(false);
                    setSelectedRecord(null);
                }}
                onSuccess={loadRecords}
                record={selectedRecord}
            />

            <DisciplinaryDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedRecord(null);
                }}
                record={selectedRecord}
                onResolveAppeal={handleResolveAppeal}
                canAdjudicate={canAdjudicate}
                isIssuer={Boolean(
                    (user?.id && selectedRecord?.issued_by === user.id) ||
                    (user?.name && selectedRecord?.issued_by === user.name)
                )}
                onOpenFileAppeal={handleOpenFileAppeal}
            />
        </div>
    );
}
