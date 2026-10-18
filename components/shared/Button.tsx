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
        primary: 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:bg-[var(--theme-primary-hover)] shadow-sm active:scale-[0.99]',
        secondary: 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] shadow-sm active:scale-[0.99]',
        danger: 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] hover:opacity-90 border border-[var(--theme-status-danger-border)] active:scale-[0.99]',
        success: 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] hover:opacity-90 border border-[var(--theme-status-success-border)] active:scale-[0.99]',
        ghost: 'bg-transparent text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)]'
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
        font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'disabled:bg-[var(--theme-bg-subtle)] disabled:text-[var(--theme-text-muted)] border border-transparent disabled:border-[var(--theme-border-subtle)] opacity-60 cursor-not-allowed shadow-none active:scale-100' : ''}
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
