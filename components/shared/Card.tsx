import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
    onClick?: () => void;
}

export default function Card({
    children,
    className = '',
    padding = 'md',
    hover = false,
    onClick
}: CardProps) {
    const paddingClasses = {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6'
    };

    return (
        <div
            className={`bg-cyber-gray border border-white/5 rounded-2xl ${paddingClasses[padding]} ${hover ? 'hover:bg-white/5 transition-colors cursor-pointer' : ''
                } ${onClick ? 'cursor-pointer' : ''} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
}
