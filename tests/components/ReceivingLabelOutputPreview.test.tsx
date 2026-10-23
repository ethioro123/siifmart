// @vitest-environment jsdom
import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ReceivingLabelOutputPreview } from '../../components/fulfillment/receive/ReceivingLabelOutputPreview';
afterEach(cleanup);
describe('actual receiving print output preview', () => {
 it('renders the generated intake label with count, lot, and draft status in an isolated frame', async () => {
  render(<ReceivingLabelOutputPreview item={{ sku: 'ETBB002', name: 'Diaper', qty: 24, batchNumber: 'LOT-1' }} type="LPN" size="MEDIUM" format="Both" showPrice={false} showCategory showName />);
  await waitFor(() => expect(screen.getByTitle('Receiving label print output')).toBeTruthy());
  const frame = screen.getByTitle('Receiving label print output');
  expect(frame.getAttribute('srcdoc')).toContain('INBOUND LPN');
  expect(frame.getAttribute('srcdoc')).toContain('QTY: 24');
  expect(frame.getAttribute('srcdoc')).toContain('LOT-1');
  expect(frame.getAttribute('srcdoc')).toContain('COUNTED · NOT SAVED');
  expect(frame.getAttribute('sandbox')).toBe('');
 });
});
