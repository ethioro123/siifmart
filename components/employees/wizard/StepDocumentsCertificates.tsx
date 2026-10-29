import React, { useState, useRef } from 'react';
import { Award, Plus, Trash2, Loader2 } from 'lucide-react';
import {
    compressImageFile,
    readDocumentFile,
    validateFileSize,
    MAX_DOCUMENT_FILE_SIZE_MB
} from '../../../utils/imageCompression';

export const DOCUMENT_CATEGORIES = [
    { id: 'Professional Certificate', label: 'Professional Certificate' },
    { id: "Driver's License", label: "Driver's License" },
    { id: 'Academic Degree / Diploma', label: 'Academic Degree / Diploma' },
    { id: 'Certificate of Good Conduct', label: 'Certificate of Good Conduct' },
    { id: 'National ID / Passport', label: 'National ID / Passport' },
    { id: 'Medical Clearance Form', label: 'Medical Clearance Form' },
    { id: 'Employment Contract / NDA', label: 'Employment Contract / NDA' },
    { id: 'Other Compliance Document', label: 'Other Compliance Document' }
] as const;

interface StepDocumentsCertificatesProps {
    newEmpData: any;
    setNewEmpData: (data: any) => void;
    addNotification: (type: 'success' | 'alert' | 'info', message: string) => void;
}

export const StepDocumentsCertificates: React.FC<StepDocumentsCertificatesProps> = ({
    newEmpData,
    setNewEmpData,
    addNotification
}) => {
    const [isUploadingCert, setIsUploadingCert] = useState(false);
    const [certCategory, setCertCategory] = useState<string>(DOCUMENT_CATEGORIES[0].id);
    const [isDraggingCert, setIsDraggingCert] = useState(false);
    const certInputRef = useRef<HTMLInputElement>(null);

    const processCertFile = async (file: File) => {
        if (!file) return;

        const check = validateFileSize(file);
        if (!check.valid) {
            addNotification('alert', check.error || `Certificate file exceeds ${MAX_DOCUMENT_FILE_SIZE_MB}MB limit.`);
            if (certInputRef.current) certInputRef.current.value = '';
            return;
        }

        setIsUploadingCert(true);
        try {
            let docData: { name: string; size: string; type: string; dataUrl: string };

            if (file.type.startsWith('image/')) {
                const compressed = await compressImageFile(file, 1280, 1280, 0.8);
                docData = {
                    name: file.name,
                    size: compressed.compressedSizeFormatted,
                    type: 'jpg',
                    dataUrl: compressed.dataUrl
                };
            } else {
                const doc = await readDocumentFile(file);
                docData = {
                    name: doc.name,
                    size: doc.size,
                    type: doc.type || 'pdf',
                    dataUrl: doc.dataUrl
                };
            }

            const newCertItem = {
                id: `cert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                name: docData.name,
                size: docData.size,
                type: docData.type,
                category: certCategory,
                dataUrl: docData.dataUrl
            };

            setNewEmpData((prev: any) => ({
                ...prev,
                certificates: [...(prev.certificates || []), newCertItem]
            }));
            addNotification('success', `Certificate attached: "${docData.name}"`);
        } catch (err: any) {
            addNotification('alert', `Failed to upload document: ${err?.message || 'Unknown error'}`);
        } finally {
            setIsUploadingCert(false);
            if (certInputRef.current) certInputRef.current.value = '';
        }
    };

    const handleCertSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processCertFile(file);
    };

    const removeCertificate = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setNewEmpData((prev: any) => ({
            ...prev,
            certificates: (prev.certificates || []).filter((c: any) => c.id !== id)
        }));
    };

    const updateCertCategory = (id: string, newCategory: string) => {
        setNewEmpData((prev: any) => ({
            ...prev,
            certificates: (prev.certificates || []).map((c: any) =>
                c.id === id ? { ...c, category: newCategory } : c
            )
        }));
        addNotification('info', `Document category set to "${newCategory}"`);
    };

    return (
        <div className="p-4 rounded-2xl bg-white dark:bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] dark:border-white/10 shadow-xs">
            <div className="flex items-center justify-between mb-3">
                <label className="text-xs text-[var(--theme-text-primary)] dark:text-[var(--theme-text-secondary)] font-bold uppercase tracking-wide flex items-center gap-2">
                    <Award size={15} className="text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)]" />
                    <span>Certificates & Verification Credentials</span>
                </label>
                <span className="text-[10px] text-stone-400 font-mono">
                    {(newEmpData.certificates || []).length} Attached
                </span>
            </div>

            <div
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingCert(true); }}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingCert(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingCert(false); }}
                onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingCert(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) processCertFile(file);
                }}
                className={`flex flex-col sm:flex-row gap-2 mb-3 p-2 rounded-2xl transition-all ${
                    isDraggingCert ? 'border-2 border-dashed border-[var(--theme-border)] bg-[var(--theme-status-success-bg)] bg-[var(--theme-status-success-bg)]' : ''
                }`}
            >
                <select
                    value={certCategory}
                    onChange={e => setCertCategory(e.target.value)}
                    className="bg-stone-50 dark:bg-black/30 border border-[var(--theme-border)] dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 dark:text-stone-200 outline-none cursor-pointer"
                >
                    {DOCUMENT_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                </select>

                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); certInputRef.current?.click(); }}
                    disabled={isUploadingCert}
                    className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-stone-700 dark:text-stone-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-[var(--theme-border)] dark:border-white/10"
                >
                    {isUploadingCert ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    <span>Add Document</span>
                </button>
                <input
                    type="file"
                    ref={certInputRef}
                    onChange={handleCertSelect}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf"
                    className="hidden"
                    title="Add Certificate Document"
                />
            </div>

            {/* List of uploaded certificates */}
            {(newEmpData.certificates || []).length > 0 ? (
                <div className="space-y-2 mt-2">
                    {(newEmpData.certificates || []).map((cert: any) => (
                        <div
                            key={cert.id}
                            className="p-2.5 rounded-xl bg-stone-50 dark:bg-white/[0.02] border border-[var(--theme-border)]/60 dark:border-white/5 flex items-center justify-between gap-3 text-xs"
                        >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="p-1.5 rounded-lg bg-[var(--theme-status-warning-bg)] bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] shrink-0">
                                    <Award size={14} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-stone-800 dark:text-stone-200 truncate">{cert.name}</p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <select
                                            value={cert.category || 'Professional Certificate'}
                                            onChange={(e) => updateCertCategory(cert.id, e.target.value)}
                                            className="text-[10px] font-bold bg-white dark:bg-black/40 border border-[var(--theme-border)] dark:border-white/10 rounded-md px-2 py-0.5 text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] outline-none cursor-pointer hover:border-[var(--theme-border)]"
                                            title="Change Document Category"
                                        >
                                            {DOCUMENT_CATEGORIES.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                                            ))}
                                        </select>
                                        <span className="text-[10px] text-stone-400 font-mono">
                                            {cert.size}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => removeCertificate(e, cert.id)}
                                className="p-1 text-stone-400 text-[var(--theme-status-danger-text)] transition-colors cursor-pointer"
                                title="Delete Document"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-[11px] text-stone-400 italic">No additional certificates attached yet.</p>
            )}
        </div>
    );
};
