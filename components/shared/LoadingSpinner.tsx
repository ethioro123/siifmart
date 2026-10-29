import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    color?: 'primary' | 'white' | 'gray';
    fullScreen?: boolean;
    text?: string;
}

export default function LoadingSpinner({
    size = 'md',
    color = 'primary',
    fullScreen = false,
    text
}: LoadingSpinnerProps) {
    const sizes = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-2',
        lg: 'w-12 h-12 border-3',
        xl: 'w-16 h-16 border-4'
    };

    const colors = {
        primary: 'border-[var(--theme-accent)] border-t-transparent',
        white: 'border-[var(--theme-text-primary)] border-t-transparent',
        gray: 'border-[var(--theme-text-secondary)] border-t-transparent'
    };

    const spinner = (
        <div className="flex flex-col items-center gap-3">
            <div className={`rounded-full animate-spin ${sizes[size]} ${colors[color]}`} />
            {text && <p className="text-sm text-[var(--theme-text-secondary)]">{text}</p>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-[var(--theme-overlay-strong)] backdrop-blur-sm flex items-center justify-center z-50">
                {spinner}
            </div>
        );
    }

    return spinner;
}
