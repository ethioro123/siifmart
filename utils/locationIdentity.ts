import {decodeLocation,isLocationBarcode} from './locationEncoder';
/** Human-readable location identity for operational screens, never label payloads. */
export function formatLocationIdentity(value?:string|null,fallback='No bay assigned'):string{
 if(!value?.trim())return fallback;
 const raw=value.trim();
 const location=isLocationBarcode(raw)?decodeLocation(raw):raw;
 const match=location?.match(/^([A-Z])[-\s]?(\d{2})[-\s]?(\d{2})$/i);
 if(match)return `Zone ${match[1].toUpperCase()} · Aisle ${match[2]} · Bay ${match[3]}`;
 // Do not surface an undecodable numeric label as an operational location.
 return /^\d{14,15}$/.test(raw)?fallback:raw;
}
