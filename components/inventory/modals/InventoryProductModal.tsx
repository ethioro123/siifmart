import React from 'react';
import Modal from '../../Modal';
import { ProductForm } from '../../ProductForm';
import { Product, Site } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { useStore } from '../../../contexts/CentralStore';

interface InventoryProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingProduct: Product | null;
    activeSite: Site | null | undefined;
    user: any;
    canApprove: boolean;
    isReadOnly: boolean;
    isSubmitting: boolean;
    currencySymbol?: string;
    onSave: (data: any) => Promise<void>;
}

export const InventoryProductModal: React.FC<InventoryProductModalProps> = ({
    isOpen,
    onClose,
    editingProduct,
    isReadOnly,
    isSubmitting,
    currencySymbol,
    onSave
}) => {
    const { deleteProduct, refreshData } = useData();
    const { user, showToast } = useStore();

    const isCEO = user?.role === 'group_ceo';
    const isWarehouseManager = user?.role === 'warehouse_manager';
    const isStoreManager = user?.role === 'store_manager';
    const isSeniorOperations = ['country_managing_director', 'group_ceo', 'regional_operations_manager', 'country_operations_director'].includes(user?.role || '');
    const showDeleteButton = Boolean(editingProduct && (isCEO || isStoreManager || isWarehouseManager || isSeniorOperations));

    const handleDelete = async () => {
        if (!editingProduct) return;
        if (!isCEO && !isStoreManager && !isSeniorOperations && !isWarehouseManager) return;

        if (isCEO) {
            const confirmation = window.prompt(
                `WARNING: You are about to permanently delete "${editingProduct.name}" (${editingProduct.sku}).\n` +
                `This action cannot be undone.\n\nType "DELETE" to confirm:`
            );
            if (confirmation !== 'DELETE') {
                showToast('Deletion cancelled.', 'info');
                return;
            }
        } else {
            if (editingProduct.stock > 0) {
                showToast('Managers can only delete products that are out of stock.', 'error');
                return;
            }
            if (!window.confirm(`Are you sure you want to permanently delete "${editingProduct.name}"?`)) return;
        }

        try {
            await deleteProduct(editingProduct.id);
            showToast('Product successfully deleted', 'success');
            onClose();
            await refreshData(['products', 'movements']);
        } catch (error: any) {
            showToast(error.message || 'Failed to delete product', 'error');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingProduct ? "Edit Product Profile & Inventory Console" : "Create Product"}
            size="xl"
        >
            <div className="max-h-[85vh] overflow-y-auto custom-scrollbar p-1">
                {!editingProduct && (
                    <p className="mb-4 text-sm text-[var(--theme-text-secondary)]">
                        Check Stock List for an existing product before creating one. To receive an existing product,
                        use the receiving workflow; to correct its stock, use a stock adjustment.
                    </p>
                )}
                <ProductForm
                    initialData={editingProduct || undefined}
                    onSubmit={onSave}
                    onCancel={onClose}
                    isSubmitting={isSubmitting}
                    isReadOnly={isReadOnly}
                    currencySymbol={currencySymbol}
                    onDelete={showDeleteButton ? handleDelete : undefined}
                />
            </div>
        </Modal>
    );
};

export default InventoryProductModal;
