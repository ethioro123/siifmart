import React from 'react';
import type { Product } from '../../../types';
import { ProductWorkspace } from '../../products/ProductWorkspace';
interface Props { product: Product | null; isOpen: boolean; onClose: () => void; onSaveSuccess?: () => void }
/** Existing entry points open the shared specifications editor. */
export const SmartUnitConfigModal: React.FC<Props> = ({ product, isOpen, onClose, onSaveSuccess }) =>
    <ProductWorkspace product={product} isOpen={isOpen} onClose={onClose} onSaved={onSaveSuccess} initialTab="unit" />;
