import React, { useState } from 'react';
import Modal from '../../components/Modal';
import { Supplier, SupplierType } from '../../types';
import { UserRole } from '../../types';
import { useStore } from '../../contexts/CentralStore'; // If needed for notifications

// Need to check where Modal is imported from in Procurement.tsx
// It is likely a local component or from '../../components/ui/Modal' (if it exists)
// Actually, looking at Procurement.tsx line 3563: <Modal ...>
// I need to check the import in Procurement.tsx.

interface AddSupplierModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (supplier: Omit<Supplier, 'id' | 'status' | 'rating' | 'leadTime' | 'contact'>) => void;
}

export const AddSupplierModal: React.FC<AddSupplierModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [newSupName, setNewSupName] = useState('');
    const [newSupType, setNewSupType] = useState<SupplierType>('Business');
    const [newSupEmail, setNewSupEmail] = useState('');
    const [newSupPhone, setNewSupPhone] = useState('');
    const [newSupCategory, setNewSupCategory] = useState('');
    const [newSupID, setNewSupID] = useState('');
    const [newSupLocation, setNewSupLocation] = useState('');

    const handleSubmit = () => {
        if (!newSupName) {
            // notification handled by parent or here?
            // parent executes the add logic.
            // But validation is here.
            return;
        }

        onAdd({
            name: newSupName,
            type: newSupType,
            email: newSupEmail,
            phone: newSupPhone,
            category: newSupCategory,
            taxId: newSupType === 'Business' ? newSupID : undefined,
            nationalId: (newSupType === 'Farmer' || newSupType === 'Individual') ? newSupID : undefined,
            location: newSupLocation
        });

        // Reset form
        setNewSupName('');
        setNewSupEmail('');
        setNewSupPhone('');
        setNewSupCategory('');
        setNewSupID('');
        setNewSupLocation('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Supplier" size="md">
            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Supplier Name *</label>
                    <input
                        type="text"
                        className="w-full bg-black/30 border border-white/20 rounded p-2 text-sm text-white focus:outline-none focus:border-cyber-primary"
                        placeholder="Enter supplier name"
                        value={newSupName}
                        onChange={e => setNewSupName(e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Type</label>
                    <select
                        className="w-full bg-black/30 border border-white/20 rounded p-2 text-sm text-white focus:outline-none focus:border-cyber-primary"
                        value={newSupType}
                        onChange={e => setNewSupType(e.target.value as SupplierType)}
                        title="Select Supplier Type"
                        aria-label="Select Supplier Type"
                    >
                        <option value="Business" className="bg-cyber-dark">Business</option>
                        <option value="Individual" className="bg-cyber-dark">Individual</option>
                        <option value="Farmer" className="bg-cyber-dark">Farmer</option>
                        <option value="One-Time" className="bg-cyber-dark">One-Time</option>
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Email</label>
                        <input
                            type="email"
                            className="w-full bg-black/30 border border-white/20 rounded p-2 text-sm text-white focus:outline-none focus:border-cyber-primary"
                            placeholder="Email address"
                            value={newSupEmail}
                            onChange={e => setNewSupEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Phone</label>
                        <input
                            type="tel"
                            className="w-full bg-black/30 border border-white/20 rounded p-2 text-sm text-white focus:outline-none focus:border-cyber-primary"
                            placeholder="Phone number"
                            value={newSupPhone}
                            onChange={e => setNewSupPhone(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Category</label>
                    <input
                        type="text"
                        className="w-full bg-black/30 border border-white/20 rounded p-2 text-sm text-white focus:outline-none focus:border-cyber-primary"
                        placeholder="e.g. Electronics, Food, etc."
                        value={newSupCategory}
                        onChange={e => setNewSupCategory(e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Tax ID / National ID</label>
                    <input
                        type="text"
                        className="w-full bg-black/30 border border-white/20 rounded p-2 text-sm text-white focus:outline-none focus:border-cyber-primary"
                        placeholder="Optional"
                        value={newSupID}
                        onChange={e => setNewSupID(e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Location</label>
                    <input
                        type="text"
                        className="w-full bg-black/30 border border-white/20 rounded p-2 text-sm text-white focus:outline-none focus:border-cyber-primary"
                        placeholder="City, Country"
                        value={newSupLocation}
                        onChange={e => setNewSupLocation(e.target.value)}
                    />
                </div>
                <div className="pt-4 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 py-2 rounded-lg bg-cyber-primary hover:bg-cyber-accent text-black font-bold text-sm transition-colors shadow-lg shadow-cyber-primary/20"
                    >
                        Add Supplier
                    </button>
                </div>
            </div>
        </Modal>
    );
};
