import React, { useEffect, useState } from 'react';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { aiNavigationService } from '../services/ai-navigation.service';
import { X, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export function AIDiagnostics() {
    const { user, originalUser } = useStore();
    const { employees } = useData();
    const [isOpen, setIsOpen] = useState(false);
    const [aiReady, setAiReady] = useState(false);
    const [checks, setChecks] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            runDiagnostics();
        }
    }, [isOpen]);

    const runDiagnostics = async () => {
        const diagnostics = [];

        // Check 1: User role
        diagnostics.push({
            name: 'User Role Check',
            status: user?.role === 'super_admin' ? 'pass' : 'fail',
            message: user?.role === 'super_admin'
                ? `✓ Logged in as Super Admin (${user.name})`
                : `✗ Current role: ${user?.role || 'unknown'} (AI requires super_admin)`,
            details: `User: ${user?.name || 'Not logged in'}, Role: ${user?.role || 'N/A'}`
        });

        // Check 2: AI Service
        diagnostics.push({
            name: 'AI Service Status',
            status: aiNavigationService.isReady() ? 'pass' : 'warn',
            message: aiNavigationService.isReady()
                ? '✓ AI Engine initialized'
                : '⚠ AI Engine not initialized (will initialize on first use)',
            details: 'WebLLM Model: Qwen2.5-7B-Instruct-q4f16_1-MLC'
        });

        // Check 3: Browser API
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        diagnostics.push({
            name: 'Voice Recognition API',
            status: SpeechRecognition ? 'pass' : 'fail',
            message: SpeechRecognition
                ? '✓ Speech Recognition API available'
                : '✗ Speech Recognition not supported in this browser',
            details: 'Supported browsers: Chrome, Edge, Safari'
        });

        // Check 4: Employees data
        diagnostics.push({
            name: 'Employee Database',
            status: employees.length > 0 ? 'pass' : 'warn',
            message: employees.length > 0
                ? `✓ ${employees.length} employees loaded`
                : '⚠ No employees found',
            details: `Available for Ghost Mode impersonation`
        });

        // Check 5: Ghost Mode
        diagnostics.push({
            name: 'Ghost Mode Status',
            status: originalUser ? 'active' : 'inactive',
            message: originalUser
                ? `🟢 Ghost Mode ACTIVE - Impersonating ${user?.name}`
                : '⚪ Ghost Mode inactive',
            details: originalUser ? `Original user: ${originalUser.name}` : 'Not impersonating'
        });

        // Check 6: Component render
        diagnostics.push({
            name: 'AIAssistant Component',
            status: 'pass',
            message: '✓ Diagnostics component is rendering (AIAssistant should also render)',
            details: 'If you see this, React is working correctly'
        });

        setChecks(diagnostics);
        setAiReady(aiNavigationService.isReady());
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-6 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-all text-sm font-bold z-50"
            >
                🔍 AI Diagnostics
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-gray-900 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-white">AI System Diagnostics</h2>
                        <p className="text-sm text-gray-400 mt-1">Checking AI features and Ghost Mode</p>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Diagnostics */}
                <div className="p-6 space-y-4">
                    {checks.map((check, i) => (
                        <div
                            key={i}
                            className={`p-4 rounded-xl border ${check.status === 'pass' ? 'bg-green-500/10 border-green-500/30' :
                                    check.status === 'fail' ? 'bg-red-500/10 border-red-500/30' :
                                        check.status === 'active' ? 'bg-yellow-500/10 border-yellow-500/30' :
                                            'bg-blue-500/10 border-blue-500/30'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5">
                                    {check.status === 'pass' ? <CheckCircle size={20} className="text-green-400" /> :
                                        check.status === 'fail' ? <XCircle size={20} className="text-red-400" /> :
                                            check.status === 'active' ? <AlertTriangle size={20} className="text-yellow-400" /> :
                                                <AlertTriangle size={20} className="text-blue-400" />}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-white text-sm">{check.name}</h3>
                                    <p className="text-sm text-gray-300 mt-1">{check.message}</p>
                                    <p className="text-xs text-gray-500 mt-1">{check.details}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-white/10 bg-gray-800/50">
                    <h3 className="font-bold text-white mb-3">Quick Actions</h3>
                    <div className="space-y-2">
                        <button
                            onClick={runDiagnostics}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-all"
                        >
                            🔄 Refresh Diagnostics
                        </button>
                        {user?.role !== 'super_admin' && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                                <p className="text-sm text-yellow-300">
                                    <strong>To enable AI features:</strong><br />
                                    Login as: <code className="bg-black/30 px-2 py-0.5 rounded">shukri.kamal@siifmart.com</code><br />
                                    Password: <code className="bg-black/30 px-2 py-0.5 rounded">Test123!</code>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
