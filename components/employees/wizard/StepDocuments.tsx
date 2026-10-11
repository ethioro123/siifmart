import React, { useState, useRef, useEffect } from 'react';
import { 
    Upload, FileText, CheckCircle2, Trash2, IdCard, 
    FileUp, Sparkles, Loader2, ShieldCheck 
} from 'lucide-react';
import { compressImageFile, readDocumentFile, validateFileSize, MAX_DOCUMENT_FILE_SIZE_MB } from '../../../utils/imageCompression';
import { StepDocumentsCertificates } from './StepDocumentsCertificates';

interface StepDocumentsProps {
    newEmpData: any;
    setNewEmpData: (data: any) => void;
    addNotification: (type: 'success' | 'alert' | 'info', message: string) => void;
}

export default function StepDocuments({
    newEmpData,
    setNewEmpData,
    addNotification
}: StepDocumentsProps) {
    const [isCompressingId, setIsCompressingId] = useState(false);
    const [isUploadingResume, setIsUploadingResume] = useState(false);

    // Drag-and-drop active visual states
    const [isDraggingId, setIsDraggingId] = useState(false);
    const [isDraggingResume, setIsDraggingResume] = useState(false);

    const idInputRef = useRef<HTMLInputElement>(null);
    const resumeInputRef = useRef<HTMLInputElement>(null);

    // Global drag-and-drop shield: prevents the browser from navigating away
    // if a file is dropped anywhere on the window outside of specific dropzones
    useEffect(() => {
        const preventDefaultDrop = (e: DragEvent) => {
            e.preventDefault();
        };
        window.addEventListener('dragover', preventDefaultDrop);
        window.addEventListener('drop', preventDefaultDrop);
        return () => {
            window.removeEventListener('dragover', preventDefaultDrop);
            window.removeEventListener('drop', preventDefaultDrop);
        };
    }, []);

    // Reusable National ID Processing Pipeline
    const processIdFile = async (file: File) => {
        if (!file) return;

        const check = validateFileSize(file);
        if (!check.valid) {
            addNotification('alert', check.error || `File exceeds ${MAX_DOCUMENT_FILE_SIZE_MB}MB limit.`);
            if (idInputRef.current) idInputRef.current.value = '';
            return;
        }

        setIsCompressingId(true);
        try {
            const compressed = await compressImageFile(file, 1280, 1280, 0.78);
            setNewEmpData((prev: any) => ({
                ...prev,
                nationalIdPhoto: compressed.dataUrl,
                nationalIdInfo: {
                    name: file.name,
                    originalSize: compressed.originalSizeFormatted,
                    compressedSize: compressed.compressedSizeFormatted,
                    reductionPercent: compressed.compressionRatioPercent
                }
            }));
            addNotification('success', `National ID uploaded & compressed (${compressed.originalSizeFormatted} → ${compressed.compressedSizeFormatted}, ${compressed.compressionRatioPercent}% reduced).`);
        } catch (err: any) {
            addNotification('alert', `Failed to process ID photo: ${err?.message || 'Please upload a valid JPG or PNG image.'}`);
        } finally {
            setIsCompressingId(false);
            if (idInputRef.current) idInputRef.current.value = '';
        }
    };

    // Reusable Resume Processing Pipeline
    const processResumeFile = async (file: File) => {
        if (!file) return;

        const check = validateFileSize(file);
        if (!check.valid) {
            addNotification('alert', check.error || `Resume exceeds ${MAX_DOCUMENT_FILE_SIZE_MB}MB limit.`);
            if (resumeInputRef.current) resumeInputRef.current.value = '';
            return;
        }

        setIsUploadingResume(true);
        try {
            const doc = await readDocumentFile(file);
            setNewEmpData((prev: any) => ({
                ...prev,
                resume: {
                    name: doc.name,
                    size: doc.size,
                    type: doc.type || 'pdf',
                    dataUrl: doc.dataUrl
                }
            }));
            addNotification('success', `Resume "${doc.name}" attached successfully.`);
        } catch (err: any) {
            addNotification('alert', `Failed to attach resume: ${err?.message || 'Unknown error'}`);
        } finally {
            setIsUploadingResume(false);
            if (resumeInputRef.current) resumeInputRef.current.value = '';
        }
    };

    // File Input change handlers
    const handleIdFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processIdFile(file);
    };

    const handleResumeSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processResumeFile(file);
    };

    const removeNationalId = (e: React.MouseEvent) => {
        e.stopPropagation();
        setNewEmpData((prev: any) => ({
            ...prev,
            nationalIdPhoto: null,
            nationalIdInfo: null
        }));
    };

    const removeResume = (e: React.MouseEvent) => {
        e.stopPropagation();
        setNewEmpData((prev: any) => ({
            ...prev,
            resume: null
        }));
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            {/* Header Description */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2DCCE]/60 dark:border-white/5">
                <div>
                    <h4 className="text-sm font-bold text-[#1E3F27] dark:text-[#EAE5D9] flex items-center gap-2">
                        <ShieldCheck size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        <span>Personnel Credentials & Documents</span>
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                        Upload or drag & drop official ID, resume/CV, and certifications (up to 5MB with auto-compression).
                    </p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                    Max 5MB / file
                </span>
            </div>

            {/* SECTION 1: NATIONAL ID PHOTO WITH COMPRESSION & DRAG-AND-DROP */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#18201B] border border-[#E2DCCE] dark:border-white/10 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                    <label className="text-xs text-[#1E3F27] dark:text-[#EAE5D9] font-bold uppercase tracking-wide flex items-center gap-2">
                        <IdCard size={15} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        <span>National ID / Passport Document Photo <span className="text-rose-500">*</span></span>
                    </label>
                    {newEmpData.nationalIdInfo && (
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200 dark:border-emerald-500/20">
                            <Sparkles size={11} />
                            <span>{newEmpData.nationalIdInfo.reductionPercent ?? 0}% size reduction</span>
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                    {/* ID Photo Preview or Upload Zone */}
                    <div className="sm:col-span-1">
                        {newEmpData.nationalIdPhoto ? (
                            <div className="relative group rounded-xl overflow-hidden border border-[#E2DCCE] dark:border-white/10 aspect-[4/3] bg-stone-100 dark:bg-black/30">
                                <img
                                    src={newEmpData.nationalIdPhoto}
                                    alt="National ID Preview"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); idInputRef.current?.click(); }}
                                        className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-white/40 text-xs font-bold transition-colors cursor-pointer"
                                        title="Change ID Photo"
                                    >
                                        Change
                                    </button>
                                    <button
                                        type="button"
                                        onClick={removeNationalId}
                                        className="p-1.5 rounded-lg bg-rose-600/80 text-white hover:bg-rose-700 text-xs font-bold transition-colors cursor-pointer"
                                        title="Remove ID Photo"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={(e) => { e.stopPropagation(); idInputRef.current?.click(); }}
                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingId(true); }}
                                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingId(true); }}
                                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingId(false); }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsDraggingId(false);
                                    const file = e.dataTransfer.files?.[0];
                                    if (file) processIdFile(file);
                                }}
                                className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all aspect-[4/3] group ${
                                    isDraggingId 
                                        ? 'border-[#2C5E3B] dark:border-emerald-400 bg-emerald-50/40 dark:bg-emerald-500/10 scale-[1.02]' 
                                        : 'border-[#E2DCCE] dark:border-white/10 hover:border-[#2C5E3B] dark:hover:border-emerald-500/50 bg-stone-50/50 dark:bg-white/[0.01]'
                                }`}
                            >
                                {isCompressingId ? (
                                    <div className="flex flex-col items-center">
                                        <Loader2 size={24} className="animate-spin text-[#2C5E3B] dark:text-[#A9CBA2] mb-2" />
                                        <span className="text-[11px] font-bold text-[#2C5E3B] dark:text-[#A9CBA2]">Compressing...</span>
                                    </div>
                                ) : (
                                    <>
                                        <FileUp size={24} className={`mb-1.5 transition-transform ${isDraggingId ? 'scale-125 text-[#2C5E3B] dark:text-[#A9CBA2]' : 'text-stone-400 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] group-hover:scale-110'}`} />
                                        <span className="text-xs font-bold text-stone-700 dark:text-stone-200">
                                            {isDraggingId ? 'Drop ID Card Photo Here' : 'Upload or Drop ID Card'}
                                        </span>
                                        <span className="text-[10px] text-stone-400 mt-0.5">JPG / PNG / WEBP up to 5MB</span>
                                    </>
                                )}
                            </div>
                        )}
                        <input
                            type="file"
                            ref={idInputRef}
                            onChange={handleIdFileSelect}
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            title="National ID Card File"
                        />
                    </div>

                    {/* ID Metadata & Number */}
                    <div className="sm:col-span-2 space-y-3">
                        <div>
                            <label className="text-[11px] text-stone-600 dark:text-stone-300 uppercase font-bold mb-1 block">
                                National ID / Passport Number
                            </label>
                            <input
                                className="w-full bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2 text-stone-900 dark:text-white focus:border-[#2C5E3B] dark:focus:border-emerald-500 outline-none text-sm font-mono"
                                placeholder="e.g. ET-10492819 or KE-3891024"
                                value={newEmpData.nationalIdNumber || ''}
                                onChange={e => setNewEmpData((prev: any) => ({ ...prev, nationalIdNumber: e.target.value }))}
                                aria-label="National ID Number"
                            />
                        </div>

                        {newEmpData.nationalIdInfo ? (
                            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                                <p className="font-bold flex items-center gap-1.5">
                                    <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                                    <span>High-Efficiency Compression Applied</span>
                                </p>
                                <p className="text-[11px] text-stone-600 dark:text-stone-300 font-mono">
                                    Original: <span className="line-through text-stone-400">{newEmpData.nationalIdInfo.originalSize || 'N/A'}</span> → Compressed: <strong className="text-emerald-700 dark:text-emerald-400">{newEmpData.nationalIdInfo.compressedSize || 'N/A'}</strong>
                                </p>
                            </div>
                        ) : (
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                                Upload a clear photo or scan of employee ID card. The system automatically optimizes image resolution and applies ~90% compression to protect server bandwidth.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* SECTION 2: RESUME / CV WITH DRAG-AND-DROP */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#18201B] border border-[#E2DCCE] dark:border-white/10 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                    <label className="text-xs text-[#1E3F27] dark:text-[#EAE5D9] font-bold uppercase tracking-wide flex items-center gap-2">
                        <FileText size={15} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        <span>Curriculum Vitae / Resume</span>
                    </label>
                    <span className="text-[10px] text-stone-400 font-mono">PDF, DOC, DOCX</span>
                </div>

                {newEmpData.resume ? (
                    <div className="p-3 rounded-xl bg-stone-50 dark:bg-white/[0.02] border border-[#E2DCCE] dark:border-white/10 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] flex items-center justify-center shrink-0">
                                <FileText size={18} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">{newEmpData.resume.name}</p>
                                <p className="text-[10px] text-stone-400 font-mono">
                                    {newEmpData.resume.size} • {(newEmpData.resume.type || 'FILE').toUpperCase()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); resumeInputRef.current?.click(); }}
                                className="px-2.5 py-1 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-[#2C5E3B] hover:bg-stone-200/50 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                            >
                                Replace
                            </button>
                            <button
                                type="button"
                                onClick={removeResume}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Remove Resume"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={(e) => { e.stopPropagation(); resumeInputRef.current?.click(); }}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingResume(true); }}
                        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingResume(true); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingResume(false); }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDraggingResume(false);
                            const file = e.dataTransfer.files?.[0];
                            if (file) processResumeFile(file);
                        }}
                        className={`border-2 border-dashed rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all group ${
                            isDraggingResume 
                                ? 'border-[#2C5E3B] dark:border-emerald-400 bg-emerald-50/40 dark:bg-emerald-500/10 scale-[1.01]' 
                                : 'border-[#E2DCCE] dark:border-white/10 hover:border-[#2C5E3B] dark:hover:border-emerald-500/50 bg-stone-50/50 dark:bg-white/[0.01]'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${isDraggingResume ? 'bg-[#2C5E3B] text-white' : 'bg-stone-200/60 dark:bg-white/5 text-stone-500 dark:text-stone-400 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2]'}`}>
                                {isUploadingResume ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-stone-700 dark:text-stone-200 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors">
                                    {isDraggingResume ? 'Drop Resume File Here' : 'Upload or Drop Candidate Resume'}
                                </p>
                                <p className="text-[10px] text-stone-400">PDF, DOC, DOCX up to 5MB</p>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-[#2C5E3B] dark:text-[#A9CBA2] px-3 py-1.5 rounded-lg bg-[#2C5E3B]/10 dark:bg-emerald-500/10 border border-[#2C5E3B]/20 dark:border-emerald-500/20">
                            Browse
                        </span>
                    </div>
                )}
                <input
                    type="file"
                    ref={resumeInputRef}
                    onChange={handleResumeSelect}
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    title="Upload Resume File"
                />
            </div>

            {/* SECTION 3: OTHER DOCUMENTS & CERTIFICATES */}
            <StepDocumentsCertificates
                newEmpData={newEmpData}
                setNewEmpData={setNewEmpData}
                addNotification={addNotification}
            />
        </div>
    );
}
