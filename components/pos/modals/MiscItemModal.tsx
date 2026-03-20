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
                    <label htmlFor="misc-desc" className="text-xs text-gray-500 uppercase font-bold mb-1 block">Description</label>
                    <input
                        id="misc-desc"
                        value={miscItem.name}
                        onChange={e => setMiscItem({ ...miscItem, name: e.target.value })}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Price</label>
                    <input
                        type="number"
                        value={miscItem.price}
                        onChange={e => setMiscItem({ ...miscItem, price: e.target.value })}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
                        placeholder="0.00"
                        autoFocus
                    />
                </div>
                <button
                    onClick={addMiscItem}
                    disabled={!miscItem.price}
                    className="w-full py-3 bg-cyber-primary text-black font-bold rounded-xl disabled:opacity-50"
                >
                    Add to Cart
                </button>
            </div>
        </Modal>
    );
};
