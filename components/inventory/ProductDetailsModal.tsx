import React from 'react';
import type { Product } from '../../types';
import { ProductWorkspace } from '../products/ProductWorkspace';
interface Props { product: Product | null; isOpen: boolean; onClose: () => void; currencySymbol?: string; onEdit?: (product: Product) => void; readOnly?: boolean }
/** Inventory and POS open the same product workspace as Price Manager. */
export const ProductDetailsModal: React.FC<Props> = ({ product, isOpen, onClose, currencySymbol, readOnly }) =>
    <ProductWorkspace product={product} isOpen={isOpen} onClose={onClose} currencySymbol={currencySymbol} initialTab="overview" readOnly={readOnly} />;
