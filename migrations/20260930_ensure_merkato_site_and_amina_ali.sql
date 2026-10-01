-- ============================================================================
-- SIIFMART Zero-Trust & National Sovereignty Migration
-- Ensure Merkato Retail Store (ST-007, Addis Ababa, Ethiopia) exists with UUID PK
-- and bind Amina Ali (Store Manager) to her assigned Ethiopian facility UUID
-- ============================================================================

DO $$
DECLARE
    v_site_id uuid;
    v_next_site_num integer;
BEGIN
    -- 1. Check if the site already exists by code 'ST-007' or name containing 'Merkato'
    SELECT id INTO v_site_id
    FROM sites
    WHERE code = 'ST-007'
       OR name ILIKE '%Merkato%'
    LIMIT 1;

    -- 2. If it exists, update it to ensure correct country, code, and currency
    IF v_site_id IS NOT NULL THEN
        UPDATE sites
        SET code = 'ST-007',
            name = 'Merkato Retail Store',
            type = 'Store',
            address = 'Merkato, Addis Ababa',
            status = 'Active',
            terminal_count = COALESCE(terminal_count, 4),
            manager = 'Amina Ali',
            country = 'ET',
            currency = 'ETB',
            updated_at = NOW()
        WHERE id = v_site_id;
    ELSE
        -- Dynamically calculate next unique site_number to satisfy sites_site_number_unique
        SELECT COALESCE(MAX(site_number), 0) + 1 INTO v_next_site_num FROM sites;

        -- Insert new site letting PostgreSQL generate the uuid id
        INSERT INTO sites (
            code,
            name,
            type,
            address,
            status,
            terminal_count,
            manager,
            country,
            currency,
            site_number,
            is_fulfillment_node,
            created_at,
            updated_at
        ) VALUES (
            'ST-007',
            'Merkato Retail Store',
            'Store',
            'Merkato, Addis Ababa',
            'Active',
            4,
            'Amina Ali',
            'ET',
            'ETB',
            v_next_site_num,
            true,
            NOW(),
            NOW()
        )
        RETURNING id INTO v_site_id;
    END IF;

    -- 3. Update Amina Ali's employee record to point to this Ethiopian facility UUID
    UPDATE employees
    SET 
        site_id = v_site_id,
        department = 'Retail Operations',
        role = 'store_manager',
        status = 'Active',
        updated_at = NOW()
    WHERE email ILIKE '%siif-0036@siifmart.com%'
       OR email ILIKE '%amina%siifmart.com%'
       OR name ILIKE '%Amina Ali%'
       OR code = 'SIIF-036';

    -- If no row was updated (employee not present), insert her record
    IF NOT FOUND THEN
        INSERT INTO employees (
            id,
            name,
            role,
            email,
            phone,
            status,
            department,
            site_id,
            code,
            performance_score,
            attendance_rate,
            specialization,
            salary,
            badges,
            join_date,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'Amina Ali',
            'store_manager',
            'siif-0036@siifmart.com',
            '+251 911 000 036',
            'Active',
            'Retail Operations',
            v_site_id,
            'SIIF-036',
            94,
            98,
            'Store Management',
            32000,
            '["Store Leader", "Inventory Accuracy"]'::jsonb,
            CURRENT_DATE,
            NOW(),
            NOW()
        );
    END IF;

    -- 4. Tamper-Proof Audit Trail logging in system_logs
    INSERT INTO system_logs (
        user_name,
        action,
        details,
        module,
        created_at
    ) VALUES (
        'SYSTEM_MIGRATION',
        'SOVEREIGNTY_SITE_LOCK',
        'Assigned Amina Ali to ST-007 Merkato Retail Store (Site UUID: ' || COALESCE(v_site_id::text, 'unknown') || ', Addis Ababa, Ethiopia)',
        'Security',
        NOW()
    );
END $$;
