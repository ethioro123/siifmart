import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

export interface CreateAuthAccountParams {
  signupEmail: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  siteId: string;
  employeeCode: string;
  fallbackEmployeeId: string;
}

export interface CreateAuthAccountResult {
  employeeId: string;
  finalEmail: string;
}

/**
 * Creates a Supabase auth account for newly approved/activated employees.
 */
export async function createAuthAccountForNewHire(params: CreateAuthAccountParams): Promise<CreateAuthAccountResult> {
  const { signupEmail, password, firstName, lastName, role, siteId, employeeCode, fallbackEmployeeId } = params;

  let finalEmployeeId = fallbackEmployeeId;
  let finalEmail = signupEmail;

  try {
    const adminClient = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
          storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
          storageKey: 'siifmart-onboarding-temp'
        }
      }
    );

    const buildPayload = (targetEmail: string) => ({
      email: targetEmail,
      password,
      options: {
        data: {
          name: `${firstName} ${lastName}`,
          role,
          siteId
        }
      }
    });

    const { data: firstAttempt, error: firstError } = await adminClient.auth.signUp(buildPayload(finalEmail));
    if (!firstError && firstAttempt?.user) {
      finalEmployeeId = firstAttempt.user.id;
    } else if (firstError) {
      const errStr = (firstError.message || '').toLowerCase();
      if (errStr.includes('already registered') || errStr.includes('already exist') || (firstError as any).status === 422) {
        // Account already exists in auth.users for this official email.
        // Keep clean official corporate email format (never append random timestamp hashes).
        logger.warn('employeeAuthHelper', 'Auth account already registered for email, retaining clean email', { email: finalEmail });
      } else {
        logger.warn('employeeAuthHelper', 'Auth signUp fallback to personnel record UUID', { error: firstError });
      }
    }
  } catch (authErr) {
    logger.warn('employeeAuthHelper', 'Auth signUp network exception, fallback to personnel UUID', { error: authErr });
  }

  return {
    employeeId: finalEmployeeId,
    finalEmail
  };
}
