/**
 * Admin-only employee creation service
 * Uses service role to create auth users without logging out the current admin
 * 
 * SECURITY: This should ONLY be called by super_admin users
 */

import { createClient } from '@supabase/supabase-js';

// Get service role key from environment (admin only)
const getAdminClient = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
        throw new Error('Service role key not configured. This feature is for development/admin use only.');
    }

    if (import.meta.env.PROD) {
        console.error('CRITICAL SECURITY WARNING: Service Role Key detected in production build. This is unsafe.');
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};

export interface CreateEmployeeParams {
    email: string;
    password: string;
    name: string;
    role: string;
    siteId: string;
    phone?: string;
    department?: string;
    salary?: number;
}

/**
 * Create an employee with login account (admin only)
 * This uses the service role to create users without affecting the current session
 */
export async function createEmployeeWithAuth(params: CreateEmployeeParams) {
    try {
        console.log('Creating employee with auth:', params.email);

        const adminClient = getAdminClient();

        // 1. Check if user already exists
        let authUserId: string;
        let isNewUser = false;

        const { data: existingUsers } = await adminClient.auth.admin.listUsers();
        const existingUser = (existingUsers?.users as any[])?.find(u => u.email === params.email);

        if (existingUser) {
            // User already exists - update metadata and password
            console.log('User already exists, updating:', existingUser.id);
            authUserId = existingUser.id;

            // Update user metadata and password
            const { error: updateError } = await adminClient.auth.admin.updateUserById(existingUser.id, {
                password: params.password,
                user_metadata: {
                    ...existingUser.user_metadata,
                    name: params.name,
                    role: params.role,
                    site_id: params.siteId
                }
            });

            if (updateError) {
                console.error('Auth update error:', updateError);
                throw new Error(`Failed to update auth account: ${updateError.message}`);
            }
        } else {
            // Create new auth user
            const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
                email: params.email,
                password: params.password,
                email_confirm: true, // Auto-confirm email
                user_metadata: {
                    name: params.name,
                    role: params.role,
                    site_id: params.siteId
                }
            });

            if (authError) {
                console.error('Auth creation error:', authError);
                throw new Error(`Failed to create auth account: ${authError.message}`);
            }

            if (!authData.user) {
                throw new Error('No user data returned from auth creation');
            }

            authUserId = authData.user.id;
            isNewUser = true;
            console.log('Auth user created:', authUserId);
        }

        // 2. Check if employee record already exists
        const { data: existingEmployee } = await adminClient
            .from('employees')
            .select('id')
            .eq('id', authUserId)
            .single();

        if (existingEmployee) {
            // Employee record exists - update it
            console.log('Employee record exists, updating:', authUserId);
            const { error: updateError } = await adminClient
                .from('employees')
                .update({
                    name: params.name,
                    email: params.email,
                    role: params.role,
                    site_id: params.siteId,
                    phone: params.phone || '',
                    department: params.department || 'General',
                    salary: params.salary || 0,
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(params.name)}&background=random`
                })
                .eq('id', authUserId);

            if (updateError) {
                console.error('Employee update error:', updateError);
                throw new Error(`Failed to update employee record: ${updateError.message}`);
            }
        } else {
            // Get count of existing employees to generate sequential code
            const { count } = await adminClient
                .from('employees')
                .select('*', { count: 'exact', head: true });

            const nextNumber = (count || 0) + 1;
            const employeeCode = `SIIF-${String(nextNumber).padStart(4, '0')}`;
            console.log('📝 Generated employee code:', employeeCode);

            // Create new employee record
            const { error: empError } = await adminClient.from('employees').insert({
                id: authUserId,
                code: employeeCode,
                name: params.name,
                email: params.email,
                role: params.role,
                site_id: params.siteId,
                status: 'Active',
                join_date: new Date().toISOString().split('T')[0],
                phone: params.phone || '',
                department: params.department || 'General',
                salary: params.salary || 0,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(params.name)}&background=random`,
                performance_score: 100,
                attendance_rate: 100
            });

            if (empError) {
                console.error('Employee creation error:', empError);
                // Only delete auth user if we created it (not if it already existed)
                if (isNewUser) {
                    await adminClient.auth.admin.deleteUser(authUserId);
                }
                throw new Error(`Failed to create employee record: ${empError.message}`);
            }
        }

        console.log('Employee created successfully:', authUserId);

        return {
            id: authUserId,
            email: params.email,
            name: params.name,
            role: params.role
        };
    } catch (error: any) {
        console.error('createEmployeeWithAuth error:', error);
        throw error;
    }
}

/**
 * Reset an employee's password (admin only)
 * This allows admins to set a new password without email verification
 */
export async function resetEmployeePassword(userId: string, newPassword: string) {
    try {
        console.log('Resetting password for user:', userId);

        const adminClient = getAdminClient();

        // 1. Try to update existing user
        const { error } = await adminClient.auth.admin.updateUserById(userId, {
            password: newPassword
        });

        if (error) {
            // 2. CHECK FOR MISSING USER (Self-Healing)
            if (error.message.includes('User not found') || error.status === 404) {
                console.log('⚠️ User not found in Auth. Attempting to create missing Auth user (Self-Healing)...');

                // Fetch employee details to get email
                const { data: employee, error: fetchError } = await adminClient
                    .from('employees')
                    .select('email, name, role, site_id')
                    .eq('id', userId)
                    .single();

                if (fetchError || !employee) {
                    throw new Error(`Could not fetch employee details to recreate user: ${fetchError?.message}`);
                }

                // Create the missing Auth User with the SAME ID
                const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
                    id: userId, // FORCE the same ID to link with employee record
                    email: employee.email,
                    password: newPassword,
                    email_confirm: true,
                    user_metadata: {
                        name: employee.name,
                        role: employee.role,
                        site_id: employee.site_id
                    }
                });

                if (createError) {
                    throw new Error(`Failed to recreate missing user: ${createError.message}`);
                }

                console.log('✅ Specific Auth user recreated successfully!');
                return true;
            }

            console.error('Password reset error:', error);
            throw new Error(`Failed to reset password: ${error.message}`);
        }

        console.log('Password reset successfully');
        return true;
    } catch (error: any) {
        console.error('resetEmployeePassword error:', error);
        throw error;
    }
}
