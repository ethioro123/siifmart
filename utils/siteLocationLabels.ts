import { decodeLocation, encodeLocation, isLocationBarcode } from './locationEncoder';
export function buildSiteLocationLabels(locations: string[], prefix: string, siteName: string): string[][] {
    if (!/^[0-9]{4}$/.test(prefix)) throw new Error('A valid four-digit site prefix is required.');
    const labels = new Set<string>();
    for (const value of locations) {
        const decoded = isLocationBarcode(value) ? decodeLocation(value) : value;
        const match = decoded?.trim().match(/^([A-Z])[-\s]?(\d{2})[-\s]?(\d{2})$/i);
        if (!match || Number(match[2]) < 1 || Number(match[3]) < 1) continue;
        labels.add(`${match[1].toUpperCase()}-${match[2]}-${match[3]}`);
    }
    if (!labels.size) throw new Error('No saved bay locations are available for this facility.');
    return [...labels].sort().map(label => {
        const [zone, aisle, bay] = label.split('-');
        return [label, encodeLocation(label, prefix)!, zone, aisle, bay, prefix, siteName];
    });
}
export function locationLabelsCSV(rows: string[][]): string {
    return rows.map(row => row.map(value => '"' + value.replace(/"/g, '""') + '"').join(',')).join('\r\n');
}
