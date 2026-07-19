import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
    disabled?: boolean;
    className?: string;
    type?: 'submit' | 'reset' | 'button';
    title?: string;
}

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading: externalLoading = false,
    disabled,
    icon,
    className = '',
    onClick,
    title,
    ...props
}: ButtonProps) {
    const [internalLoading, setInternalLoading] = React.useState(false);

    const loading = externalLoading || internalLoading;

    const variants = {
        primary: 'bg-[#2C5E3B] text-white hover:bg-[#1E3F27] shadow-sm',
        secondary: 'bg-white/90 dark:bg-white/10 text-stone-800 dark:text-white hover:bg-stone-100 dark:hover:bg-white/20 border border-[#E2DCCE] dark:border-white/20 shadow-sm',
        danger: 'bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 hover:bg-red-500/20 border border-red-500/30 dark:border-red-500/50',
        success: 'bg-emerald-500/10 dark:bg-green-500/20 text-emerald-800 dark:text-green-400 hover:bg-emerald-500/20 border border-emerald-500/30 dark:border-green-500/50',
        ghost: 'bg-transparent text-[#4D6E56] dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/5'
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base'
    };

    const isDisabled = disabled || loading;

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!onClick) return;

        const result = onClick(e);

        // Check if result is a Promise
        if (result instanceof Promise) {
            setInternalLoading(true);
            try {
                await result;
            } finally {
                setInternalLoading(false);
            }
        }
    };

    return (
        <button
            className={`
        font-bold rounded-lg transition-all flex items-center justify-center gap-2
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'disabled:bg-stone-200 dark:disabled:bg-white/5 disabled:text-stone-400 dark:disabled:text-gray-600 border border-transparent disabled:border-stone-300 dark:disabled:border-white/10 opacity-70 cursor-not-allowed shadow-none' : ''}
        ${className}
      `}
            disabled={isDisabled}
            onClick={handleClick}
            title={title}
            {...props}
        >
            {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : icon ? (
                <span>{icon}</span>
            ) : null}
            {children}
        </button>
    );
}
