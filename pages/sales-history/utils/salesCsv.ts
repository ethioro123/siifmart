export function serializeSalesCsv(headers: unknown[], rows: unknown[][]): string {
    const serializeCell = (value: unknown) => {
        let cell = String(value ?? '');
        if (/^[\u0000-\u0020]*[=+@\-]/.test(cell)) cell = `'${cell}`;
        return `"${cell.replace(/"/g, '""')}"`;
    };

    return `\uFEFF${[headers, ...rows].map(row => row.map(serializeCell).join(',')).join('\r\n')}`;
}
