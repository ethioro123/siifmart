import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { isStagingQuickLoginAvailable, mapStagingEmployee } from '../utils/stagingQuickLogin';

const rosterSchema = z.object({ accounts: z.array(z.object({
    id: z.string(), name: z.string(), role: z.string(), job_title: z.string(),
    code: z.string().nullable(), email: z.string().email(),
    site: z.object({ code: z.string(), name: z.string(), type: z.string(),
        country: z.string().nullable(), region_code: z.string().nullable() }).nullable()
})) });
const sessionSchema = z.object({ session: z.object({ access_token: z.string(), refresh_token: z.string() }) });

async function readResponse(response: Response) {
    const body = await response.json();
    if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : 'Staging sign-in is unavailable');
    return body;
}
function requireStaging() {
    if (!isStagingQuickLoginAvailable()) throw new Error('Quick Login is available in local staging only');
}

export const stagingQuickLoginService = {
    async getAccounts() {
        requireStaging();
        const result = rosterSchema.parse(await readResponse(await fetch('/__staging/accounts', { cache: 'no-store' })));
        return result.accounts.map(mapStagingEmployee).filter(account => account !== null);
    },
    async signIn(email: string): Promise<void> {
        requireStaging();
        const result = sessionSchema.parse(await readResponse(await fetch('/__staging/quick-login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
        })));
        const { error } = await supabase.auth.setSession(result.session);
        if (error) throw new Error('The staging session could not be opened');
    }
};
