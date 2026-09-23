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
                    className="p-8 border-2 border-dashed border-[#E2DCCE] dark:border-white/10 rounded-2xl text-center hover:border-[#2C5E3B]/60 transition-all cursor-pointer bg-[#FAF8F5] dark:bg-white/5 group relative overflow-hidden shadow-xs"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') documentInputRef.current?.click(); }}
                >
                    <Upload className="mx-auto text-stone-400 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] group-hover:scale-110 transition-all mb-3" size={36} />
                    <p className="text-base text-[#1E3F27] dark:text-[#EAE5D9] font-black uppercase tracking-wider">
                        Upload Staff Document
                    </p>
                    <p className="text-xs text-stone-500 mt-1 font-medium">
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
                    <h4 className="text-sm font-black text-[#1E3F27] dark:text-[#EAE5D9] uppercase tracking-wider">
                        Official Personnel Files ({documents.length})
                    </h4>
                </div>

                {documents.length === 0 ? (
                    <div className="text-center py-16 bg-[#FAF8F5] dark:bg-black/20 rounded-2xl border border-dashed border-[#E2DCCE] dark:border-white/10 space-y-2">
                        <FileText size={40} className="mx-auto text-stone-300 dark:text-stone-600" />
                        <p className="font-bold text-sm text-[#1E3F27] dark:text-[#EAE5D9]">
                            No Documents Uploaded Yet
                        </p>
                        <p className="text-xs text-stone-400">
                            Signed employment agreements, ID cards, and medical certificates will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {documents.map(doc => (
                            <div
                                key={doc.id}
                                className="p-4 bg-[#FAF8F5] dark:bg-black/30 rounded-2xl border border-[#E2DCCE] dark:border-white/10 flex items-center justify-between gap-3 shadow-xs group"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-[#E2DCCE] dark:border-white/10 text-[#2C5E3B] dark:text-[#A9CBA2] shrink-0">
                                        <FileCheck size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm text-[#1E3F27] dark:text-[#EAE5D9] truncate">
                                            {doc.name}
                                        </p>
                                        <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                                            Uploaded: {doc.uploadedAt} • {doc.size}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                        onClick={() => handleDownload(doc)}
                                        className="p-2 rounded-xl text-[#2C5E3B] dark:text-[#A9CBA2] hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors cursor-pointer"
                                        title="Download / View Document"
                                    >
                                        <Download size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteDocument(doc.id)}
                                        className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
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
