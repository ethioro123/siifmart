import React from 'react';
import { Trash2 } from 'lucide-react';
import Modal from '../../Modal';
import { Employee } from '../../../types';

interface DeleteEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee | null;
    deleteInput: string;
    setDeleteInput: (val: string) => void;
    handleConfirmDelete: () => void;
}

export default function DeleteEmployeeModal({
    isOpen,
    onClose,
    employee,
    deleteInput,
    setDeleteInput,
    handleConfirmDelete
}: DeleteEmployeeModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Delete Employee Record" size="md">
            <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <Trash2 className="text-red-600 dark:text-red-400" size={24} />
                    <div>
                        <h4 className="font-bold text-red-600 dark:text-red-400">Irreversible Action</h4>
                        <p className="text-xs text-gray-700 dark:text-gray-400 font-medium">This will permanently delete {employee?.name}'s record from the database. This cannot be undone.</p>
                    </div>
                </div>

                <div className="p-4 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-700 dark:text-gray-400 shadow-inner dark:shadow-none">
                    <p className="font-black text-gray-900 dark:text-gray-300 mb-1 uppercase tracking-widest">Requirements for deletion:</p>
                    <ul className="list-disc list-inside space-y-1 font-medium">
                        <li>Employee must be <strong>Terminated</strong> first</li>
                        <li>You must be a <strong>CEO</strong></li>
                        <li>Record cannot be restored after deletion</li>
                    </ul>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-widest block px-1">Type "DELETE" to confirm permanent removal</label>
                    <input
                        type="text"
                        value={deleteInput}
                        onChange={(e) => setDeleteInput(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-red-500 outline-none transition-colors font-bold"
                        placeholder="DELETE"
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-400 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmDelete}
                        disabled={deleteInput !== 'DELETE'}
                        className={`flex-1 py-3 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 ${deleteInput === 'DELETE' ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed border border-gray-200 dark:border-transparent'}`}
                    >
                        Permanently Delete
                    </button>
                </div>
            </div>
        </Modal>
    );
}
