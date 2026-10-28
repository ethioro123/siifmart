// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PlanogramReviewMovesModal } from '../../components/merchandising/planogram/PlanogramReviewMovesModal';
import type { ProposedPlanogramMove } from '../../components/merchandising/planogram/types';
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
afterEach(cleanup);
const move: ProposedPlanogramMove = { productId: 'a', productName: 'Cooking oil', productSku: 'OIL', currentPosition: 'Bottom Shelf', targetPosition: 'Eye Level', unitsSold7d: 12, reason: 'Review recorded sales.', constraints: { weightSafe: false, capacityOk: false, categoryCompatible: false }, selected: false };
describe('planogram move review', () => {
  it('requires explicit selection and an in-store check before submission', () => {
    const confirm = vi.fn().mockResolvedValue(undefined);
    render(<PlanogramReviewMovesModal isOpen onClose={vi.fn()} moves={[move]} onConfirm={confirm} isSubmitting={false} />);
    const button = screen.getByRole('button', { name: 'Submit selected moves' }) as HTMLButtonElement;
    const boxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    expect(boxes.every(box => !box.checked)).toBe(true);
    expect(button.disabled).toBe(true);
    fireEvent.click(boxes[0]); expect(button.disabled).toBe(true);
    fireEvent.click(boxes[1]); expect(button.disabled).toBe(false);
    fireEvent.click(button); expect(confirm).toHaveBeenCalledWith([move]);
  });
  it('clears previous choices when the dialog is reopened', () => {
    const props = { onClose: vi.fn(), moves: [move], onConfirm: vi.fn(), isSubmitting: false };
    const view = render(<PlanogramReviewMovesModal {...props} isOpen />);
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    view.rerender(<PlanogramReviewMovesModal {...props} isOpen={false} />);
    view.rerender(<PlanogramReviewMovesModal {...props} isOpen />);
    expect((screen.getAllByRole('checkbox')[0] as HTMLInputElement).checked).toBe(false);
  });
});
