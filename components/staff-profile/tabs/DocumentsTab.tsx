import React, { RefObject } from 'react';
import { Upload, FileText } from 'lucide-react';

interface DocumentsTabProps {
    documentInputRef: React.RefObject<HTMLInputElement | null>;
    handleDocumentUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function DocumentsTab({ documentInputRef, handleDocumentUpload }: DocumentsTabProps) {
    return (
        <div className="space-y-6 animate-in fade-in">
            <div
                onClick={() => documentInputRef.current?.click()}
                className="p-10 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-2xl text-center hover:border-cyber-primary/50 transition-all cursor-pointer bg-gray-50 dark:bg-white/5 group relative overflow-hidden"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') documentInputRef.current?.click(); }}
            >
                <div className="absolute inset-0 bg-cyber-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Upload className="mx-auto text-gray-400 group-hover:text-cyber-primary group-hover:scale-110 transition-all mb-4" size={40} />
                <p className="text-lg text-gray-900 dark:text-white font-black uppercase tracking-widest">Upload New Document</p>
                <p className="text-sm text-gray-500 mt-2 font-medium">Drag & drop files here or click to browse</p>
            </div>
            <input
                type="file"
                ref={documentInputRef}
                onChange={handleDocumentUpload}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                title="Upload Document"
            />

            <div className="space-y-3">
                <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4">Official Documents</h4>
                <div className="text-center py-20 bg-gray-50 dark:bg-black/20 rounded-2xl border border-dashed border-gray-300 dark:border-white/10">
                    <FileText size={48} className="mx-auto mb-4 text-gray-300 dark:text-white/10" />
                    <p className="text-gray-500 font-bold">No documents uploaded yet.</p>
                    <p className="text-xs text-gray-500 dark:text-gray-600 mt-1">Contracts, IDs, and certifications will appear here.</p>
                </div>
            </div>
        </div>
    );
}
