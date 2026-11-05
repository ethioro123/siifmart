import { getRoleHierarchy } from '../_shared/roleAuthority.ts';
interface EmployeeIdentity { id: string; role: string; status: string; site_id: string | null }
const administrators = ['group_ceo', 'country_managing_director', 'country_hr_director', 'country_technology_director', 'regional_hr_manager', 'regional_it_manager', 'store_manager', 'warehouse_manager'];
export function canResetEmployeePassword(actor: EmployeeIdentity | null, target: EmployeeIdentity | null): boolean {
    return Boolean(actor && target && actor.status === 'Active' && target.status === 'Active' && actor.id !== target.id && administrators.includes(actor.role) && getRoleHierarchy(target.role) > 0 && (actor.role === 'group_ceo' || getRoleHierarchy(actor.role) > getRoleHierarchy(target.role)));
}
