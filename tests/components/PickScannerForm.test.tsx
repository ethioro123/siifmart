// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PickScannerForm } from '../../components/fulfillment/pick/components/PickScannerForm';
afterEach(cleanup);
const renderForm = (unit = 'UNIT', size = '1') => {
    const setQtyVal = vi.fn();
    render(<PickScannerForm step="QUANTITY" inputVal="" setInputVal={vi.fn()} qtyVal="" setQtyVal={setQtyVal}
        selectedUnit={unit} setSelectedUnit={vi.fn()} currentItem={{expectedQty:10,pickedQty:4,unit,size}}
        currentProduct={{unit,size}} isItemMatched isStrictlyValid={false} isProcessing={false}
        handleScan={vi.fn()} getItemMeasureQty={vi.fn()} scanOnlyHandlers={{}} lastKeyTime={{current:0}}
        inputRef={{current:null}} qtyRef={{current:null}} playBeep={vi.fn()} setErrorMsg={vi.fn()} setShowError={vi.fn()} t={key=>key}/>);
    return setQtyVal;
};
describe('picking quantity controls',()=>{
    it('fills only the outstanding count and offers only the declared unit',()=>{
        const setQty=renderForm();
        fireEvent.click(screen.getByRole('button',{name:'Remaining'}));
        expect(setQty).toHaveBeenCalledWith('6');
        expect(screen.getAllByRole('option')).toHaveLength(1);
        expect((screen.getByRole('spinbutton') as HTMLInputElement).step).toBe('any');
    });
    it('expresses the outstanding quantity in the displayed product measure',()=>{
        const setQty=renderForm('KG','20');
        fireEvent.click(screen.getByRole('button',{name:'Remaining'}));
        expect(setQty).toHaveBeenCalledWith('120');
    });
});
