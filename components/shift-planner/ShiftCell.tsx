import React from 'react';
import { Sun, Sunset, Moon, Clock, XCircle, Edit3, MessageSquare } from 'lucide-react';
import { StaffSchedule, Employee } from '../../types';
import { classifyShift, calculateShiftHours, ShiftCode } from '../../utils/shiftPlanner';

interface ShiftCellProps {
    employee: Employee;
    date: string;
    schedule: StaffSchedule | null;
    canEdit: boolean;
    onCycle: () => void;
    onEdit: () => void;
}

export const ShiftCell: React.FC<ShiftCellProps> = ({
    employee,
    date,
    schedule,
    canEdit,
    onCycle,
    onEdit
}) => {
    const shiftCode: ShiftCode = classifyShift(schedule);
    const hours = schedule && schedule.status !== 'Cancelled'
        ? calculateShiftHours(schedule.startTime, schedule.endTime)
        : 0;

    const isConfirmed = schedule?.status === 'Confirmed';
    const hasNotes = Boolean(schedule?.notes?.trim());

    // Color configs
    const getBadgeStyle = () => {
        switch (shiftCode) {
            case 'M':
                return {
                    bg: 'bg-[var(--theme-status-warning-bg)] bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)] border-[var(--theme-status-warning-border)]',
                    icon: Sun,
                    label: 'Morning',
                    timeStr: schedule?.startTime && schedule?.endTime ? `${schedule.startTime}–${schedule.endTime}` : '08:00–16:00'
                };
            case 'E':
                return {
                    bg: 'bg-[var(--theme-status-warning-bg)] bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)] border-[var(--theme-status-warning-border)]',
                    icon: Sunset,
                    label: 'Evening',
                    timeStr: schedule?.startTime && schedule?.endTime ? `${schedule.startTime}–${schedule.endTime}` : '16:00–00:00'
                };
            case 'N':
                return {
                    bg: 'bg-[var(--theme-accent-muted)] bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] text-[var(--theme-accent)] border-[var(--theme-border-accent)] border-[var(--theme-border-accent)]',
                    icon: Moon,
                    label: 'Night',
                    timeStr: schedule?.startTime && schedule?.endTime ? `${schedule.startTime}–${schedule.endTime}` : '00:00–08:00'
                };
            case 'C':
                return {
                    bg: 'bg-[var(--theme-status-success-bg)] bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)] border-[var(--theme-status-success-border)]',
                    icon: Clock,
                    label: 'Custom',
                    timeStr: schedule ? `${schedule.startTime}–${schedule.endTime}` : '09:00–17:00'
                };
            case 'O':
            default:
                return {
                    bg: 'bg-[color-mix(in_srgb,var(--theme-bg-subtle)_70%,transparent)] bg-[color-mix(in_srgb,var(--theme-bg-card)_70%,transparent)] text-[var(--theme-text-muted)] text-[var(--theme-text-secondary)] border-dashed border-[var(--theme-border-subtle)] border-[color-mix(in_srgb,var(--theme-border)_80%,transparent)]',
                    icon: XCircle,
                    label: 'Off',
                    timeStr: 'Scheduled Off'
                };
        }
    };

    const style = getBadgeStyle();
    const Icon = style.icon;

    return (
        <div className="relative group p-1 w-full h-full min-h-[64px] flex items-center justify-center">
            <button
                type="button"
                onClick={onCycle}
                disabled={!canEdit}
                title={canEdit ? `Click to cycle shift (Current: ${style.label})` : style.label}
                className={`w-full h-full min-h-[58px] p-2 rounded-xl border flex flex-col justify-between items-center transition-all ${style.bg} ${
                    canEdit ? 'hover:scale-[1.02] cursor-pointer active:scale-95 shadow-2xs' : 'cursor-default'
                }`}
            >
                {/* Top Row: Icon + Type + Status */}
                <div className="w-full flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                        <Icon size={13} className="shrink-0" />
                        <span className="text-[11px] font-bold tracking-tight truncate">
                            {style.label}
                        </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        {hasNotes && (
                            <span title={schedule?.notes || ''}>
                                <MessageSquare size={10} className="text-[var(--theme-text-muted)] text-[var(--theme-text-secondary)]" />
                            </span>
                        )}
                        {isConfirmed && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-status-success-bg)]" title="Confirmed Shift" />
                        )}
                    </div>
                </div>

                {/* Bottom Row: Time and Hours */}
                <div className="w-full flex items-center justify-between text-[10px] font-medium pt-1 border-t border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)]">
                    <span className="font-mono truncate">{style.timeStr}</span>
                    {hours > 0 && (
                        <span className="font-bold opacity-80 shrink-0 font-mono ml-1">{hours}h</span>
                    )}
                </div>
            </button>

            {/* Hover Edit Action */}
            {canEdit && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                    }}
                    title="Edit shift details & notes"
                    className="absolute top-2 right-2 p-1 rounded-md bg-[var(--theme-bg-card)] bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] shadow-xs text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--theme-primary)] transition-opacity cursor-pointer z-10"
                >
                    <Edit3 size={12} />
                </button>
            )}
        </div>
    );
};
