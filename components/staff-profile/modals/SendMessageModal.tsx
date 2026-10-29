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
            <div className="p-6">
                <p className="text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)] mb-4">
                    Sending secure message to <span className="text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] font-bold">{employee.name}</span>:
                </p>
                <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="w-full bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-overlay)_50%,transparent)] border border-[var(--theme-border-subtle)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] rounded-xl px-4 py-4 text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] mb-6 focus:border-[var(--theme-border)] border-[var(--theme-status-success-border)] transition-all min-h-[150px] outline-none placeholder:text-[var(--theme-text-muted)]"
                    placeholder="Type your communication here..."
                />
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="px-6 py-3 text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)] font-bold hover:text-[var(--theme-text-primary)] hover:text-[var(--theme-text-primary)] transition-colors uppercase text-xs tracking-widest cursor-pointer">Cancel</button>
                    <button onClick={handleConfirmSendMessage} className="px-8 py-3 bg-gradient-to-r from-[var(--theme-status-success)] to-[var(--theme-status-success)] hover:from-[var(--theme-status-success)] hover:to-[var(--theme-status-success)] text-[var(--theme-text-primary)] font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg cursor-pointer">Send Message</button>
                </div>
            </div>
        </Modal>
    );
}
