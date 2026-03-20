// @ts-nocheck — This file runs on Supabase's Deno runtime, not locally
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verify the caller is authenticated and is a super_admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create a client with the caller's JWT to verify their identity
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    // Get the caller's identity
    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser()
    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check caller's role from the employees table
    const { data: callerEmployee, error: empError } = await callerClient
      .from('employees')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (empError || !callerEmployee) {
      return new Response(JSON.stringify({ error: 'Employee record not found for caller' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Define role hierarchy from OrgChart
    const getRoleHierarchy = (role: string): number => {
      const hierarchy: Record<string, number> = {
        'super_admin': 100,
        'admin': 90,
        'finance_manager': 80,
        'hr': 75,
        'hr_manager': 75,
        'procurement_manager': 70,
        'supply_chain_manager': 70,
        'operations_manager': 70,
        'regional_manager': 70,
        'auditor': 65,
        'it_support': 60,
        'cs_manager': 55,
        'dispatch_manager': 52,
        'warehouse_manager': 50,
        'store_manager': 50,
        'manager': 45,
        'store_supervisor': 40,
        'accountant': 38,
        'data_analyst': 36,
        'training_coordinator': 35,
        'dispatcher': 35,
        'shift_lead': 32,
        'assistant_manager': 32,
        'inventory_specialist': 30,
        'loss_prevention': 28,
        'merchandiser': 25,
        'receiver': 22,
        'forklift_operator': 22,
        'returns_clerk': 22,
        'picker': 20,
        'driver': 20,
        'packer': 20,
        'pos': 15,
        'sales_associate': 15,
        'cashier': 10,
        'stock_clerk': 10,
        'customer_service': 10,
      }
      return hierarchy[role] || 0
    }

    // 2. Parse the request body
    const { userId, newPassword } = await req.json()

    if (!userId || !newPassword) {
      return new Response(JSON.stringify({ error: 'userId and newPassword are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch target user's role
    const { data: targetEmployee, error: targetError } = await callerClient
      .from('employees')
      .select('role')
      .eq('id', userId)
      .single()

    if (targetError || !targetEmployee) {
      return new Response(JSON.stringify({ error: 'Target employee record not found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify Hierarchy: Caller must be super_admin OR have a STRICTLY HIGHER role level than the target
    const callerLevel = getRoleHierarchy(callerEmployee.role)
    const targetLevel = getRoleHierarchy(targetEmployee.role)

    if (callerEmployee.role !== 'super_admin' && callerLevel <= targetLevel) {
      return new Response(JSON.stringify({ error: `Insufficient permissions. Your role level (${callerLevel}) cannot reset password for target role level (${targetLevel}).` }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!userId || !newPassword) {
      return new Response(JSON.stringify({ error: 'userId and newPassword are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (newPassword.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Prevent resetting own password through this endpoint
    if (userId === caller.id) {
      return new Response(JSON.stringify({ error: 'Use the Settings page to change your own password' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Use the service_role key (server-side only) to reset the password
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    const { error: resetError } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (resetError) {
      return new Response(JSON.stringify({ error: `Supabase Admin Error: ${resetError.message}` }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Log the action
    const { error: logError } = await adminClient.from('system_logs').insert({
      type: 'SECURITY',
      action: 'ADMIN_PASSWORD_RESET',
      details: `Admin ${caller.email} reset password for user ${userId}`,
      user_id: caller.id,
      severity: 'WARNING',
      created_at: new Date().toISOString(),
    })
    
    if (logError) {
      console.error('Logging failed:', logError)
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: `Edge Function Crash: ${err.message}` }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
