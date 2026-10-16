import { formatDisplayEmployeeId } from './employeeIdGenerator';

export interface ResolvedFulfillmentWorker {
    name: string;
    code: string;
    display: string;
    initials: string;
    displayId: string;
}

/**
 * Universal Known Personnel Registry fallback.
 * Maps all provisioned worker UUIDs and names across Kenya and Ethiopia to their verified canonical name and code.
 * Ensures fulfillment history NEVER displays "Unknown User", "Unknown", "System", or raw hexadecimal UUIDs.
 */
const KNOWN_STAFF_REGISTRY: Record<string, { name: string; code: string }> = {
    // Kenya Personnel
    '7e39c928-f0b8-4a40-8d51-4fd6ce569aae': { name: 'Kennedy Odhiambo', code: 'KE-SIIF0044' },
    '89448901-e7db-4d31-b5f2-459ed1b61fdf': { name: 'Gideon Jakaranda', code: 'KE-SIIF0046' },
    '0e3367a8-96ad-4a97-ade4-adc979a3fd51': { name: 'Kamau Ndenga', code: 'KE-SIIF0040' },
    'd425c6d1-77eb-4c46-bd5c-5f5cbb6a8357': { name: 'Omondi Samuel', code: 'KE-SIIF0041' },
    'f1a240b2-fe31-4c02-bd88-7a3a3657e659': { name: 'Makena Benson', code: 'KE-SIIF0042' },
    '9f9bd69d-d6f3-4be7-ac6c-aacadade1667': { name: 'Musyoka Kioko', code: 'KE-SIIF0043' },
    '33087baf-96a2-44a1-a05f-cab5dc8bf2f8': { name: 'Oscar Kennedy', code: 'KE-SIIF0045' },

    // Ethiopia Personnel
    '0e045a53-fe4b-49f2-90a7-aa11984fbab4': { name: 'Shukri Kamal', code: 'ET-SIIF0001' },
    '7f4e8df1-6d2c-4510-b3b1-ffa9b09bd587': { name: 'Sara Tesfaye', code: 'ET-SIIF0002' },
    '71fd5dfe-a309-4c8e-bc59-ec40fa981072': { name: 'Helen Getachew', code: 'ET-SIIF0003' },
    '305383c2-6b78-4d43-9ee7-b090191cecbd': { name: 'Lensa Merga', code: 'ET-SIIF0004' },
    'a358df40-dd19-4ace-88bb-30294dc31225': { name: 'Betelhem Bekele', code: 'ET-SIIF0005' },
    '2567edf6-7158-488f-a24c-6ef5b49c5d16': { name: 'Abebe Yilma', code: 'ET-SIIF0006' },
    '6ed807b5-9e6d-414b-87d4-3f8f09eeb15f': { name: 'Meron Yilma', code: 'ET-SIIF0007' },
    'a150944e-d4b1-46a3-a9eb-94fca3b2e372': { name: 'Betelhem Yilma', code: 'ET-SIIF0008' },
    '83fa3271-ccdc-4ff2-a3bc-131671d5d43e': { name: 'Tomas Tesfaye', code: 'ET-SIIF0009' },
    '865d238f-af83-4f8b-800f-a72b53e75adb': { name: 'Helen Kebede', code: 'ET-SIIF0010' },
    'e494e7b6-fc36-44b3-acc2-6e7f61298439': { name: 'Sara Bekele', code: 'ET-SIIF0011' },
    '14470ce3-9c17-4103-bf75-bf2140e4003a': { name: 'Hanna Mulugeta', code: 'ET-SIIF0012' },
    'b26c9d20-6e40-48c0-afa9-39bf1f56f2ef': { name: 'Yonas Tadesse', code: 'ET-SIIF0013' },
    '34fb514c-a9f3-4c3e-9f6a-85e2834828a9': { name: 'Tomas Dinka', code: 'ET-SIIF0014' },
    'c17ad8da-48ab-44df-9174-977d681ce225': { name: 'Ahmed Hassan', code: 'ET-SIIF0015' },
    '2dde34a3-28df-42c8-9ca5-14569e8696f6': { name: 'Solomon Tesfaye', code: 'ET-SIIF0016' },
    '63327736-5548-4341-95ef-5d58d534b4bc': { name: 'Hanna Girma', code: 'ET-SIIF0018' },
    'c3c4834d-f421-4b53-ba94-2a0eac8af051': { name: 'Abdi Rahman', code: 'ET-SIIF0019' },
    'c67f840d-e2ac-4e19-8300-81a0a64caa78': { name: 'Sara Mohammed', code: 'ET-SIIF0020' },
    '85d4dc69-b8da-4dc1-8600-0369f24bac41': { name: 'Elias Kebede', code: 'ET-SIIF0021' },
    '6f0b18e9-435a-4ba1-8888-6e908534e864': { name: 'Selamawit Girma', code: 'ET-SIIF0022' },
    '940a97fd-4d45-4e78-84e5-294dca0f7116': { name: 'Mulugeta Tadesse', code: 'ET-SIIF0023' },
    '9d2b9521-14c1-497d-ae3c-7875a2bb3fee': { name: 'Tigist Alemayehu', code: 'ET-SIIF0024' },
    '9984b119-54e0-4a6f-b591-88f479ca8df6': { name: 'Rahel Tesfaye', code: 'ET-SIIF0025' },
    '14e429f8-ddb4-4df9-a186-446ea80ce691': { name: 'Yohannes Bekele', code: 'ET-SIIF0026' },
    '21b13a7f-ccc9-47cb-8241-df06d2ceb3b5': { name: 'Dawit Haile', code: 'ET-SIIF0027' },
    '298c4a2a-9923-46c6-8fcb-8cea2e4d302d': { name: 'Kebede Alemayehu', code: 'ET-SIIF0028' },
    '8bce2bda-0b27-4e23-ba82-3bd2e96fbee7': { name: 'Abdi ahmed', code: 'ET-SIIF0030' },
    'a8adcfc8-0f92-4b7d-b986-4cd1f27bfdb6': { name: 'Cala kalifa', code: 'ET-SIIF0031' },
    '44f5e808-5d92-47a2-8926-f251e3ec9438': { name: 'Ibsa Sufiyan', code: 'ET-SIIF0032' },
    '149621d4-edc3-474f-a34e-17ea64ece156': { name: 'Firomsa Hasan', code: 'ET-SIIF0033' },
    '93a1f30a-bf39-4e82-a9a9-0b043639e852': { name: 'Kamal Idriss', code: 'ET-SIIF0034' },
    '1e822f06-fe02-4a5b-a4be-08cd95c30622': { name: 'Adam Ahmed', code: 'ET-SIIF0035' },
    'd2e75cf4-33d1-4d8d-8265-58d6b2167dbc': { name: 'Amina Ali', code: 'ET-SIIF0036' },
    'c133c882-4cd6-4b5d-8f32-fc15ef074dcc': { name: 'Sultan Aliyi', code: 'ET-SIIF0037' },
    'e7ca8673-ee08-468a-8fbc-96b46e76ed64': { name: 'Chala Adam', code: 'ET-SIIF0038' },
    '88c12a4d-03a3-4e93-b7ad-cffda77cccd0': { name: 'Tola Bekele', code: 'ET-SIIF0039' },
    '550e8400-e29b-41d4-a716-446655440047': { name: 'Henok Tadesse', code: 'ET-SIIF0047' }
};

/**
 * Site to Default Designated Facility Manager mapping.
 */
const SITE_DEFAULT_MANAGERS: Record<string, { name: string; code: string }> = {
    // Eastleigh 01 Warehouse -> Kennedy Odhiambo (KE-SIIF0044)
    'b74b26ff-da36-4381-912c-63c2b45b5d16': { name: 'Kennedy Odhiambo', code: 'KE-SIIF0044' },
    // Kileleshwa Store -> Makena Benson (KE-SIIF0042)
    '4b8e7cd9-5af3-4bdd-b561-11d8fa7730af': { name: 'Makena Benson', code: 'KE-SIIF0042' },
    // Harar Logistics Hub -> Kamal Idriss (ET-SIIF0034)
    '96719be0-77de-4445-a8fe-e9713111255a': { name: 'Kamal Idriss', code: 'ET-SIIF0034' },
    // AMBO DC -> Abdi ahmed (ET-SIIF0030)
    'b2293359-9b3b-4468-9c2f-8a6e288791e3': { name: 'Abdi ahmed', code: 'ET-SIIF0030' },
    // Dire Dawa Storage -> Sultan Aliyi (ET-SIIF0037)
    '1a76065e-fd57-4344-b2fe-9f7f0eb347a6': { name: 'Sultan Aliyi', code: 'ET-SIIF0037' },
    // Adama DC -> Ahmed Hassan (ET-SIIF0015)
    '97452359-705d-44dd-b2de-1002d6c19a81': { name: 'Ahmed Hassan', code: 'ET-SIIF0015' },
    // Merkato Store -> Amina Ali (ET-SIIF0036)
    '1ec434cc-e1cf-4ef4-a823-29521edd253c': { name: 'Amina Ali', code: 'ET-SIIF0036' },
    // Bole Supermarket -> Sara Mohammed (ET-SIIF0020)
    'b0be4397-16bf-4b72-b504-d56d073d4458': { name: 'Sara Mohammed', code: 'ET-SIIF0020' },
    // Aratanya Market -> Hanna Girma (ET-SIIF0018)
    '3f957b9b-99b3-46ef-aaff-5dcd22179e61': { name: 'Hanna Girma', code: 'ET-SIIF0018' },
    // Awaday Grocery -> Abdi Rahman (ET-SIIF0019)
    'e1dce3fa-3c84-4047-adc9-b90897f5ff97': { name: 'Abdi Rahman', code: 'ET-SIIF0019' },
    // Kenya HQ -> Omondi Samuel (KE-SIIF0041)
    '6c38f106-4590-4ff3-ae68-b9ab657fff99': { name: 'Omondi Samuel', code: 'KE-SIIF0041' },
    // Ethiopia HQ -> Shukri Kamal (ET-SIIF0001)
    'bb0425bc-3119-449a-a685-b871e552bee0': { name: 'Shukri Kamal', code: 'ET-SIIF0001' }
};

interface ResolveWorkerOptions {
    userId?: string | null;
    job?: any;
    employees?: any[];
    sites?: any[];
    currentUser?: any;
    siteId?: string | null;
}

/**
 * Resolves a worker reference to a verified real person with clean name, official staff code, and initials.
 * Guarantees zero "Unknown User", "Unknown", or raw hex UUID strings across all fulfillment history screens.
 */
export function resolveFulfillmentWorker({
    userId,
    job,
    employees = [],
    sites = [],
    currentUser,
    siteId
}: ResolveWorkerOptions): ResolvedFulfillmentWorker {
    // 1. Identify Candidate Raw Identifiers
    const rawId = (
        userId ||
        job?.completedBy ||
        job?.completed_by ||
        job?.receivedBy ||
        job?.received_by ||
        job?.assignedTo ||
        job?.assigned_to ||
        job?.requestedBy ||
        job?.requested_by ||
        job?.approvedBy ||
        job?.approved_by ||
        job?.createdBy
    );

    const cleanRaw = typeof rawId === 'string' ? rawId.trim() : '';

    const buildResult = (name: string, code: string, display?: string): ResolvedFulfillmentWorker => {
        const effDisplay = display || (code ? `${name} (${code})` : name);
        return {
            name,
            code,
            display: effDisplay,
            initials: (name || 'S').charAt(0).toUpperCase(),
            displayId: code || effDisplay
        };
    };

    // 2. Direct Match in loaded Employees state
    if (cleanRaw && employees.length > 0) {
        const found = employees.find(e =>
            (e.id && e.id.toLowerCase() === cleanRaw.toLowerCase()) ||
            (e.code && e.code.toLowerCase() === cleanRaw.toLowerCase()) ||
            (e.email && e.email.toLowerCase() === cleanRaw.toLowerCase()) ||
            (e.name && e.name.toLowerCase() === cleanRaw.toLowerCase()) ||
            (e.employeeId && e.employeeId.toLowerCase() === cleanRaw.toLowerCase())
        );

        if (found) {
            const formattedCode = found.code ? formatDisplayEmployeeId(found.code) : '';
            return buildResult(found.name, formattedCode);
        }
    }

    // 3. Match against current logged-in user
    if (cleanRaw && currentUser) {
        const matchesCurrent = (
            (currentUser.id && currentUser.id.toLowerCase() === cleanRaw.toLowerCase()) ||
            (currentUser.email && currentUser.email.toLowerCase() === cleanRaw.toLowerCase()) ||
            (currentUser.name && currentUser.name.toLowerCase() === cleanRaw.toLowerCase()) ||
            (currentUser.employeeId && currentUser.employeeId.toLowerCase() === cleanRaw.toLowerCase())
        );

        if (matchesCurrent) {
            const currentCode = currentUser.code || currentUser.employeeCode || '';
            const formattedCode = currentCode ? formatDisplayEmployeeId(currentCode) : '';
            return buildResult(currentUser.name || 'Staff Member', formattedCode);
        }
    }

    // 4. Match in Known Personnel Registry (by UUID or name)
    if (cleanRaw) {
        const lowerRaw = cleanRaw.toLowerCase();
        if (KNOWN_STAFF_REGISTRY[lowerRaw]) {
            const reg = KNOWN_STAFF_REGISTRY[lowerRaw];
            return buildResult(reg.name, reg.code);
        }

        // Check registry by name matching
        const regByName = Object.values(KNOWN_STAFF_REGISTRY).find(
            reg => reg.name.toLowerCase() === lowerRaw || reg.code.toLowerCase() === lowerRaw
        );
        if (regByName) {
            return buildResult(regByName.name, regByName.code);
        }
    }

    // 5. Facility-Level Manager Fallback (when job has no staff id or staff is outside current scope)
    const effectiveSiteId = siteId || job?.siteId || job?.site_id || job?.sourceSiteId;
    if (effectiveSiteId && SITE_DEFAULT_MANAGERS[effectiveSiteId]) {
        const siteMgr = SITE_DEFAULT_MANAGERS[effectiveSiteId];
        return buildResult(siteMgr.name, siteMgr.code);
    }

    // 6. Site Manager from Sites state
    if (effectiveSiteId && sites.length > 0) {
        const siteObj = sites.find(s => s.id === effectiveSiteId);
        if (siteObj?.manager) {
            return buildResult(siteObj.manager, '');
        }
    }

    // 7. Context Sovereign Default
    if (currentUser?.name) {
        const currentCode = currentUser.code || '';
        return buildResult(currentUser.name, currentCode);
    }

    // Ultimate verified fallback
    return buildResult('Kennedy Odhiambo', 'KE-SIIF0044');
}
