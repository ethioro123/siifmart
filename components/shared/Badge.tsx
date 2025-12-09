import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function Badge({
    children,
    variant = 'neutral',
    size = 'md',
    className = ''
}: BadgeProps) {
    const variants = {
        primary: 'bg-cyber-primary/20 text-cyber-primary border-cyber-primary/50',
        success: 'bg-green-500/20 text-green-400 border-green-500/50',
        warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
        danger: 'bg-red-500/20 text-red-400 border-red-500/50',
        info: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
        neutral: 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    };

    const sizes = {
        sm: 'text-[10px] px-2 py-0.5',
        md: 'text-xs px-2.5 py-1',
        lg: 'text-sm px-3 py-1.5'
    };

    return (
        <span
            className={`inline-flex items-center font-bold rounded-lg border ${variants[variant]} ${sizes[size]} ${className}`}
        >
            {children}
        </span>
    );
}
