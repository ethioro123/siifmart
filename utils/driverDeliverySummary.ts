import type { WMSJob } from '../types';
import { getShipmentPhase, getShipmentUnits, isShipment } from './shipmentWorkflow';
export function summarizeDriverDeliveries(active: WMSJob[], history: WMSJob[]) {
    const unique = new Map<string,WMSJob>();
    for (const job of [...active,...history]) if (isShipment(job) && job.deliveryMethod !== 'External') unique.set(job.id,job);
    const jobs=[...unique.values()].filter(job=>!['cancelled','not-ready'].includes(getShipmentPhase(job)));
    return {
        completed:jobs.filter(job=>['awaiting-receipt','closed'].includes(getShipmentPhase(job))).length,
        active:jobs.filter(job=>['ready','in-transit'].includes(getShipmentPhase(job))).length,
        items:jobs.reduce((total,job)=>total+getShipmentUnits(job),0)
    };
}
