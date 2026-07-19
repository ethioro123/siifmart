import React from 'react';
import { usePOS } from '../POSContext';
import Modal from '../../Modal';

export const MiscItemModal: React.FC = () => {
    const {
        isMiscItemModalOpen,
        setIsMiscItemModalOpen,
        miscItem,
        setMiscItem,
        addMiscItem,
    } = usePOS();

    return (
        <Modal isOpen={isMiscItemModalOpen} onClose={() => setIsMiscItemModalOpen(false)} title="Add Miscellaneous Item" size="sm">
            <div className="space-y-4">
                <div>
                    <label htmlFor="misc-desc" className="text-xs text-[#1E3F27] dark:text-gray-300 uppercase font-black tracking-wider mb-1 block">Description</label>
                    <input
                        id="misc-desc"
                        value={miscItem.name}
                        onChange={e => setMiscItem({ ...miscItem, name: e.target.value })}
                        className="w-full bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-lg px-3 py-2 text-[#1E3F27] dark:text-white focus:outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] transition-colors"
                    />
                </div>
                <div>
                    <label className="text-xs text-[#1E3F27] dark:text-gray-300 uppercase font-black tracking-wider mb-1 block">Price</label>
                    <input
                        type="number"
                        value={miscItem.price}
                        onChange={e => setMiscItem({ ...miscItem, price: e.target.value })}
                        className="w-full bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-lg px-3 py-2 text-[#1E3F27] dark:text-white font-mono focus:outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] transition-colors"
                        placeholder="0.00"
                        autoFocus
                    />
                </div>
                <button
                    onClick={addMiscItem}
                    disabled={!miscItem.price}
                    className="w-full py-3 bg-gradient-to-br from-[#224429] to-[#2C5E3B] hover:opacity-90 text-white font-bold rounded-xl shadow-md disabled:bg-stone-200 dark:disabled:bg-white/5 disabled:text-stone-400 dark:disabled:text-stone-600 border border-transparent disabled:border-stone-300 dark:disabled:border-white/10 disabled:cursor-not-allowed disabled:shadow-none transition-all"
                >
                    Add to Cart
                </button>
            </div>
        </Modal>
    );
};
