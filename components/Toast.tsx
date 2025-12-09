import React, { useState, useEffect } from 'react';
import { X, Clock, AlertTriangle } from 'lucide-react';
import { APP_CONFIG } from '../config/app.config';

interface ToastProps {
    message: string;
    type?: 'info' | 'warning' | 'error' | 'success';
    duration?: number;
    onClose: () => void;
}

/**
 * Toast Notification Component
 * Used for session warnings and other notifications
 */
export default function Toast({ message, type = 'info', duration, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for fade-out animation
        }, duration || APP_CONFIG.TOAST_DURATION);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const colors = {
        info: 'bg-blue-500',
        warning: 'bg-yellow-500',
        error: 'bg-red-500',
        success: 'bg-green-500',
    };

    const icons = {
        info: Clock,
        warning: AlertTriangle,
        error: AlertTriangle,
        success: Clock,
    };

    const Icon = icons[type];

    return (
        <div
            className={`fixed top-20 right-6 z-50 ${colors[type]} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] max-w-[500px] transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                }`}
        >
            <Icon size={20} className="shrink-0" />
            <p className="flex-1 text-sm font-medium">{message}</p>
            <button
                onClick={() => {
                    setIsVisible(false);
                    setTimeout(onClose, 300);
                }}
                className="shrink-0 hover:bg-white/20 p-1 rounded transition-colors"
                aria-label="Close notification"
            >
                <X size={16} />
            </button>
        </div>
    );
}
