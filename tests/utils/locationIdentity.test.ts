import {describe,expect,it} from 'vitest';
import {formatLocationIdentity} from '../../utils/locationIdentity';
import {encodeLocation} from '../../utils/locationEncoder';
describe('operational location identity',()=>{
 it('shows zone aisle and bay for both human locations and printed label values',()=>{
  const expected='Zone A · Aisle 01 · Bay 02';
  expect(formatLocationIdentity('A-01-02')).toBe(expected);
  expect(formatLocationIdentity(encodeLocation('A-01-02','1001'))).toBe(expected);
 });
 it('preserves named areas and never displays invalid numeric labels',()=>{
  expect(formatLocationIdentity('Dispatch Bay')).toBe('Dispatch Bay');
  expect(formatLocationIdentity('123456789012345')).toBe('No bay assigned');
  expect(formatLocationIdentity(null)).toBe('No bay assigned');
 });
});
