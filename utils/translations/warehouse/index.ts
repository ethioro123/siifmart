import { TranslationBlock } from '../types';
import { core } from './core';
import { driverHub } from './driverHub';
import { docks } from './docks';
import { receiving } from './receiving';
import { picking } from './picking';
import { packing } from './packing';
import { putaway } from './putaway';
import { modals } from './modals';
import { auxiliary } from './auxiliary';
import { messages } from './messages';
import { misc } from './misc';
import { count } from './count';

export const warehouse: TranslationBlock = {
    ...core,
    ...driverHub,
    driverHub,
    docks,
    ...receiving,
    receiving,
    ...picking,
    picking,
    ...packing,
    packing,
    ...putaway,
    putaway,
    ...modals,
    ...auxiliary,
    ...messages,
    ...misc,
    ...count,
    count,
    // Ensure nested objects that were overwritten by spread are restored if they had unique keys
    // In this case, 'putaway' was a top-level key in TRANSLATIONS.warehouse AND a sub-object.
    // Let's check putaway.ts - it defines both.
};
