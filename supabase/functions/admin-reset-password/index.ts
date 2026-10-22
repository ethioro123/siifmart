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
    // 1. Verify the caller is authenticated and is a group_ceo
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

    // Match the canonical hierarchy in utils/roles.ts.
    const getRoleHierarchy = (role: string): number => {
      const hierarchy: Record<string, number> = {
        'group_ceo': 100,
        'group_coo': 99,
        'group_cfo': 99,
        'group_cco': 99,
        'group_cmo': 99,
        'group_csco': 99,
        'group_chro': 99,
        'group_cto': 99,
        'group_cio': 99,
        'group_clco': 99,
        'group_cae': 99,
        'country_managing_director': 98,
        'country_operations_director': 97,
        'country_finance_director': 97,
        'country_commercial_director': 97,
        'country_supply_chain_director': 97,
        'country_hr_director': 97,
        'country_technology_director': 97,
        'country_compliance_manager': 97,
        'regional_operations_manager': 90,
        'area_operations_manager': 88,
        'regional_supply_chain_manager': 83,
        'regional_procurement_manager': 81,
        'regional_finance_manager': 81,
        'regional_merchandising_manager': 81,
        'regional_hr_manager': 81,
        'regional_logistics_manager': 81,
        'regional_security_manager': 81,
        'regional_it_manager': 81,
        'regional_compliance_manager': 81,
        'store_manager': 80,
        'warehouse_manager': 80,
        'warehouse_operations_manager': 78,
        'transport_fleet_manager': 78,
        'inventory_manager': 80,
        'cs_manager': 60,
        'assistant_store_manager': 60,
        'vendor_relations_manager': 60,
        'fleet_maintenance_supervisor': 58,
        'inventory_control_supervisor': 57,
        'shift_supervisor': 56,
        'stock_control_supervisor': 56,
        'receiving_supervisor': 56,
        'pos_supervisor': 56,
        'putaway_replenishment_supervisor': 56,
        'picking_supervisor': 56,
        'packing_supervisor': 56,
        'dispatch_supervisor': 56,
        'returns_waste_supervisor': 56,
        'inbound_operations_supervisor': 56,
        'outbound_operations_supervisor': 56,
        'receiving_team_leader': 50,
        'picking_team_leader': 50,
        'packing_team_leader': 50,
        'dispatch_team_leader': 50,
        'store_operations_auditor': 45,
        'auditor': 40,
        'payroll_specialist': 40,
        'treasury_officer': 38,
        'tax_compliance_officer': 38,
        'credit_control_officer': 36,
        'cash_office_officer': 36,
        'accountant': 35,
        'data_analyst': 35,
        'training_coordinator': 35,
        'talent_recruiter': 35,
        'hr_generalist': 35,
        'merchandising_specialist': 35,
        'customs_import_specialist': 35,
        'it_support': 35,
        'dispatcher': 35,
        'buyer': 30,
        'demand_planner': 30,
        'replenishment_planner': 30,
        'inbound_qc_inspector': 30,
        'loss_prevention': 30,
        'cashier': 30,
        'store_associate': 28,
        'sales_associate': 28,
        'inventory_controller': 26,
        'stock_counter': 25,
        'merchandiser': 25,
        'inventory_specialist': 25,
        'customer_service': 25,
        'stock_clerk': 25,
        'receiving_operator': 24,
        'putaway_operator': 24,
        'replenishment_operator': 24,
        'dispatch_operator': 24,
        'returns_operator': 24,
        'fleet_mechanic': 24,
        'picker': 22,
        'packer': 22,
        'receiver': 22,
        'returns_clerk': 22,
        'driver': 20,
        'forklift_operator': 20,
        'warehouse_administrator': 24,
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

    // Verify Hierarchy: Caller must be group_ceo OR have a STRICTLY HIGHER role level than the target
    const callerLevel = getRoleHierarchy(callerEmployee.role)
    const targetLevel = getRoleHierarchy(targetEmployee.role)

    if (callerEmployee.role !== 'group_ceo' && callerLevel <= targetLevel) {
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
