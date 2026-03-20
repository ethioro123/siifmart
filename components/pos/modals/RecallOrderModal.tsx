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
                        <div key={order.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center group hover:border-cyber-primary/50 transition-colors cursor-pointer" onClick={() => handleRecallOrder(order.id)}>
                            <div>
                                <p className="text-white font-bold">{order.note}</p>
                                <p className="text-xs text-gray-500">{order.time} • {order.items.length} items</p>
                            </div>
                            <ArrowRight size={16} className="text-gray-500 group-hover:text-cyber-primary" />
                        </div>
                    ))}
                    {heldOrders.length === 0 && (
                        <p className="text-center text-gray-500 py-8">No held orders found.</p>
                    )}
                </div>
            </Modal>

            {/* Overwrite Cart Confirmation Modal */}
            <Modal isOpen={isOverwriteCartModalOpen} onClose={() => setIsOverwriteCartModalOpen(false)} title="Overwrite Cart?" size="sm">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                        <div className="p-3 bg-yellow-500/20 rounded-full">
                            <AlertTriangle className="w-8 h-8 text-yellow-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Cart Not Empty</h3>
                            <p className="text-yellow-200 text-sm">Current cart items will be replaced by the held order.</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setIsOverwriteCartModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                        <button onClick={handleConfirmOverwriteCart} className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg">Overwrite</button>
                    </div>
                </div>
            </Modal>
        </>
    );
};
