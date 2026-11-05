import React from 'react';
import Modal from '../../Modal';
import { Employee } from '../../../types';

interface SendMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee;
    messageInput: string;
    setMessageInput: (val: string) => void;
    handleConfirmSendMessage: () => void;
}

export default function SendMessageModal({
    isOpen,
    onClose,
    employee,
    messageInput,
    setMessageInput,
    handleConfirmSendMessage
}: SendMessageModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Send Secure Message" size="md">
            <div className="space-y-4">
                <p className="text-[var(--theme-text-secondary)] text-sm">
                    Sending secure message to <span className="text-[var(--theme-text-primary)] font-bold">{employee.name}</span>:
                </p>
                <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-3.5 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] focus:ring-1 focus:ring-[var(--theme-accent)]/20 transition-all min-h-[140px] outline-none placeholder:text-[var(--theme-text-muted)] resize-none"
                    placeholder="Type your communication here..."
                />
                <div className="flex justify-end gap-2.5 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="min-h-11 px-4 rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] font-semibold text-xs transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmSendMessage}
                        disabled={!messageInput.trim()}
                        className="min-h-11 px-5 bg-[var(--theme-accent)] hover:opacity-95 text-[var(--theme-text-primary)] font-semibold rounded-xl text-xs transition-all shadow-xs active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Send Message
                    </button>
                </div>
            </div>
        </Modal>
    );
}
