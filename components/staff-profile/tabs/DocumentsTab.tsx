import React from 'react';
import { Upload, FileText, Download, Trash2, FileCheck } from 'lucide-react';
import { EmployeeDocument } from '../../../utils/employeeProfileData';

interface DocumentsTabProps {
    documents: EmployeeDocument[];
    documentInputRef: React.RefObject<HTMLInputElement | null>;
    handleDocumentUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleDeleteDocument: (docId: string) => void;
    canUpload?: boolean;
}

export default function DocumentsTab({
    documents,
    documentInputRef,
    handleDocumentUpload,
    handleDeleteDocument,
    canUpload = true
}: DocumentsTabProps) {
    const handleDownload = (doc: EmployeeDocument) => {
        if (!doc.dataUrl) {
            // Create dummy text download if no dataUrl
            const blob = new Blob([`SIIFMART Verified Document: ${doc.name}\nUploaded: ${doc.uploadedAt}`], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.name;
            a.click();
            URL.revokeObjectURL(url);
            return;
        }

        const a = document.createElement('a');
        a.href = doc.dataUrl;
        a.download = doc.name;
        a.click();
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Upload Zone */}
            {canUpload && (
                <div
                    onClick={() => documentInputRef.current?.click()}
                    className="p-8 border-2 border-dashed border-[var(--theme-border)] rounded-2xl text-center hover:border-[var(--theme-accent)]/60 transition-colors cursor-pointer bg-[var(--theme-bg-card)] group relative overflow-hidden shadow-xs"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') documentInputRef.current?.click(); }}
                >
                    <Upload className="mx-auto text-[var(--theme-text-muted)] group-hover:text-[var(--theme-accent)] group-hover:scale-105 transition-all mb-3" size={32} />
                    <p className="text-base text-[var(--theme-text-primary)] font-bold tracking-normal">
                        Upload Staff Document
                    </p>
                    <p className="text-xs text-[var(--theme-text-secondary)] mt-1 font-medium">
                        Employment contracts, government IDs, certifications, and compliance forms
                    </p>
                </div>
            )}

            <input
                type="file"
                ref={documentInputRef}
                onChange={handleDocumentUpload}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                title="Upload Document"
            />

            {/* Documents List */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[var(--theme-text-primary)] uppercase tracking-wider">
                        Official Personnel Files ({documents.length})
                    </h4>
                </div>

                {documents.length === 0 ? (
                    <div className="text-center py-16 bg-[var(--theme-bg-card)] rounded-2xl border border-dashed border-[var(--theme-border)] space-y-2">
                        <FileText size={40} className="mx-auto text-[var(--theme-text-muted)]" />
                        <p className="font-semibold text-sm text-[var(--theme-text-primary)]">
                            No Documents Uploaded Yet
                        </p>
                        <p className="text-xs text-[var(--theme-text-secondary)]">
                            Signed employment agreements, ID cards, and medical certificates will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {documents.map(doc => (
                            <div
                                key={doc.id}
                                className="p-4 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/30 flex items-center justify-between gap-3 shadow-xs group transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-accent)] shrink-0">
                                        <FileCheck size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold text-sm text-[var(--theme-text-primary)] truncate">
                                                {doc.name}
                                            </p>
                                            {doc.category && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 shrink-0">
                                                    {doc.category}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono tabular-nums mt-0.5">
                                            Uploaded: {doc.uploadedAt} • {doc.size}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                        onClick={() => handleDownload(doc)}
                                        className="p-2 rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-accent)] hover:bg-[var(--theme-bg-subtle)] transition-colors cursor-pointer"
                                        title="Download / View Document"
                                    >
                                        <Download size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteDocument(doc.id)}
                                        className="p-2 rounded-xl text-[var(--theme-text-muted)] text-[var(--theme-status-danger-text)] bg-[var(--theme-status-danger-bg)] transition-colors cursor-pointer"
                                        title="Delete Document"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
