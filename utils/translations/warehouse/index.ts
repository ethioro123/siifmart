import { TranslationBlock } from '../types';
import { core } from './core';
import { driverHub } from './driverHub';
import { docks } from './docks';
import { receiving } from './receiving';
import { picking } from './picking';
import { packing } from './packing';
import { putaway } from './putaway';
import { replenish } from './replenish';
import { modals } from './modals';
import { auxiliary } from './auxiliary';
import { messages } from './messages';
import { misc } from './misc';
import { count } from './count';
import { waste } from './waste';
import { returns } from './returns';

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
    ...replenish,
    replenish,
    ...waste,
    waste,
    ...returns,
    returns,
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
