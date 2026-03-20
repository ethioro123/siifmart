import React from 'react';
import Modal from '../../ui/Modal';
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
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Sending secure message to <span className="text-gray-900 dark:text-white font-bold">{employee.name}</span>:
                </p>
                <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-4 text-gray-900 dark:text-white mb-6 focus:border-cyber-primary transition-all min-h-[150px] outline-none placeholder:text-gray-400"
                    placeholder="Type your communication here..."
                />
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="px-6 py-3 text-gray-500 dark:text-gray-400 font-bold hover:text-gray-900 dark:hover:text-white transition-colors uppercase text-xs tracking-widest">Cancel</button>
                    <button onClick={handleConfirmSendMessage} className="px-8 py-3 bg-cyber-primary hover:bg-cyber-accent text-black font-black rounded-xl uppercase text-xs tracking-[0.2em] shadow-lg">Send Message</button>
                </div>
            </div>
        </Modal>
    );
}
