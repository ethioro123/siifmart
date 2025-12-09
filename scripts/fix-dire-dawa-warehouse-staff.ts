import { employeesService, sitesService } from '../services/supabase.service';

/**
 * Ensure Dire Dawa Storage Facility (warehouse) has a full staffing set,
 * similar to other warehouses (Manager + Pickers).
 *
 * This script can be run with ts-node or a simple node runner in this repo.
 *
 * It will:
 *  1. Find the Dire Dawa Storage Facility site by name.
 *  2. Ensure three core employees exist and are assigned to that site:
 *     - Warehouse Manager: Solomon Tesfaye
 *     - Picker: Betelhem Yilma
 *     - Picker: Meron Yilma
 *  3. Create missing employees or reassign existing ones to the Dire Dawa warehouse.
 */

async function main() {
    console.log('🔧 Fixing Dire Dawa Storage Facility staffing...');

    // 1. Find the Dire Dawa Storage Facility site
    const sites = await sitesService.getAll();
    const direDawaWarehouse = sites.find(
        (s) =>
            s.name === 'Dire Dawa Storage Facility' ||
            (s.type === 'Warehouse' && s.name.toLowerCase().includes('dire dawa'))
    );

    if (!direDawaWarehouse) {
        console.error('❌ Dire Dawa Storage Facility site not found. Please ensure the site exists first.');
        console.log('Available sites:', sites.map((s) => ({ id: s.id, name: s.name, type: s.type })));
        process.exit(1);
    }

    console.log('✅ Found Dire Dawa warehouse site:', direDawaWarehouse.id, direDawaWarehouse.name);

    const siteId = direDawaWarehouse.id;

    // 2. Desired employees for this warehouse
    const desiredEmployees = [
        {
            id: 'EMP-DD-001',
            name: 'Solomon Tesfaye',
            role: 'warehouse_manager' as const,
            email: 'solomon.tesfaye@siifmart.com',
            phone: '+251 911 000 301',
            department: 'Warehouse Operations',
            avatar: 'https://ui-avatars.com/api/?name=Solomon+Tesfaye&background=111827&color=fff',
            specialization: 'Warehouse Leadership',
            salary: 45000
        },
        {
            id: 'EMP-DD-002',
            name: 'Betelhem Yilma',
            role: 'picker' as const,
            email: 'betelhem.yilma@siifmart.com',
            phone: '+251 911 000 302',
            department: 'Warehouse Operations',
            avatar: 'https://ui-avatars.com/api/?name=Betelhem+Yilma&background=3B82F6&color=fff',
            specialization: 'Order Picking',
            salary: 18000
        },
        {
            id: 'EMP-DD-003',
            name: 'Meron Yilma',
            role: 'picker' as const,
            email: 'meron.yilma@siifmart.com',
            phone: '+251 911 000 303',
            department: 'Warehouse Operations',
            avatar: 'https://ui-avatars.com/api/?name=Meron+Yilma&background=10B981&color=fff',
            specialization: 'Order Picking',
            salary: 18000
        }
    ];

    // 3. Fetch all employees once
    const allEmployees = await employeesService.getAll();

    for (const desired of desiredEmployees) {
        // Try to find by email first (more stable than id)
        let existing = allEmployees.find((e) => e.email === desired.email);

        if (!existing) {
            // Create new employee
            console.log(`➕ Creating employee ${desired.name} at Dire Dawa Storage Facility...`);
            await employeesService.create({
                id: desired.id,
                siteId,
                name: desired.name,
                role: desired.role,
                email: desired.email,
                phone: desired.phone,
                status: 'Active',
                joinDate: new Date().toISOString().split('T')[0],
                department: desired.department,
                avatar: desired.avatar,
                performanceScore: 100,
                specialization: desired.specialization,
                salary: desired.salary,
                badges: [],
                attendanceRate: 100
            } as any);
        } else {
            // Ensure they are assigned to the Dire Dawa warehouse
            if (existing.siteId !== siteId) {
                console.log(
                    `🔄 Reassigning ${existing.name} from site ${existing.siteId} to Dire Dawa Storage Facility (${siteId})...`
                );
                await employeesService.update(existing.id, { siteId });
            } else {
                console.log(`✅ ${existing.name} already assigned to Dire Dawa Storage Facility.`);
            }
        }
    }

    console.log('✅ Dire Dawa Storage Facility staffing fixed.');
}

// Run when executed directly
if (require.main === module) {
    main()
        .then(() => {
            console.log('✅ Script completed.');
            process.exit(0);
        })
        .catch((err) => {
            console.error('❌ Script failed:', err);
            process.exit(1);
        });
}


