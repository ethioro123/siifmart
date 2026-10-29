import React from 'react';
import { User, Calendar, CreditCard, ShieldAlert } from 'lucide-react';
import { Employee } from '../../../../types';
import { formatDisplayEmployeeId } from '../../../../utils/employeeIdGenerator';

interface ProfileIdentityCardProps {
    employee: Employee;
    sites: any[];
    canEdit: boolean;
    isCEO: boolean;
    name: string;
    setName: (val: string) => void;
    age: string;
    setAge: (val: string) => void;
    dateOfBirth: string;
    setDateOfBirth: (val: string) => void;
    nationalIdNumber: string;
    setNationalIdNumber: (val: string) => void;
}

export const ProfileIdentityCard: React.FC<ProfileIdentityCardProps> = ({
    employee,
    sites,
    canEdit,
    isCEO,
    name,
    setName,
    age,
    setAge,
    dateOfBirth,
    setDateOfBirth,
    nationalIdNumber,
    setNationalIdNumber
}) => {
    const inputClasses = "w-full h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-4 text-xs text-[var(--theme-text-primary)] outline-none focus:border-[var(--theme-accent)] transition-colors";
    const labelClasses = "text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider mb-1.5 block px-1";
    const readOnlyClasses = "flex items-center justify-between p-3.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]";

    const isIdentityModified = 
        name !== employee.name ||
        age !== (employee.age?.toString() || '') ||
        dateOfBirth !== (employee.dateOfBirth || '') ||
        nationalIdNumber !== (employee.nationalIdNumber || '');

    return (
        <div className="bg-[var(--theme-bg-card)] p-6 rounded-2xl border border-[var(--theme-border)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--theme-border)] pb-3">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[var(--theme-accent-muted)] text-[var(--theme-accent)]">
                        <User size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-[var(--theme-text-primary)]">
                            Legal Identity & Sovereign Records
                        </h4>
                        <p className="text-[11px] text-[var(--theme-text-secondary)]">
                            Official personnel credentials, age verification, and national identification.
                        </p>
                    </div>
                </div>
            </div>

            {/* Personnel Code — Always read-only */}
            <div className={readOnlyClasses}>
                <div>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">Personnel Code</p>
                    <p className="text-[var(--theme-text-primary)] font-mono text-sm font-bold">{formatDisplayEmployeeId(employee, sites)}</p>
                </div>
                <span className="px-2.5 py-1 bg-[var(--theme-bg-card)] rounded-lg border border-[var(--theme-border)] text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">
                    Sovereign ID
                </span>
            </div>

            {/* Full Name */}
            <div>
                <label className={labelClasses}>Legal Full Name</label>
                {canEdit ? (
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full Legal Name"
                        className={inputClasses}
                    />
                ) : (
                    <div className={readOnlyClasses}>
                        <p className="text-xs font-bold text-[var(--theme-text-primary)]">{employee.name}</p>
                    </div>
                )}
            </div>

            {/* Age & Date of Birth */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                    <label className={labelClasses}>Age (Years)</label>
                    {canEdit ? (
                        <input
                            type="number"
                            min="16"
                            max="90"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            placeholder="e.g. 28"
                            className={inputClasses}
                        />
                    ) : (
                        <div className={readOnlyClasses}>
                            <p className="text-xs font-mono text-[var(--theme-text-primary)]">{employee.age || 'Not recorded'}</p>
                        </div>
                    )}
                </div>

                <div>
                    <label className={labelClasses}>
                        <Calendar size={12} className="inline mr-1" /> Date of Birth
                    </label>
                    {canEdit ? (
                        <input
                            type="date"
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                            className={inputClasses}
                        />
                    ) : (
                        <div className={readOnlyClasses}>
                            <p className="text-xs font-mono text-[var(--theme-text-primary)]">{employee.dateOfBirth || 'Not recorded'}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* National ID / Passport */}
            <div>
                <label className={labelClasses}>
                    <CreditCard size={12} className="inline mr-1" /> National ID / Passport Number
                </label>
                {canEdit ? (
                    <input
                        type="text"
                        value={nationalIdNumber}
                        onChange={(e) => setNationalIdNumber(e.target.value)}
                        placeholder="e.g. ET-ID-992812 or KRA-PIN"
                        className={inputClasses}
                    />
                ) : (
                    <div className={readOnlyClasses}>
                        <p className="text-xs font-mono text-[var(--theme-text-primary)]">{employee.nationalIdNumber || 'Not recorded'}</p>
                    </div>
                )}
            </div>

            {!isCEO && isIdentityModified && (
                <div className="p-3 rounded-xl bg-[var(--theme-accent-muted)] border border-[var(--theme-border-accent)] flex items-center gap-2.5 text-xs text-[var(--theme-accent)]">
                    <ShieldAlert size={15} className="shrink-0" />
                    <span>
                        Altering legal name, age, or national ID requires Executive & Compliance sign-off before applying to payroll.
                    </span>
                </div>
            )}
        </div>
    );
};
