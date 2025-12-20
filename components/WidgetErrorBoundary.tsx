import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
    children: ReactNode;
    title?: string;
    className?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class WidgetErrorBoundary extends React.Component<Props, State> {
    state: State = {
        hasError: false,
        error: null
    };

    constructor(props: Props) {
        super(props);
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Widget crashing:', error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className={`bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center h-full min-h-[200px] ${this.props.className || ''}`}>
                    <div className="p-3 bg-red-500/20 rounded-full mb-3 text-red-500">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-white font-bold mb-1">
                        {this.props.title || 'Widget Failed'}
                    </h3>
                    <p className="text-red-400 text-xs mb-4 max-w-[200px]">
                        {this.state.error?.message || 'Something went wrong.'}
                    </p>
                    <button
                        onClick={this.handleRetry}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                        <RotateCcw size={12} />
                        <span>Retry</span>
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
