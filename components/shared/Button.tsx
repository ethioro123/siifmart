import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
}

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    disabled,
    icon,
    className = '',
    ...props
}: ButtonProps) {
    const variants = {
        primary: 'bg-cyber-primary text-black hover:bg-cyber-accent shadow-[0_0_20px_rgba(0,255,157,0.3)]',
        secondary: 'bg-white/10 text-white hover:bg-white/20 border border-white/20',
        danger: 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50',
        success: 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/50',
        ghost: 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base'
    };

    const isDisabled = disabled || loading;

    return (
        <button
            className={`
        font-bold rounded-lg transition-all flex items-center justify-center gap-2
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
            disabled={isDisabled}
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
