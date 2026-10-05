import React from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { useFinance } from './FinanceContext';
import Modal from '../Modal';

export const DeleteExpenseModal: React.FC = () => {
    const {
        isDeleteExpenseModalOpen,
        setIsDeleteExpenseModalOpen,
        deleteInput,
        setDeleteInput,
        handleConfirmDeleteExpense,
        isSubmitting
    } = useFinance();

    return (
        <Modal isOpen={isDeleteExpenseModalOpen} onClose={() => setIsDeleteExpenseModalOpen(false)} title="Confirm Deletion" size="sm">
            <div className="p-6">
                <div className="flex items-center gap-4 mb-6 p-4 bg-rose-50 dark:bg-red-500/10 border border-rose-200 dark:border-red-500/20 rounded-xl">
                    <div className="p-3 bg-rose-100 dark:bg-red-500/20 rounded-full">
                        <Trash2 className="w-8 h-8 text-rose-600 dark:text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[#1E3F27] dark:text-white">Delete Record?</h3>
                        <p className="text-rose-700 dark:text-red-200 text-sm">This action cannot be undone.</p>
                    </div>
                </div>

                <p className="text-stone-700 dark:text-gray-300 mb-6">
                    To confirm deletion, please type <span className="font-mono font-bold text-rose-600 dark:text-red-400 bg-rose-50 dark:bg-red-500/10 px-2 py-1 rounded">DELETE</span> below:
                </p>

                <input
                    type="text"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    className="woody-input mb-6 font-mono"
                    placeholder="Type DELETE to confirm"
                />

                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => setIsDeleteExpenseModalOpen(false)}
                        className="px-4 py-2 text-stone-500 dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmDeleteExpense}
                        disabled={deleteInput !== 'DELETE' || isSubmitting}
                        className={`px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                            deleteInput === 'DELETE'
                                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                                : 'bg-stone-100 dark:bg-white/5 text-stone-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null} {isSubmitting ? 'Deleting...' : 'Delete Expense'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
export default DeleteExpenseModal;
