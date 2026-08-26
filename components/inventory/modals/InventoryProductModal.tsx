import React from 'react';
import Modal from '../../Modal';
import { ProductForm } from '../../ProductForm';
import { Product, Site } from '../../../types';

interface InventoryProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingProduct: Product | null;
    activeSite: Site | null | undefined;
    user: any;
    canApprove: boolean;
    isReadOnly: boolean;
    isSubmitting: boolean;
    onSave: (data: any) => Promise<void>;
}

export const InventoryProductModal: React.FC<InventoryProductModalProps> = ({
    isOpen,
    onClose,
    editingProduct,
    isReadOnly,
    isSubmitting,
    onSave
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingProduct ? "Edit Product" : "Add New Product"}
            size="2xl"
        >
            <div className="max-h-[85vh] overflow-y-auto custom-scrollbar p-1">
                <ProductForm
                    initialData={editingProduct || undefined}
                    onSubmit={onSave}
                    onCancel={onClose}
                    isSubmitting={isSubmitting}
                    isReadOnly={isReadOnly}
                />
            </div>
        </Modal>
    );
};
export default InventoryProductModal;
