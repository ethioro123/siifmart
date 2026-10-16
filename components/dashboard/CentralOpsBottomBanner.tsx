import React from 'react';
import { Activity, Download } from 'lucide-react';
import { DesktopDownloadButton } from './widgets/DesktopDownloadButton';

interface CentralOpsBottomBannerProps {
    onGenerateReport: () => void;
}

export const CentralOpsBottomBanner: React.FC<CentralOpsBottomBannerProps> = ({
    onGenerateReport
}) => {
    return (
        <div className="mt-12 p-5 sm:p-6 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-xl bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 flex items-center justify-center shrink-0">
                    <Activity size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-[var(--theme-text-primary)]">
                        SIIFMART Central Operations Suite
                    </h4>
                    <p className="text-xs text-[var(--theme-text-secondary)]">
                        Download native desktop workstation or generate periodic operational intelligence reports
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <DesktopDownloadButton />

                <button
                    onClick={onGenerateReport}
                    className="flex items-center gap-2 px-4 py-2.5 h-[42px] rounded-xl bg-[var(--theme-accent)] hover:opacity-90 text-white text-xs font-semibold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                    title="Generate Operational Performance Report"
                >
                    <Download size={16} />
                    <span>Executive Report</span>
                </button>
            </div>
        </div>
    );
};
