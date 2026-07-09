import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from '../../Modal';
import Button from '../../shared/Button';

interface DeleteProductConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    deleteInput: string;
    setDeleteInput: (input: string) => void;
    onConfirm: () => void;
    isSubmitting: boolean;
}

export const DeleteProductConfirmModal: React.FC<DeleteProductConfirmModalProps> = ({
    isOpen,
    onClose,
    deleteInput,
    setDeleteInput,
    onConfirm,
    isSubmitting
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Delete Product">
            <div className="space-y-4">
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 text-red-400">
                    <AlertTriangle size={24} />
                    <div>
                        <h4 className="font-bold">Permanent Deletion</h4>
                        <p className="text-sm mt-1">This cannot be undone.</p>
                    </div>
                </div>
                <p className="text-sm text-secondary">
                    Type <span className="text-gray-900 dark:text-white font-mono font-bold">DELETE</span> to confirm:
                </p>
                <input 
                    type="text" 
                    value={deleteInput} 
                    onChange={(e) => setDeleteInput(e.target.value)} 
                    className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white font-mono focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 outline-none transition-all" 
                    placeholder="Type DELETE" 
                />
                <div className="flex justify-end gap-3 mt-4">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button 
                        variant="danger" 
                        disabled={deleteInput !== 'DELETE' || isSubmitting} 
                        loading={isSubmitting} 
                        onClick={onConfirm}
                    >
                        Delete Product
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
