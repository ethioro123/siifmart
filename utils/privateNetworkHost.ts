/** Literal RFC1918 IPv4 only; public hosts and DNS names are intentionally excluded. */
export function isPrivateNetworkHost(host: string): boolean {
    const parts = host.replace(/^::ffff:/, '').split('.');
    if (parts.length !== 4 || parts.some(p => !/^\d{1,3}$/.test(p) || Number(p) > 255 || String(Number(p)) !== p)) return false;
    const [a, b] = parts.map(Number);
    return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}
