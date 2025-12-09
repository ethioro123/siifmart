import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, CheckCircle, X, ArrowRight, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { aiProactiveSuggestionsService, ProactiveSuggestion } from '../services/ai-proactive-suggestions.service';
import { useStore } from '../contexts/CentralStore';

export function ProactiveSuggestions() {
    const [suggestions, setSuggestions] = useState<ProactiveSuggestion[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const { user } = useStore();

    // Explicitly restrict to super_admin
    if (user?.role !== 'super_admin') {
        return null;
    }

    useEffect(() => {
        // Only for super admin for now
        if (user?.role !== 'super_admin') return;

        // Initial load
        updateSuggestions();

        // Poll for updates every 5 seconds (UI update, service updates data every 5 min)
        const interval = setInterval(updateSuggestions, 5000);

        return () => clearInterval(interval);
    }, [user]);

    const updateSuggestions = () => {
        const current = aiProactiveSuggestionsService.getSuggestions();
        setSuggestions(current);
    };

    const handleAction = (action: any) => {
        if (action.action === 'navigate') {
            navigate(action.params.route);
            setIsOpen(false);
        } else if (action.action === 'execute_ai_action') {
            // Trigger AI command directly
            const command = action.params.command;
            // Open AI assistant with pre-filled command
            window.dispatchEvent(new CustomEvent('ai-command', { detail: { command } }));
            setIsOpen(false);
        } else if (action.action === 'dismiss') {
            // Handled by dismiss button usually, but if action button does it
        }
    };

    const handleDismiss = (id: string) => {
        aiProactiveSuggestionsService.dismissSuggestion(id);
        updateSuggestions();
    };

    if (suggestions.length === 0) return null;

    return (
        <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-2">
            {/* Minimized Badge */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-black/40 backdrop-blur-md border border-purple-500/50 p-3 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:shadow-[0_0_25px_rgba(168,85,247,0.8)] flex items-center gap-2 transition-all group relative"
                >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-600/20 to-blue-600/20 animate-spin-slow"></div>
                    <Bell size={20} className="text-white relative z-10 group-hover:rotate-12 transition-transform" />
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full absolute -top-1 -right-1 shadow-lg border border-black/50">
                        {suggestions.length}
                    </span>
                </button>
            )}

            {/* Expanded List */}
            {isOpen && (
                <div className="bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.15)] w-80 overflow-hidden flex flex-col max-h-[80vh] animate-slide-up">
                    <div className="p-4 border-b border-white/5 bg-gradient-to-r from-purple-900/20 to-blue-900/20 flex justify-between items-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
                        <h3 className="font-bold text-white flex items-center gap-2 text-sm tracking-wide">
                            <SparklesIcon /> AI INSIGHTS
                            <span className="bg-purple-500/20 text-purple-300 text-[10px] px-2 py-0.5 rounded-full border border-purple-500/30">
                                {suggestions.length}
                            </span>
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-400 hover:text-white transition-colors"
                            aria-label="Close suggestions"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="overflow-y-auto p-3 gap-3 flex flex-col">
                        {suggestions.map((suggestion) => (
                            <div
                                key={suggestion.id}
                                className={`p-4 rounded-xl border ${getBorderColor(suggestion.type)} bg-white/5 hover:bg-white/10 transition-colors relative group backdrop-blur-sm`}
                            >
                                <button
                                    onClick={() => handleDismiss(suggestion.id)}
                                    className="absolute top-2 right-2 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label="Dismiss suggestion"
                                >
                                    <X size={14} />
                                </button>

                                <div className="flex gap-3">
                                    <div className={`mt-1 ${getIconColor(suggestion.type)}`}>
                                        {getIcon(suggestion.type)}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-white mb-1">{suggestion.title}</h4>
                                        <p className="text-xs text-gray-400 mb-3 leading-relaxed">{suggestion.message}</p>

                                        <div className="flex gap-2 flex-wrap">
                                            {suggestion.actions.map((action, idx) => (
                                                action.action !== 'dismiss' && (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleAction(action)}
                                                        className="text-[10px] bg-white/5 hover:bg-purple-500/20 text-gray-300 hover:text-purple-200 border border-white/10 hover:border-purple-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all uppercase tracking-wide font-medium"
                                                    >
                                                        {action.label}
                                                        <ArrowRight size={10} />
                                                    </button>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function getIcon(type: string) {
    switch (type) {
        case 'warning': return <AlertTriangle size={16} />;
        case 'alert': return <AlertTriangle size={16} />;
        case 'success': return <CheckCircle size={16} />;
        default: return <Info size={16} />;
    }
}

function getIconColor(type: string) {
    switch (type) {
        case 'warning': return 'text-yellow-500';
        case 'alert': return 'text-red-500';
        case 'success': return 'text-green-500';
        default: return 'text-blue-500';
    }
}

function getBorderColor(type: string) {
    switch (type) {
        case 'warning': return 'border-yellow-500/30';
        case 'alert': return 'border-red-500/30';
        case 'success': return 'border-green-500/30';
        default: return 'border-blue-500/30';
    }
}

const SparklesIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
);
