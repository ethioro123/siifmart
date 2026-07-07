import React from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { logger } from '../../utils/logger';

interface ModuleErrorFallbackProps extends FallbackProps {
  moduleName: string;
}

function ModuleErrorFallback({ error, resetErrorBoundary, moduleName }: ModuleErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] p-6 text-center">
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-md w-full backdrop-blur-xl">
        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-2">
          {moduleName} Module Error
        </h3>
        <p className="text-sm text-gray-400 font-mono mb-4 bg-black/40 p-3 rounded-lg border border-white/5 break-words text-left">
          {error instanceof Error ? error.message : 'An unexpected error occurred in this module.'}
        </p>
        <p className="text-[10px] text-gray-500 mb-4">
          Other modules continue to work. Only this section is affected.
        </p>
        <button
          onClick={resetErrorBoundary}
          className="w-full py-3 bg-cyber-primary/20 hover:bg-cyber-primary/30 text-cyber-primary font-bold uppercase tracking-widest text-xs rounded-xl transition-colors border border-cyber-primary/20"
        >
          Retry {moduleName}
        </button>
      </div>
    </div>
  );
}

interface ModuleErrorBoundaryProps {
  /** Display name for the module (e.g., "POS", "Fulfillment", "Inventory") */
  moduleName: string;
  /** Optional callback when error is caught */
  onError?: (error: Error, info: React.ErrorInfo) => void;
  children: React.ReactNode;
}

/**
 * Per-module error boundary that catches errors within a specific module
 * without crashing the entire application.
 *
 * Usage:
 * ```tsx
 * <ModuleErrorBoundary moduleName="POS">
 *   <POSTerminal />
 * </ModuleErrorBoundary>
 * ```
 */
export function ModuleErrorBoundary({ moduleName, onError, children }: ModuleErrorBoundaryProps) {
  return (
    <ErrorBoundary
      FallbackComponent={(props: FallbackProps) => (
        <ModuleErrorFallback {...props} moduleName={moduleName} />
      )}
      onError={(error: Error, info) => {
        logger.error(moduleName, 'render', error, {
          componentStack: info.componentStack ?? undefined,
        });
        onError?.(error, info);
      }}
      onReset={() => {
        // Module-level reset: don't navigate away, just re-render the module
        logger.warn(moduleName, `User reset ${moduleName} module after error`);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
