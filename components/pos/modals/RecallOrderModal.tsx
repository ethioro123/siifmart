import React from 'react';
import { usePOS } from '../POSContext';
import { useData } from '../../../contexts/DataContext';
import Modal from '../../Modal';
import { ArrowRight, AlertTriangle } from 'lucide-react';

export const RecallOrderModal: React.FC = () => {
    const {
        isRecallModalOpen,
        setIsRecallModalOpen,
        handleRecallOrder,
        isOverwriteCartModalOpen,
        setIsOverwriteCartModalOpen,
        handleConfirmOverwriteCart,
    } = usePOS();

    const { heldOrders } = useData();

    return (
        <>
             <Modal isOpen={isRecallModalOpen} onClose={() => setIsRecallModalOpen(false)} title="Recall Held Order">
                <div className="space-y-3">
                    {heldOrders.map(order => (
                        <div key={order.id} className="p-4 bg-white/90 dark:bg-black/25 border border-[#E2DCCE] dark:border-white/5 rounded-xl flex justify-between items-center group hover:border-[#2C5E3B]/50 transition-colors cursor-pointer" onClick={() => handleRecallOrder(order.id)}>
                            <div>
                                <p className="text-[#1E3F27] dark:text-white font-bold">{order.note}</p>
                                <p className="text-xs text-[#4D6E56] dark:text-gray-400 font-medium">{order.time} • {order.items.length} items</p>
                            </div>
                            <ArrowRight size={16} className="text-stone-600 dark:text-stone-400 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2]" />
                        </div>
                    ))}
                    {heldOrders.length === 0 && (
                        <p className="text-center text-[#4D6E56] dark:text-gray-400 font-medium py-8">No held orders found.</p>
                    )}
                </div>
            </Modal>

            {/* Overwrite Cart Confirmation Modal */}
            <Modal isOpen={isOverwriteCartModalOpen} onClose={() => setIsOverwriteCartModalOpen(false)} title="Overwrite Cart?" size="sm">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <div className="p-3 bg-amber-500/20 rounded-full shrink-0">
                            <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[#1E3F27] dark:text-[#EAE5D9]">Cart Not Empty</h3>
                            <p className="text-amber-800 dark:text-amber-200 text-sm font-medium">Current cart items will be replaced by the held order.</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setIsOverwriteCartModalOpen(false)} className="px-4 py-2 text-stone-700 hover:text-[#1E3F27] dark:text-stone-300 dark:hover:text-white font-bold text-sm">Cancel</button>
                        <button onClick={handleConfirmOverwriteCart} className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-sm">Overwrite</button>
                    </div>
                </div>
            </Modal>
        </>
    );
};
