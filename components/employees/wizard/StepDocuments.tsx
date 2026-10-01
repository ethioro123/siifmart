import React, { useState, useRef } from 'react';
import { 
    Upload, FileText, CheckCircle2, Trash2, IdCard, 
    FileUp, Sparkles, AlertCircle, Loader2, Plus, Award, ShieldCheck 
} from 'lucide-react';
import { compressImageFile, readDocumentFile, validateFileSize, MAX_DOCUMENT_FILE_SIZE_MB } from '../../../utils/imageCompression';

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
    const [isUploadingCert, setIsUploadingCert] = useState(false);
    const [certCategory, setCertCategory] = useState('Certificate');

    const idInputRef = useRef<HTMLInputElement>(null);
    const resumeInputRef = useRef<HTMLInputElement>(null);
    const certInputRef = useRef<HTMLInputElement>(null);

    // Handle National ID Upload with Automatic High-Efficiency Compression
    const handleIdFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
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
            addNotification('alert', `Failed to compress ID photo: ${err?.message || 'Unknown error'}`);
        } finally {
            setIsCompressingId(false);
            if (idInputRef.current) idInputRef.current.value = '';
        }
    };

    // Handle Resume Upload
    const handleResumeSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
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
                    type: doc.type,
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

    // Handle Additional Certificates Upload
    const handleCertSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
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
                    type: doc.type,
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

    const removeNationalId = () => {
        setNewEmpData((prev: any) => ({
            ...prev,
            nationalIdPhoto: null,
            nationalIdInfo: null
        }));
    };

    const removeResume = () => {
        setNewEmpData((prev: any) => ({
            ...prev,
            resume: null
        }));
    };

    const removeCertificate = (id: string) => {
        setNewEmpData((prev: any) => ({
            ...prev,
            certificates: (prev.certificates || []).filter((c: any) => c.id !== id)
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
                        Upload official identification (up to 5MB max with automatic compression), CV, and certifications.
                    </p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                    Max 5MB / file
                </span>
            </div>

            {/* SECTION 1: NATIONAL ID PHOTO WITH COMPRESSION */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#18201B] border border-[#E2DCCE] dark:border-white/10 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                    <label className="text-xs text-[#1E3F27] dark:text-[#EAE5D9] font-bold uppercase tracking-wide flex items-center gap-2">
                        <IdCard size={15} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        <span>National ID / Passport Document Photo <span className="text-rose-500">*</span></span>
                    </label>
                    {newEmpData.nationalIdInfo && (
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200 dark:border-emerald-500/20">
                            <Sparkles size={11} />
                            <span>{newEmpData.nationalIdInfo.reductionPercent}% size reduction</span>
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
                                        onClick={() => idInputRef.current?.click()}
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
                                onClick={() => idInputRef.current?.click()}
                                className="border-2 border-dashed border-[#E2DCCE] dark:border-white/10 hover:border-[#2C5E3B] dark:hover:border-emerald-500/50 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all aspect-[4/3] bg-stone-50/50 dark:bg-white/[0.01] group"
                            >
                                {isCompressingId ? (
                                    <div className="flex flex-col items-center">
                                        <Loader2 size={24} className="animate-spin text-[#2C5E3B] dark:text-[#A9CBA2] mb-2" />
                                        <span className="text-[11px] font-bold text-[#2C5E3B] dark:text-[#A9CBA2]">Compressing...</span>
                                    </div>
                                ) : (
                                    <>
                                        <FileUp size={24} className="text-stone-400 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] mb-1.5 group-hover:scale-110 transition-transform" />
                                        <span className="text-xs font-bold text-stone-700 dark:text-stone-200">Upload ID Card</span>
                                        <span className="text-[10px] text-stone-400 mt-0.5">JPG / PNG up to 5MB</span>
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
                                National ID / Kebele / Passport Number
                            </label>
                            <input
                                className="w-full bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2 text-stone-900 dark:text-white focus:border-[#2C5E3B] dark:focus:border-emerald-500 outline-none text-sm font-mono"
                                placeholder="e.g. ET-10492819 or KE-3891024"
                                value={newEmpData.nationalIdNumber || ''}
                                onChange={e => setNewEmpData({ ...newEmpData, nationalIdNumber: e.target.value })}
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
                                    Original: <span className="line-through text-stone-400">{newEmpData.nationalIdInfo.originalSize}</span> → Compressed: <strong className="text-emerald-700 dark:text-emerald-400">{newEmpData.nationalIdInfo.compressedSize}</strong>
                                </p>
                            </div>
                        ) : (
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                                Upload a clear phone photo or scanner image (up to 5MB). The system automatically compresses the file by ~90%+ to save database bandwidth while keeping the text and photo sharp.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* SECTION 2: RESUME / CV */}
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
                                <p className="text-[10px] text-stone-400 font-mono">{newEmpData.resume.size} • {newEmpData.resume.type.toUpperCase()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => resumeInputRef.current?.click()}
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
                        onClick={() => resumeInputRef.current?.click()}
                        className="border-2 border-dashed border-[#E2DCCE] dark:border-white/10 hover:border-[#2C5E3B] dark:hover:border-emerald-500/50 rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all bg-stone-50/50 dark:bg-white/[0.01] group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-stone-200/60 dark:bg-white/5 text-stone-500 dark:text-stone-400 flex items-center justify-center group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors">
                                {isUploadingResume ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-stone-700 dark:text-stone-200 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors">
                                    Upload Candidate Resume
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
            <div className="p-4 rounded-2xl bg-white dark:bg-[#18201B] border border-[#E2DCCE] dark:border-white/10 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                    <label className="text-xs text-[#1E3F27] dark:text-[#EAE5D9] font-bold uppercase tracking-wide flex items-center gap-2">
                        <Award size={15} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        <span>Certificates & Verification Credentials</span>
                    </label>
                    <span className="text-[10px] text-stone-400 font-mono">
                        {(newEmpData.certificates || []).length} Attached
                    </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <select
                        value={certCategory}
                        onChange={e => setCertCategory(e.target.value)}
                        className="bg-stone-50 dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 dark:text-stone-200 outline-none"
                    >
                        <option value="Degree / Diploma">Academic Degree / Diploma</option>
                        <option value="Certificate">Professional Certificate</option>
                        <option value="Good Conduct">Certificate of Good Conduct</option>
                        <option value="Driver License">Driver's License</option>
                        <option value="Medical Clearance">Medical Clearance Form</option>
                        <option value="Other">Other Compliance Document</option>
                    </select>

                    <button
                        type="button"
                        onClick={() => certInputRef.current?.click()}
                        disabled={isUploadingCert}
                        className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-stone-700 dark:text-stone-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-[#E2DCCE] dark:border-white/10"
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
                                className="p-2.5 rounded-xl bg-stone-50 dark:bg-white/[0.02] border border-[#E2DCCE]/60 dark:border-white/5 flex items-center justify-between gap-3 text-xs"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                                        <Award size={14} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-stone-800 dark:text-stone-200 truncate">{cert.name}</p>
                                        <p className="text-[10px] text-stone-400 font-mono">
                                            {cert.category} • {cert.size}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeCertificate(cert.id)}
                                    className="p-1 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
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
        </div>
    );
}
