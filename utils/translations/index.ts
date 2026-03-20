import { common } from './common';
import { pos } from './pos';
import { warehouse } from './warehouse';
import { posCommand } from './posCommand';
import { inventory } from './inventory';

export const TRANSLATIONS = {
    common,
    pos,
    warehouse,
    posCommand,
    inventory,
} as const;

export type TranslationKeys = typeof TRANSLATIONS;
export * from './types';
