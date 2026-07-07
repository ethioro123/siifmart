import React from 'react';
import { Package } from 'lucide-react';

interface EmptyStateProps {
    message: string;
}

export const EmptyState = ({ message }: EmptyStateProps) => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10 rounded-2xl">
        <Package className="text-gray-600 mb-2" size={32} />
        <p className="text-gray-400 text-sm font-medium">{message}</p>
    </div>
);
