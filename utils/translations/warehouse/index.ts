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
    ...misc,
    misc,
    ...modals,
    modals,
    ...auxiliary,
    auxiliary,
    ...messages,
    messages,
    ...core,
    core,
    ...count,
    count,
};
