import React from 'react';
import { Phone, Home, PhoneCall, ShieldCheck } from 'lucide-react';
import { Employee } from '../../../../types';

interface ProfileContactCardProps {
    employee: Employee;
    canEdit: boolean;
    phone: string;
    setPhone: (val: string) => void;
    address: string;
    setAddress: (val: string) => void;
    emergencyContact: string;
    setEmergencyContact: (val: string) => void;
}

export const ProfileContactCard: React.FC<ProfileContactCardProps> = ({
    employee,
    canEdit,
    phone,
    setPhone,
    address,
    setAddress,
    emergencyContact,
    setEmergencyContact
}) => {
    const inputClasses = "w-full h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-4 text-xs text-[var(--theme-text-primary)] outline-none focus:border-[var(--theme-accent)] transition-colors";
    const labelClasses = "text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider mb-1.5 block px-1";
    const readOnlyClasses = "flex items-center justify-between p-3.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]";

    return (
        <div className="bg-[var(--theme-bg-card)] p-6 rounded-2xl border border-[var(--theme-border)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--theme-border)] pb-3">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                        <Phone size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-[var(--theme-text-primary)]">
                            Contact & Emergency Communications
                        </h4>
                        <p className="text-[11px] text-[var(--theme-text-secondary)]">
                            Operational telephone, primary residence, and designated emergency contact.
                        </p>
                    </div>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <ShieldCheck size={12} />
                    Direct Save
                </span>
            </div>

            {/* Phone */}
            <div>
                <label className={labelClasses}>
                    <Phone size={12} className="inline mr-1" /> Mobile Phone Number
                </label>
                {canEdit ? (
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+251 91 234 5678"
                        className={inputClasses}
                    />
                ) : (
                    <div className={readOnlyClasses}>
                        <p className="text-xs font-mono text-[var(--theme-text-primary)]">{employee.phone || 'Not recorded'}</p>
                    </div>
                )}
            </div>

            {/* Residence Address */}
            <div>
                <label className={labelClasses}>
                    <Home size={12} className="inline mr-1" /> Residence Address
                </label>
                {canEdit ? (
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Street, Building, Apt / House No."
                        className={inputClasses}
                    />
                ) : (
                    <div className={readOnlyClasses}>
                        <p className="text-xs text-[var(--theme-text-primary)]">{employee.address || 'Not recorded'}</p>
                    </div>
                )}
            </div>

            {/* Emergency Contact */}
            <div>
                <label className={labelClasses}>
                    <PhoneCall size={12} className="inline mr-1" /> Designated Emergency Contact
                </label>
                {canEdit ? (
                    <input
                        type="text"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        placeholder="e.g. Spouse (+251 91 122 3344)"
                        className={inputClasses}
                    />
                ) : (
                    <div className={readOnlyClasses}>
                        <p className="text-xs text-[var(--theme-text-primary)]">{employee.emergencyContact || 'Not recorded'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
