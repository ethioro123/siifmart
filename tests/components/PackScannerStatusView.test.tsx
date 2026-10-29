// @vitest-environment jsdom
import React from 'react';
import {cleanup,render,screen} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {PackScannerStatusView} from '../../components/fulfillment/pack/PackScannerStatusView';
vi.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key === 'warehouse.packing.allItemsPacked' ? 'All items packed' : key
  })
}));
afterEach(cleanup);
describe('packing scanner completion status',()=>{
 it('renders all-packed status without resolving an absent next item',()=>{
  const getProduct=vi.fn(()=>{throw new Error('No next item exists');});
  render(<PackScannerStatusView step="SCAN" showSuccess={false} showError={false} successMsg="" errorMsg="" isFullyPacked matchedItem={null} matchedProduct={undefined} nextUnpackedItem={undefined} job={{lineItems:[{expectedQty:23,packedQty:23,packed:true}]}} getProduct={getProduct}/>);
  expect(screen.getByText('All items packed')).toBeTruthy();
  expect(getProduct).not.toHaveBeenCalled();
 });
});
