import React from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
    return (
        <div className="min-h-screen bg-cyber-black flex flex-col items-center justify-center p-6 text-center">
            <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-lg w-full backdrop-blur-xl">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-black text-white tracking-widest uppercase italic mb-4">
                    Neural Link Distorted
                </h2>
                <p className="text-gray-400 font-mono text-sm mb-6 bg-black/40 p-4 rounded-lg border border-white/5 break-words">
                    {(error as any).message || 'Unknown system anomaly detected.'}
                </p>
                <button
                    onClick={resetErrorBoundary}
                    className="w-full py-4 bg-cyber-primary text-black font-black uppercase tracking-[0.2em] rounded-xl hover:bg-cyber-accent transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    Re-initialize System
                </button>
                <p className="mt-4 text-[10px] text-gray-500 font-mono uppercase tracking-tighter">
                    Error code: CORE_FLICKER_V1
                </p>
            </div>
        </div>
    );
}

export function GlobalErrorBoundary({ children }: { children: React.ReactNode }) {
    return (
        <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onReset={() => {
                // Optional: clear caches or local storage here
                window.location.href = '/';
            }}
        >
            {children}
        </ErrorBoundary>
    );
}
