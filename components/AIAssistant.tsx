/**
 * AI Navigation Assistant Component
 * Floating AI button with command palette
 * Powered by Groq for fast cloud-based AI
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, Loader, Zap, TrendingUp, Shield, Mic, MicOff, Bot } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { aiNavigationService } from '../services/ai-navigation.service';
import { openRouterService } from '../services/openrouter.service';
import { aiPermissionService } from '../services/ai-permissions.service';
import { aiProactiveSuggestionsService } from '../services/ai-proactive-suggestions.service';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { AIActionModal } from './AIActionModal';
import { aiAnomalyDetectorService } from '../services/ai-anomaly-detector.service';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiInitialized, setAiInitialized] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [pendingAction, setPendingAction] = useState<any>(null);
    const [isListening, setIsListening] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { user, impersonateUser, originalUser } = useStore();
    const { employees } = useData();
    const inputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);

    // Determine the "real" user (for AI access check)
    // If impersonating, use originalUser; otherwise use current user
    const realUser = originalUser || user;

    // Initialize AI on component mount (only once, based on real user)
    useEffect(() => {
        if (realUser?.role === 'super_admin') {
            initializeAI();
        }
    }, [realUser?.role]);

    // If real user is not super admin, do not render anything
    if (realUser?.role !== 'super_admin') {
        return null;
    }

    // Start proactive monitoring (super admin only)
    useEffect(() => {
        if (user?.role === 'super_admin' && user?.siteId) {
            aiProactiveSuggestionsService.startMonitoring(user.role, user.siteId);
            aiAnomalyDetectorService.startMonitoring(user.role, user.siteId);

            return () => {
                aiProactiveSuggestionsService.stopMonitoring();
                aiAnomalyDetectorService.stopMonitoring();
            };
        }
    }, [user?.role, user?.siteId]);

    // Load contextual suggestions when page changes
    useEffect(() => {
        if (aiInitialized && user?.role) {
            loadSuggestions();
        }
    }, [location.pathname, user?.role, aiInitialized]);

    // Keyboard shortcut: Cmd/Ctrl + K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            if (inputRef.current) {
                inputRef.current.focus();
            }
            // Initialize AI and check for suggestions
            if (!aiInitialized) {
                aiNavigationService.initialize().then(() => setAiInitialized(true));
            }

            // 🔔 PROACTIVE NOTIFICATIONS CHECK
            const checkNotifications = async () => {
                // Force a check
                await aiProactiveSuggestionsService.checkForSuggestions(user?.role || 'admin', user?.siteId || '');
                const suggestions = aiProactiveSuggestionsService.getSuggestions();

                if (suggestions.length > 0) {
                    const notificationContent = suggestions.map(s =>
                        `${s.type === 'alert' ? '🔴' : s.type === 'warning' ? '⚠️' : 'ℹ️'} **${s.title}**: ${s.message}`
                    ).join('\n\n');

                    setMessages(prev => {
                        // Avoid duplicate notifications
                        if (prev.some(m => m.content.includes('System Status Report'))) return prev;

                        return [...prev, {
                            role: 'assistant',
                            content: `🔔 **System Status Report**\n\n${notificationContent}\n\nWould you like me to address any of these?`,
                            timestamp: new Date(),
                            type: 'text'
                        }];
                    });
                }
            };

            checkNotifications();
        }
    }, [isOpen, user]);

    const initializeAI = async () => {
        try {
            await aiNavigationService.initialize();
            setAiInitialized(true);
        } catch (error) {
            console.error('Failed to initialize AI:', error);
        }
    };

    const loadSuggestions = async () => {
        if (!user?.role) return;

        const contextSuggestions = await aiNavigationService.getContextualSuggestions(
            user.role,
            location.pathname
        );

        // 🔒 Filter suggestions based on user permissions
        const allowedSuggestions = aiPermissionService.filterSuggestionsByPermissions(
            contextSuggestions,
            user.role
        );

        setSuggestions(allowedSuggestions);
    };

    // Cleanup voice recognition on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    // Listen for AI command events from proactive suggestions
    useEffect(() => {
        const handleAICommand = (event: any) => {
            const { command } = event.detail;
            setInput(command);
            setIsOpen(true);
            // Auto-execute after a short delay
            setTimeout(() => {
                handleCommand(command);
            }, 500);
        };

        window.addEventListener('ai-command', handleAICommand as EventListener);
        return () => window.removeEventListener('ai-command', handleAICommand as EventListener);
    }, []);

    const toggleVoice = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true; // Enable real-time feedback
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                console.log('🎤 Voice recognition started');
                setIsListening(true);
                setInput(''); // Clear input when starting
            };

            recognition.onend = () => {
                console.log('🎤 Voice recognition ended');
                setIsListening(false);
            };

            recognition.onerror = (event: any) => {
                if (event.error === 'no-speech') {
                    console.warn('⚠️ No speech detected. Please try again.');
                    setIsListening(false);
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: 'I didn\'t hear anything. Please try again.',
                        timestamp: new Date()
                    }]);
                    return;
                }

                console.error('❌ Speech recognition error:', event.error);
                setIsListening(false);
                if (event.error === 'not-allowed') {
                    alert('Microphone access denied. Please allow microphone access in your browser settings.');
                } else {
                    alert(`Voice error: ${event.error}`);
                }
            };

            recognition.onresult = (event: any) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                // Show interim results in real-time
                if (interimTranscript) {
                    setInput(interimTranscript);
                }

                // If we have a final result, submit it
                if (finalTranscript) {
                    console.log('📝 Final Transcript:', finalTranscript);
                    setInput(finalTranscript);
                    setTimeout(() => {
                        handleCommand(finalTranscript);
                    }, 500);
                }
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
            setIsListening(false);
        }
    };

    const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date; type?: 'text' | 'chart' | 'action'; data?: any }>>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleCommand = async (commandInput?: string) => {
        const cmd = commandInput || input;
        if (!cmd.trim()) return;

        // Add user message
        const userMsg = { role: 'user' as const, content: cmd, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);
        setSuggestions([]); // Clear suggestions on interaction

        try {
            // 2. Interpret command with AI (passing history)
            const intent = await aiNavigationService.interpretCommand(
                cmd,
                user?.role || 'admin',
                user?.siteId,
                location.pathname,
                messages // 🧠 Pass conversation history
            );
            // 📊 HANDLE REPORT DATA
            if (intent.params?.reportData) {
                const report = JSON.parse(intent.params.reportData);
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: intent.params.answer || 'Here is the report you requested:',
                    timestamp: new Date(),
                    type: 'chart',
                    data: report
                }]);
                setLoading(false);
                return;
            }

            // ⚡ HANDLE PENDING ACTION (Super Admin Only)
            if (intent.params?.actionData) {
                const actionData = JSON.parse(intent.params.actionData);
                setPendingAction(actionData);
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `⚡ Action detected: ${actionData.description}`,
                    timestamp: new Date(),
                    type: 'action',
                    data: actionData
                }]);
                setLoading(false);
                return;
            }

            // 💬 HANDLE Q&A RESPONSE
            if (intent.params?.answer && intent.action !== 'impersonate') {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: intent.params.answer,
                    timestamp: new Date()
                }]);
                setLoading(false);
                return;
            }

            // 👻 HANDLE GHOST MODE
            if (intent.action === 'impersonate' && intent.params?.targetUser) {
                try {
                    const targetName = intent.params.targetUser.toLowerCase();
                    const targetEmployee = employees.find(emp =>
                        emp.name.toLowerCase().includes(targetName) ||
                        emp.email.toLowerCase().includes(targetName)
                    );

                    if (targetEmployee) {
                        impersonateUser({
                            id: targetEmployee.id,
                            name: targetEmployee.name,
                            role: targetEmployee.role,
                            avatar: targetEmployee.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
                            title: targetEmployee.role.charAt(0).toUpperCase() + targetEmployee.role.slice(1),
                            siteId: targetEmployee.siteId,
                            employeeId: targetEmployee.id
                        });
                        setMessages(prev => [...prev, {
                            role: 'assistant',
                            content: `👻 Ghost Mode Activated! Now viewing as ${targetEmployee.name} (${targetEmployee.role})`,
                            timestamp: new Date()
                        }]);
                        setTimeout(() => setIsOpen(false), 1500);
                    } else {
                        setMessages(prev => [...prev, {
                            role: 'assistant',
                            content: `❌ User "${intent.params.targetUser}" not found. Try using their full name or email.`,
                            timestamp: new Date()
                        }]);
                    }
                } catch (error) {
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: `❌ Failed to activate Ghost Mode: ${error}`,
                        timestamp: new Date()
                    }]);
                }
                setLoading(false);
                return;
            }

            if (intent.confidence < 0.3) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `I'm not sure what you mean by "${cmd}". Try being more specific.`,
                    timestamp: new Date()
                }]);
                setLoading(false);
                return;
            }

            // 🔒 CHECK PERMISSIONS
            const permissionCheck = aiPermissionService.canAccessRoute(user?.role, intent.route);

            if (!permissionCheck.allowed) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `🔒 ${permissionCheck.reason}\n\n${aiPermissionService.getPermissionDeniedMessage(user?.role, intent.route)}`,
                    timestamp: new Date()
                }]);
                setLoading(false);
                return;
            }

            // Execute navigation
            if (intent.action === 'navigate') {
                navigate(intent.route);
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `✅ Navigating to ${intent.route}...`,
                    timestamp: new Date()
                }]);
                setTimeout(() => setIsOpen(false), 1000);
            } else if (intent.action === 'search') {
                const searchQuery = intent.params?.q || cmd;
                navigate(`${intent.route}?q=${encodeURIComponent(searchQuery)}`);
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `🔍 Searching for "${searchQuery}"...`,
                    timestamp: new Date()
                }]);
                setTimeout(() => setIsOpen(false), 1000);
            } else if (intent.action === 'create') {
                navigate(intent.route);
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `➕ Opening ${intent.entity || 'form'}...`,
                    timestamp: new Date()
                }]);
                setTimeout(() => setIsOpen(false), 1000);
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `I understood: ${intent.action} on ${intent.route}`,
                    timestamp: new Date()
                }]);
            }

        } catch (error) {
            console.error('AI command failed:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setInput(suggestion);
        setTimeout(() => handleCommand(suggestion), 100);
    };

    const { theme } = useStore();

    // ... (rest of the component)

    return (
        <>
            {/* Floating AI Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 w-14 h-14 ${theme === 'dark' ? 'bg-black/40 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-white/80 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]'} backdrop-blur-md border rounded-full hover:scale-110 transition-all flex items-center justify-center group z-50 animate-pulse-slow`}
                title="AI Assistant (⌘K)"
                aria-label="Open AI Assistant"
            >
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-600/20 to-blue-600/20 animate-spin-slow"></div>
                <Sparkles className="text-purple-500 group-hover:rotate-12 transition-all relative z-10" size={24} />
            </button>

            {/* AI Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4"
                    onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
                >
                    <div className={`${theme === 'dark' ? 'bg-gray-900/95 border-white/10' : 'bg-white/95 border-gray-200'} backdrop-blur-xl rounded-3xl border w-full max-w-2xl max-h-[85vh] shadow-2xl animate-slide-up overflow-hidden flex flex-col`}>
                        {/* Header */}
                        <div className={`p-6 border-b ${theme === 'dark' ? 'border-white/5 bg-gradient-to-r from-purple-900/20 via-gray-900/50 to-blue-900/20' : 'border-gray-100 bg-gradient-to-r from-purple-50 via-white to-blue-50'} relative overflow-hidden`}>
                            {/* Decorative glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>

                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 ${theme === 'dark' ? 'bg-black/40 border-purple-500/30' : 'bg-white border-purple-200'} border rounded-xl shadow-lg shadow-purple-500/10`}>
                                        <Bot size={24} className="text-purple-500" />
                                    </div>
                                    <div>
                                        <h2 className={`text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2`}>
                                            SIIF Intelligence
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-100 text-purple-600 border-purple-200'} border font-medium tracking-wider`}>BETA</span>
                                        </h2>
                                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} font-medium`}>Powered by OpenRouter AI</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all border border-white/5 hover:border-white/20"
                                    aria-label="Close"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Content Area - Scrollable */}
                        <div className={`p-8 space-y-6 overflow-y-auto flex-1 ${theme === 'dark' ? 'bg-gradient-to-b from-transparent to-black/20' : 'bg-gray-50/50'}`}>

                            {/* Chat History */}
                            <div className="space-y-6 mb-6">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                        {/* Avatar */}
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user'
                                            ? (theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600')
                                            : (theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600')
                                            }`}>
                                            {msg.role === 'user' ? (
                                                <div className="font-bold text-xs">YOU</div>
                                            ) : (
                                                <Bot size={16} />
                                            )}
                                        </div>

                                        {/* Message Bubble */}
                                        <div className={`max-w-[80%] space-y-2`}>
                                            <div className={`p-4 rounded-2xl ${msg.role === 'user'
                                                ? (theme === 'dark' ? 'bg-purple-500/10 border-purple-500/20 text-purple-100' : 'bg-purple-600 text-white')
                                                : (theme === 'dark' ? 'bg-white/5 border-white/10 text-gray-200' : 'bg-white border-gray-200 text-gray-800 shadow-sm')
                                                } border backdrop-blur-md relative overflow-hidden group`}>
                                                <p className="text-sm leading-relaxed whitespace-pre-line">
                                                    {msg.content}
                                                </p>
                                            </div>

                                            {/* Timestamp */}
                                            <p className={`text-[10px] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} px-2`}>
                                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>

                                            {/* Chart Rendering */}
                                            {msg.type === 'chart' && msg.data && msg.data.sections.map((section: any, i: number) => (
                                                section.data && (
                                                    <div key={i} className={`mt-4 h-48 w-full p-4 rounded-xl border ${theme === 'dark' ? 'bg-black/40 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                                                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-2 uppercase font-bold`}>{section.title}</p>
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={section.data}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                                                                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} />
                                                                <YAxis stroke="#9CA3AF" fontSize={10} />
                                                                <Tooltip
                                                                    contentStyle={{
                                                                        backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
                                                                        borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
                                                                        color: theme === 'dark' ? '#F3F4F6' : '#1F2937'
                                                                    }}
                                                                    itemStyle={{ color: '#8B5CF6' }}
                                                                />
                                                                <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]}>
                                                                    {section.data.map((entry: any, index: number) => (
                                                                        <Cell key={`cell-${index}`} fill={['#8B5CF6', '#EC4899', '#3B82F6', '#10B981'][index % 4]} />
                                                                    ))}
                                                                </Bar>
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {/* Loading Indicator */}
                                {loading && (
                                    <div className="flex gap-4 animate-in fade-in duration-300">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                                            <Bot size={16} />
                                        </div>
                                        <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'} border flex items-center gap-2`}>
                                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Quick Actions / Suggestions (Only show if no messages) */}
                            {messages.length === 0 && suggestions.length > 0 && !loading && (
                                <div className="mt-8">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Zap size={14} className="text-purple-500" />
                                        <p className={`text-[10px] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} uppercase font-bold tracking-widest`}>Suggested Actions</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {suggestions.map((suggestion, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSuggestionClick(suggestion)}
                                                className={`text-left px-4 py-3 ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10 border-white/5 text-gray-400 hover:text-white' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-900'} border hover:border-purple-500/30 rounded-xl text-sm transition-all group relative overflow-hidden shadow-sm`}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all"></div>
                                                <span className="relative z-10 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500/50 group-hover:bg-purple-400 transition-colors"></span>
                                                    {suggestion}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Examples (Only show if no messages) */}
                            {messages.length === 0 && !loading && !pendingAction && (
                                <div className={`mt-8 pt-6 border-t ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <TrendingUp size={14} className="text-blue-400" />
                                        <p className={`text-[10px] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} uppercase font-bold tracking-widest`}>System Capabilities</p>
                                    </div>
                                    <div className="space-y-2">
                                        {[
                                            'Analyze sales performance',
                                            'Locate inventory items',
                                            'Initiate purchase order',
                                            'Check warehouse status'
                                        ].map((example, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setInput(example)}
                                                className={`w-full text-left px-4 py-2 text-xs ${theme === 'dark' ? 'text-gray-500 hover:text-purple-300 hover:bg-white/5' : 'text-gray-500 hover:text-purple-600 hover:bg-gray-50'} rounded-lg transition-all font-mono flex items-center gap-3 group`}
                                            >
                                                <span className="opacity-30 group-hover:opacity-100 transition-opacity">_</span>
                                                {example}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Confirmation Modal Overlay */}
                            {pendingAction && (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
                                    <div className="w-full max-w-md">
                                        <AIActionModal
                                            action={pendingAction}
                                            onConfirm={() => {
                                                setPendingAction(null);
                                                setMessages(prev => [...prev, {
                                                    role: 'assistant',
                                                    content: `✅ Action executed successfully!`,
                                                    timestamp: new Date()
                                                }]);
                                            }}
                                            onCancel={() => {
                                                setPendingAction(null);
                                                setMessages(prev => [...prev, {
                                                    role: 'assistant',
                                                    content: '❌ Action cancelled.',
                                                    timestamp: new Date()
                                                }]);
                                            }}
                                            userRole={user?.role || ''}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area - Fixed at Bottom */}
                        <div className={`p-6 border-t ${theme === 'dark' ? 'border-white/5 bg-black/40' : 'border-gray-100 bg-white'}`}>
                            <div className="flex gap-3 relative">
                                <div className="flex-1 relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl opacity-20 group-focus-within:opacity-50 transition-opacity blur"></div>
                                    <input
                                        ref={inputRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && !loading && handleCommand()}
                                        placeholder={
                                            isListening
                                                ? "Listening..."
                                                : (user?.role === 'super_admin' ? "Enter command or query..." : "Type your request...")
                                        }
                                        className={`relative w-full ${theme === 'dark' ? 'bg-black/60 border-white/10 text-white placeholder-gray-600' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'} border rounded-xl px-5 py-4 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all font-medium ${isListening ? 'animate-pulse border-purple-500/50' : ''}`}
                                        disabled={loading}
                                    />
                                    {/* Voice Button */}
                                    <button
                                        onClick={toggleVoice}
                                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${isListening ? 'bg-red-500/20 text-red-400' : (theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100')}`}
                                        title="Voice Command"
                                    >
                                        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                                    </button>
                                </div>
                                <button
                                    onClick={() => handleCommand()}
                                    disabled={loading || !input.trim()}
                                    className="px-6 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] border border-purple-400/20"
                                >
                                    {loading ? (
                                        <Loader className="animate-spin" size={20} />
                                    ) : (
                                        <Send size={20} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className={`px-6 py-4 border-t ${theme === 'dark' ? 'border-white/5 bg-black/20' : 'border-gray-100 bg-gray-50'} flex justify-between items-center`}>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.5)] animate-pulse"></div>
                                <p className={`text-[10px] ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'} font-mono uppercase tracking-wider`}>
                                    {aiInitialized
                                        ? 'OpenRouter AI • Cloud-Powered'
                                        : 'Initializing...'}
                                </p>
                            </div>
                            <p className={`text-[10px] ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'} font-mono`}>
                                ESC_TO_CLOSE
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Styles */}
            <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}</style>
        </>
    );
}
