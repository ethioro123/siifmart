import type { ShelfPosition } from '../../../types';

export type FixtureType = 'gondola' | 'end_cap' | 'checkout' | 'back_aisle' | 'secure';

export interface FixtureTier {
  position: ShelfPosition;
  label: string;
  isPrime?: boolean;
  capacity: number;
}

export interface FixtureDefinition {
  type: FixtureType;
  label: string;
  description: string;
  tiers: FixtureTier[];
}

export const FIXTURE_DEFINITIONS: Record<FixtureType, FixtureDefinition> = {
  gondola: {
    type: 'gondola',
    label: 'Standard Gondola Shelving',
    description: '3-tier central store gondola unit (Eye Level, Top Shelf, Bottom Shelf)',
    tiers: [
      { position: 'Top Shelf', label: 'Top Shelf', capacity: 10 },
      { position: 'Eye Level', label: 'Eye Level (Prime Tier)', isPrime: true, capacity: 10 },
      { position: 'Bottom Shelf', label: 'Bottom Shelf (Heavy & Bulk)', capacity: 12 }
    ]
  },
  end_cap: {
    type: 'end_cap',
    label: 'Aisle End Cap Display',
    description: 'High-visibility promotional header at aisle entrance',
    tiers: [
      { position: 'End Cap', label: 'End Cap Display', isPrime: true, capacity: 8 }
    ]
  },
  checkout: {
    type: 'checkout',
    label: 'Checkout & POS Counter',
    description: 'Front-end impulse grab-and-go queue fixtures',
    tiers: [
      { position: 'Checkout', label: 'Checkout Front-End', isPrime: true, capacity: 12 }
    ]
  },
  back_aisle: {
    type: 'back_aisle',
    label: 'Perimeter & Back Wall',
    description: 'High-capacity perimeter wall for bulk and overflow staging',
    tiers: [
      { position: 'Back Aisle', label: 'Back Wall Fixture', capacity: 15 }
    ]
  },
  secure: {
    type: 'secure',
    label: 'Secured Lockable Cabinet',
    description: 'Locked glass cabinet for high-shrink or regulated merchandise',
    tiers: [
      { position: 'Secure', label: 'Secured Cabinet', isPrime: true, capacity: 8 }
    ]
  }
};

export interface ProposedPlanogramMove {
  productId: string;
  productName: string;
  productSku: string;
  currentPosition: ShelfPosition | 'Unassigned';
  targetPosition: ShelfPosition;
  unitsSold7d: number;
  reason: string;
  weightKg?: number;
  constraints: {
    weightSafe: boolean;
    capacityOk: boolean;
    categoryCompatible: boolean;
  };
  selected: boolean;
}
