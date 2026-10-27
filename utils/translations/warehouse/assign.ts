import { TranslationBlock } from '../types';

export const assign: any = {
    // Leaf translation for the key "assign" itself (e.g. t('warehouse.assign'))
    en: 'Assign',
    am: 'የተግባር ማዕከል',
    or: 'Wiirtuu Ramaddii Hojii',

    // Header & Auto-assignment
    taskAssignment: {
        en: 'Task Assignment',
        am: 'የስራ ምደባ',
        or: 'Ramaddii Hojii'
    },
    taskAssignmentDesc: {
        en: 'Select a job, then choose an eligible team member.',
        am: 'ስራ ይምረጡ፣ ከዚያ ብቁ የሆነ የቡድን አባል ይምረጡ።',
        or: 'Hojii filadhaa, sana booda miseensa garee heeyyamameef filadhaa.'
    },
    undoAutoAssignment: {
        en: 'Undo auto-assignment',
        am: 'ራስ-ሰር ምደባን ቀልብስ',
        or: 'Ofiin-ramaddii Diigi'
    },
    autoAssignJobs: {
        en: 'Auto-assign jobs',
        am: 'ስራዎችን በራስ-ሰር መድብ',
        or: 'Hojiiwwan Ofiin Ramadi'
    },
    workingEllipsis: {
        en: 'Working…',
        am: 'በመስራት ላይ…',
        or: 'Hojjechaa jira…'
    },
    assignmentActionFailed: {
        en: 'Assignment action did not finish. Review the queue before retrying.',
        am: 'የምደባ ተግባር አልተጠናቀቀም። እንደገና ከመሞከርዎ በፊት ወረፋውን ይገምግሙ።',
        or: 'Gochi ramaddii hin xumuramne. Irra deebitanii yaaluun dura tarreeffama ilaalaa.'
    },
    searchJobSkuOrderPlaceholder: {
        en: 'Search job, SKU or order…',
        am: 'ስራ፣ SKU ወይም ትዕዛዝ ፈልግ…',
        or: 'Hojii, SKU ykn ajaja barbaadi…'
    },
    allJobTypes: {
        en: 'All job types',
        am: 'ሁሉም የስራ አይነቶች',
        or: 'Akaakuu Hojii Hunda'
    },
    allPriorities: {
        en: 'All priorities',
        am: 'ሁሉም ቅድሚያዎች',
        or: 'Sadarkaa Ariifachiisaa Hunda'
    },
    sortByPriorityFirst: {
        en: 'Priority first',
        am: 'ቅድሚያ በመጀመሪያ',
        or: 'Dursa Ariifachiisummaa'
    },
    sortByOldestFirst: {
        en: 'Oldest first',
        am: 'የቆየው በመጀመሪያ',
        or: 'Kan Duraa Duraan'
    },
    sortByItemCount: {
        en: 'Item count',
        am: 'የዕቃ ብዛት',
        or: 'Baay\'ina Meeshaa'
    },
    sortByEstimatedDuration: {
        en: 'Estimated duration',
        am: 'የተገመተው ጊዜ',
        or: 'Turtii Tilmaamame'
    },

    // Job Queue & Filter tabs
    jobQueueTitle: {
        en: 'Job queue',
        am: 'የስራ ወረፋ',
        or: 'Tarree Hojii'
    },
    jobQueueSubtitle: {
        en: 'Select a row to assign or reassign.',
        am: 'ለመመደብ ወይም በድጋሚ ለመመደብ ረድፍ ይምረጡ።',
        or: 'Ramaduuf ykn irra deebitee ramaduuf tarree filadhu.'
    },
    moreFilters: {
        en: 'More filters',
        am: 'ተጨማሪ ማጣሪያዎች',
        or: 'Calaltuu Dabalataa'
    },
    allActiveFilter: {
        en: 'All active',
        am: 'ሁሉም ንቁ',
        or: 'Hunda Hojirra Jiru'
    },
    needsAssignmentFilter: {
        en: 'Needs assignment',
        am: 'ምደባ ያስፈልገዋል',
        or: 'Ramaddii Kan Barbaadu'
    },
    assignedFilter: {
        en: 'Assigned',
        am: 'የተመደበ',
        or: 'Kan Ramadame'
    },
    allFacilities: {
        en: 'All facilities',
        am: 'ሁሉም ተቋማት',
        or: 'Giddugala Hunda'
    },
    allSizes: {
        en: 'All sizes',
        am: 'ሁሉም መጠኖች',
        or: 'Hamma Hunda'
    },
    under5Items: {
        en: 'Under 5 items',
        am: 'ከ 5 ዕቃዎች በታች',
        or: 'Meeshaa 5 Gadi'
    },
    items5To10: {
        en: '5–10 items',
        am: '5–10 ዕቃዎች',
        or: 'Meeshaa 5–10'
    },
    over10Items: {
        en: 'Over 10 items',
        am: 'ከ 10 ዕቃዎች በላይ',
        or: 'Meeshaa 10 Ol'
    },
    orderDirection: {
        en: 'Order: {direction}',
        am: 'ቅደም ተከተል፡ {direction}',
        or: 'Tartiiba: {direction}'
    },
    ascendingWord: {
        en: 'Ascending',
        am: 'ወደ ላይ',
        or: 'Ol-gara-Olii'
    },
    descendingWord: {
        en: 'Descending',
        am: 'ወደ ታች',
        or: 'Gadi-gara-Gadii'
    },
    resetFilters: {
        en: 'Reset filters',
        am: 'ማጣሪያዎችን ዳግም አስጀምር',
        or: 'Calaltuu Haquu'
    },
    noPendingJobsMatch: {
        en: 'No pending jobs match these filters.',
        am: 'ከእነዚህ ማጣሪያዎች ጋር የሚዛመዱ በመጠባበቅ ላይ ያሉ ስራዎች የሉም።',
        or: 'Hojiin eeggatu calaltuu kanaan walsimu hin jiru.'
    },

    // Job Card
    unassignedBadge: {
        en: 'Unassigned',
        am: 'ያልተመደበ',
        or: 'Kan Hin Ramadamne'
    },
    facilityUnavailable: {
        en: 'Facility unavailable',
        am: 'ተቋሙ አይገኝም',
        or: 'Giddugalli Hin Argamne'
    },
    prioritySuffix: {
        en: '{priority} priority',
        am: '{priority} ቅድሚያ',
        or: 'Dursa {priority}'
    },
    assignedToWorkerLabel: {
        en: 'Assigned to {name}',
        am: 'ለ{name} የተመደበ',
        or: '{name}-f Kan Ramadame'
    },
    suggestedWorkerWithWorkload: {
        en: 'Suggested: {name} · {count} active jobs',
        am: 'የተጠቆመው፡ {name} · {count} ንቁ ስራዎች',
        or: 'Yaadame: {name} · hojii socho\'aa {count}'
    },
    chooseTeamMemberPrompt: {
        en: 'Choose a team member to assign this job',
        am: 'ይህንን ስራ ለመመደብ የቡድን አባል ይምረጡ',
        or: 'Hojii kana ramaduuf miseensa garee filadhu'
    },
    detailsButton: {
        en: 'Details',
        am: 'ዝርዝሮች',
        or: 'Bal\'ina'
    },
    chooseTeamMemberArrow: {
        en: 'Choose a team member →',
        am: 'የቡድን አባል ይምረጡ →',
        or: 'Miseensa garee filadhu →'
    },
    jobItemsCount: {
        en: '{count} items',
        am: '{count} ዕቃዎች',
        or: 'Meeshaa {count}'
    },

    // Available Workers / Team Panel
    teamTitle: {
        en: 'Team',
        am: 'ቡድን',
        or: 'Garee'
    },
    activeJobsLimitNotice: {
        en: 'Limit: 100 active jobs per person',
        am: 'ገደብ፡ ለአንድ ሰው 100 ንቁ ስራዎች',
        or: 'Daangaa: nama tokkoof hojii socho\'aa 100'
    },
    assigningJobNotice: {
        en: 'Assigning {type} {id}. Choose a team member below.',
        am: '{type} {id} በመመደብ ላይ። ከታች የቡድን አባል ይምረጡ።',
        or: '{type} {id} ramadaa jira. Miseensa garee armaan gadii filadhaa.'
    },
    selectJobInQueueNotice: {
        en: 'Select a job in the queue to see eligible team members.',
        am: 'ብቁ የቡድን አባላትን ለማየት በወረፋው ውስጥ ስራ ይምረጡ።',
        or: 'Miseensa heeyyama qabu arguuf tarree irraa hojii filadhaa.'
    },
    workloadTimezoneNotice: {
        en: 'Completed today uses {timezone}. Counts refresh every 15 seconds.',
        am: 'ዛሬ የተጠናቀቀው {timezone} ይጠቀማል። ቆጠራዎች በየ 15 ሰከንድ ይታደሳሉ።',
        or: 'Kan har\'a xumurame {timezone} fayyadama. Lakkoofsi sekondii 15 hunda haaroma.'
    },
    workloadUnavailableNotice: {
        en: 'Workload unavailable or loading. Assignments are disabled until counts are confirmed.',
        am: 'የስራ ጫና አይገኝም ወይም በመጫን ላይ ነው። ቆጠራዎች እስኪረጋገጡ ድረስ ምደባዎች ተሰናክለዋል።',
        or: 'Hojii ba\'aa hin argamne ykn fe\'amaa jira. Hanga mirkanaa\'utti ramaddiin cufameera.'
    },
    searchStaffPlaceholder: {
        en: 'Search name or staff code',
        am: 'ስም ወይም የሰራተኛ መለያ ፈልግ',
        or: 'Maqaa ykn koodii hojjetaa barbaadi'
    },
    allRoles: {
        en: 'All roles',
        am: 'ሁሉም የስራ ሚናዎች',
        or: 'Gahee Hunda'
    },
    workerWorkloadStatus: {
        en: '{active} / {max} active · {completed} completed today',
        am: '{active} / {max} ንቁ · {completed} ዛሬ ተጠናቋል',
        or: '{active} / {max} socho\'aa · {completed} har\'a xumurame'
    },
    workloadUnavailableText: {
        en: 'Workload unavailable',
        am: 'የስራ ጫና አይገኝም',
        or: 'Ba\'aan hojii hin jiru'
    },
    activeJobLimitReached: {
        en: 'Active job limit reached',
        am: 'የንቁ ስራ ገደብ ተደርሷል',
        or: 'Daangaan hojii socho\'aa ga\'eera'
    },
    notEligibleForJob: {
        en: 'Not eligible for this job',
        am: 'ለዚህ ስራ ብቁ አይደለም',
        or: 'Hojii kanaaf heeyyama hin qabu'
    },
    handledAnotherStageReason: {
        en: 'Handled another stage of this order; choose an independent worker.',
        am: 'የዚህን ትዕዛዝ ሌላ ደረጃ አስተናግዷል፤ ገለልተኛ ሰራተኛ ይምረጡ።',
        or: 'Sadarkaa biraa ajaja kanaa hojjeteera; hojjetaa walaba filadhaa.'
    },
    checkingIndependentVerifier: {
        en: 'Checking independent verifier…',
        am: 'ገለልተኛ አረጋጋጭን በማጣራት ላይ…',
        or: 'Mirkaneessaa walaba sakatta\'aa jira…'
    },
    assignButton: {
        en: 'Assign',
        am: 'መድብ',
        or: 'Ramadi'
    },
    assigningWord: {
        en: 'Assigning…',
        am: 'በመመደብ ላይ…',
        or: 'Ramadaa jira…'
    },
    noTeamMembersMatch: {
        en: 'No team members match these filters.',
        am: 'ከእነዚህ ማጣሪያዎች ጋር የሚዛመዱ የቡድን አባላት የሉም።',
        or: 'Miseensi garee calaltuu kanaan walsimu hin jiru.'
    },
    previousWord: {
        en: 'Previous',
        am: 'የቀደመ',
        or: 'Duraa'
    },
    nextWord: {
        en: 'Next',
        am: 'ቀጣይ',
        or: 'Itti Aanu'
    },
    pageOfPages: {
        en: '{page} of {pages}',
        am: '{page} ከ {pages}',
        or: '{page} keessaa {pages}'
    },

    // Job Details Modal
    jobIntelligenceTitle: {
        en: 'Job Intelligence',
        am: 'የስራ ዝርዝር መረጃ',
        or: 'Qorannoo Hojii'
    },
    logisticsRoute: {
        en: 'Logistics Route',
        am: 'የሎጅስቲክስ መስመር',
        or: 'Karaa Lojistiksii'
    },
    originLabel: {
        en: 'Origin',
        am: 'መነሻ',
        or: 'Bakka Ka\'umsaa'
    },
    destinationLabel: {
        en: 'Destination',
        am: 'መድረሻ',
        or: 'Bakka Gahumsaa'
    },
    activeWarehouseLabel: {
        en: 'Active Warehouse',
        am: 'ንቁ መጋዘን',
        or: 'Manna-Kuusaa Hojirra Jiru'
    },
    operationsMatrixLabel: {
        en: 'Operations Matrix',
        am: 'የክንውን ማትሪክስ',
        or: 'Gabatee Hojii'
    },
    requestedByLabel: {
        en: 'Requested By',
        am: 'የጠየቀው',
        or: 'Kan Gaafate'
    },
    authAuthorityLabel: {
        en: 'Auth Authority',
        am: 'የፍቃድ ባለስልጣን',
        or: 'Abbaa Taayitaa Heeyyamaa'
    },
    pendingAuthLabel: {
        en: 'Pending Auth',
        am: 'ፈቃድ በመጠባበቅ ላይ',
        or: 'Heeyyama Eeggata'
    },
    timestampLabel: {
        en: 'Timestamp',
        am: 'የጊዜ ማህተም',
        or: 'Yeroo Galmee'
    },
    priorityLabel: {
        en: 'Priority',
        am: 'ቅድሚያ',
        or: 'Sadarkaa Ariifachiisummaa'
    },
    inventoryManifest: {
        en: 'Inventory Manifest',
        am: 'የዕቃ ዝርዝር ማኒፌስት',
        or: 'Tarree Meeshaa Kuusaa'
    },
    operationalPayloadEmpty: {
        en: 'Operational Payload Empty',
        am: 'የስራ ጭነት ባዶ ነው',
        or: 'Ba\'aan Hojii Duwwaadha'
    },
    dismissButton: {
        en: 'Dismiss',
        am: 'ዝጋ',
        or: 'Cufi'
    },
    confirmDeleteJob: {
        en: 'Are you sure you want to permanently delete this job?',
        am: 'ይህንን ስራ እስከመጨረሻው መሰረዝ እንደሚፈልጉ እርግጠኛ ነዎት?',
        or: 'Hojii kana guutummaatti haquu akka barbaaddu mirkaneeffattaa?'
    },

    // Active Matrix / Workload overview
    workloadOverviewSummary: {
        en: 'Workload overview',
        am: 'የስራ ጫና አጠቃላይ እይታ',
        or: 'Ilaalcha Ba\'aa Hojii'
    },
    liveOperationsMatrixTitle: {
        en: 'Live Operations Matrix',
        am: 'የቀጥታ ስራዎች ማትሪክስ',
        or: 'Gabatee Hojiiwwan Qajeeltoo'
    },
    workersActiveCount: {
        en: '{count} active',
        am: '{count} ንቁ',
        or: '{count} kan socho\'u'
    },
    reassignAction: {
        en: 'Reassign',
        am: 'እንደገና መድብ',
        or: 'Irra Deebi\'ii Ramadi'
    },
    unassignAction: {
        en: 'Unassign',
        am: 'ምደባን አንሳ',
        or: 'Ramaddii Kaasi'
    },
    selectWorkerPrompt: {
        en: 'Select Worker →',
        am: 'ሰራተኛ ይምረጡ →',
        or: 'Hojjetaa Fili →'
    },
    noActiveAssignments: {
        en: 'No active assignments',
        am: 'ምንም ንቁ ምደባዎች የሉም',
        or: 'Ramaddiin socho\'aa hin jiru'
    }
};
