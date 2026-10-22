export const STAGING_PROJECT_REF = 'utykzifrblpyxlvlknsm';

export function isStagingTestEmail(email: unknown): email is string {
    return typeof email === 'string' && email.length <= 200 &&
        /^[a-z0-9._+-]+@(staging\.siifmart\.com|role-coverage\.staging\.siifmart\.invalid)$/i.test(email);
}

export function isStagingExecutive(role: unknown): boolean {
    return typeof role === 'string' && ['group_ceo'].includes(role.toLowerCase());
}
