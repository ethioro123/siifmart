import { getRoleHierarchy, MANAGERIAL_ROLES } from '../_shared/roleAuthority.ts';
export interface AccessEmployee {
    id: string; role: string; status: string; site_id: string; email: string;
    name: string; badges?: unknown; credentials_handed_over_at?: string | null;
}
export function canManageEmployeeAccess(actor: AccessEmployee, target: AccessEmployee): boolean {
    const actorRank = getRoleHierarchy(actor.role), targetRank = getRoleHierarchy(target.role);
    return actor.status === 'Active' && target.status === 'Active' && actor.id !== target.id &&
        (MANAGERIAL_ROLES.includes(actor.role) || actor.role === 'hr_generalist') && targetRank > 0 &&
        (actor.role === 'group_ceo' || actorRank > targetRank) &&
        !(Array.isArray(target.badges) && target.badges.includes('No App Account'));
}
export function newEmployeePassword(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    return `Aa1!${Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')}`;
}
export function hasEmployeeAccessScope(actorRole: string, country: string, actorCountry: string | undefined, targetCountry: string | undefined, siteAuthorized: boolean): boolean {
    return /^[A-Z]{2}$/.test(country) && targetCountry === country && siteAuthorized === true &&
        (actorRole === 'group_ceo' || actorCountry === country);
}
