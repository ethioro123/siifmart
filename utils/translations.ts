export type Language = 'en' | 'am' | 'or';

export const TRANSLATIONS = {
    common: {
        search: { en: 'Search', am: 'ፈልግ', or: 'Barbaadi' },
        cancel: { en: 'Cancel', am: 'ሰርዝ', or: 'Haqi' },
        confirm: { en: 'Confirm', am: 'አረጋግጥ', or: 'Mirkaneessi' },
        save: { en: 'Save', am: 'አስቀምጥ', or: 'Olkaa\'i' },
        delete: { en: 'Delete', am: 'ሰርዝ', or: 'Haqi' },
        edit: { en: 'Edit', am: 'አርትዕ', or: 'Gulaali' },
        close: { en: 'Close', am: 'ዝጋ', or: 'Cufi' },
        back: { en: 'Back', am: 'ተመለስ', or: 'Deebi\'i' },
        exit: { en: 'Exit', am: 'ውጣ', or: 'Ba\'i' },
        date: { en: 'Date', am: 'ቀን', or: 'Guyyaa' },
        status: { en: 'Status', am: 'ሁኔታ', or: 'Haala' },
        priority: { en: 'Priority', am: 'ቅድሚያ', or: 'Dursa' },
        notes: { en: 'Notes', am: 'ማስታወሻዎች', or: 'Yaadannoo' },
        loading: { en: 'Loading...', am: 'በመጫን ላይ...', or: 'Fe\'aa jira...' },
        success: { en: 'Success', am: 'ተሳክቷል', or: 'Milkaa\'eera' },
        error: { en: 'Error', am: 'ስህተት', or: 'Dogoggora' },
        warning: { en: 'Warning', am: 'ማስጠንቀቂያ', or: 'Akeekkachiisa' },
        quantity: { en: 'Qty', am: 'ብዛት', or: 'Baay\'ina' },
        price: { en: 'Price', am: 'ዋጋ', or: 'Gatii' },
        total: { en: 'Total', am: 'ጠቅላላ', or: 'Ida\'ama' },
        name: { en: 'Name', am: 'ስም', or: 'Maqaa' },
        add: { en: 'Add', am: 'ጨምር', or: 'Ida\'i' },
        remove: { en: 'Remove', am: 'አስወግድ', or: 'Balleessi' },
        submit: { en: 'Submit', am: 'አስገባ', or: 'Galchi' },
        print: { en: 'Print', am: 'አትም', or: 'Maxxansi' },
        email: { en: 'Email', am: 'ኢሜይል', or: 'Imeelii' },
        phone: { en: 'Phone', am: 'ስልክ', or: 'Bilbila' },
        address: { en: 'Address', am: 'አድራሻ', or: 'Teessoo' },
        all: { en: 'All', am: 'ሁሉም', or: 'Hunda' },
    },
    pos: {
        // Header & Navigation
        payNow: { en: 'Pay Now', am: 'አሁን ክፈል', or: 'Amma Kaffali' },
        clearCart: { en: 'Clear Cart', am: 'ጋሪውን አጽዳ', or: 'Gaarii Qulqulleessi' },
        clear: { en: 'Clear', am: 'አጽዳ', or: 'Qulqulleessi' },
        openDrawer: { en: 'Open Drawer', am: 'ሳጥን ክፈት', or: 'Saanduqa Bani' },
        closeShift: { en: 'Close Shift', am: 'ፈረቃ ዝጋ', or: 'Shifii Cufi' },
        reprintLast: { en: 'Reprint Last', am: 'መጨረሻውን እንደገና አትም', or: 'Isa Dhumaa Irra Deebi\'ii Maxxansi' },
        returns: { en: 'Returns', am: 'ምላሾች', or: 'Deebii' },
        miscItem: { en: 'Misc Item', am: 'የተለያየ ዕቃ', or: 'Mi\'a Biroo' },
        exitDashboard: { en: 'Exit to Dashboard', am: 'ወደ ዳሽቦርድ ውጣ', or: 'Gara Daashboordii Ba\'i' },
        searchPlaceholder: { en: 'Search products...', am: 'ምርቶችን ፈልግ...', or: 'Oomishaalee barbaadi...' },

        // Cart & Totals
        subtotal: { en: 'Subtotal', am: 'ንዑስ ድምር', or: 'Ida\'ama Xiqqaa' },
        tax: { en: 'Tax', am: 'ግብር', or: 'Taaksii' },
        discount: { en: 'Discount', am: 'ቅናሽ', or: 'Hir\'ifama' },
        walkInCustomer: { en: 'Walk-in Customer', am: 'የዘፈቀደ ደንበኛ', or: 'Maamila Darbaa' },
        cartEmpty: { en: 'Cart is empty', am: 'ጋሪው ባዶ ነው', or: 'Gaariin duwwaa dha' },

        // Payment
        cash: { en: 'Cash', am: 'ጥሬ ገንዘብ', or: 'Maallaqa Callaa' },
        card: { en: 'Card', am: 'ካርድ', or: 'Kaardii' },
        mobile: { en: 'Mobile', am: 'ሞባይል', or: 'Mobaayilii' },
        amountTendered: { en: 'Amount Tendered', am: 'የተከፈለ መጠን', or: 'Hanga Kaffalame' },
        changeDue: { en: 'Change Due', am: 'የሚመለስ', or: 'Deebii' },
        processPayment: { en: 'Process Payment', am: 'ክፍያ ሂደት', or: 'Kaffaltii Adeemsi' },
        totalAmountDue: { en: 'Total Amount Due', am: 'ጠቅላላ የሚከፈል', or: 'Ida\'ama Kaffalamu' },

        // Receipt
        receipt: { en: 'Receipt', am: 'ደረሰኝ', or: 'Nagahee' },
        printReceipt: { en: 'Print Receipt', am: 'ደረሰኝ አትም', or: 'Nagahee Maxxansi' },
        emailReceipt: { en: 'Email Receipt', am: 'ደረሰኝ በኢሜይል ላክ', or: 'Nagahee Imeeliin Ergi' },

        // Messages
        productNotFound: { en: 'Product not found', am: 'ምርቱ አልተገኘም', or: 'Oomishni hin argamne' },
        stockLimitReached: { en: 'Stock limit reached!', am: 'የአቅም ገደብ ተደርሷል!', or: 'Daangaa dandeettii ga\'eera!' },
        orderHeld: { en: 'Order Placed on Hold', am: 'ትዕዛዝ በመጠባበቅ ላይ', or: 'Ajajni Eegaa jira' },
        shiftClosed: { en: 'Shift Closed Successfully', am: 'ፈረቃ በተሳካ ሁኔታ ተዘግቷል', or: 'Shifiin Milkaa\'inaan Cufameera' },

        // Hold/Recall
        holdCart: { en: 'Hold Cart', am: 'ጋሪ አቆይ', or: 'Gaarii Tursi' },
        recallOrder: { en: 'Recall Held Order', am: 'የታቀፈውን ትዕዛዝ መልስ', or: 'Ajaja Tursame Deebisi' },

        // Products
        noProductsAvailable: { en: 'No Products Available', am: 'ምንም ምርቶች የሉም', or: 'Oomishaaleen hin jiran' },
        productsWillAppear: { en: 'Products will only appear here after they have been scanned and confirmed as received.', am: 'ምርቶች ከተቀበሉ እና ከተረጋገጡ በኋላ ብቻ እዚህ ይታያሉ።', or: 'Oomishaaleen erga fudhatamanii fi mirkaneeffamanii booda qofa asitti mul\'atu.' },
        goToPOSCommand: { en: 'Go to POS Command Center to receive items', am: 'ዕቃዎችን ለመቀበል ወደ POS ትዕዛዝ ማዕከል ይሂዱ', or: 'Gara Wiirtuu Ajaja POS deemii mi\'oota fudhadhu' },
        sale: { en: 'SALE', am: 'ሽያጭ', or: 'GURGURTAA' },
        left: { en: 'left', am: 'ቀረ', or: 'hafe' },
    },
    warehouse: {
        tabs: {
            docks: { en: 'DOCKS', am: 'መርከቦች', or: 'Buufata Fe\'umsaa' },
            receive: { en: 'RECEIVE', am: 'ተቀበል', or: 'Fudhachuu' },
            putaway: { en: 'PUTAWAY', am: 'አስቀምጥ', or: 'Kuusaa Keessatti Galiinsa' },
            pick: { en: 'PICK', am: 'ምረጥ', or: 'Fiduu / Filachuu' },
            pack: { en: 'PACK', am: 'ታሸግ', or: 'Sumsuu / Uwwisuu' },
            replenish: { en: 'REPLENISH', am: 'ሙላ', or: 'Deebisanii Guutuu' },
            count: { en: 'COUNT', am: 'ቁጠር', or: 'Lakkofsu / Herreguu' },
            waste: { en: 'WASTE', am: 'ብክነት', or: 'Qaraxa Badde / Hafe' },
            returns: { en: 'RETURNS', am: 'ምላሾች', or: 'Deebitoota' },
            assign: { en: 'ASSIGN', am: 'መድብ', or: 'Ramaduu' },
            transfer: { en: 'TRANSFER', am: 'ማስተላለፍ', or: 'Gara Birootti Dabarsuu' },
        },

        // Job Management
        jobId: { en: 'Job ID', am: 'የስራ መታወቂያ', or: 'Eenyummaa Hojii' },
        assignedTo: { en: 'Assigned To', am: 'የተመደበለት', or: 'Kan Ramadameef' },
        location: { en: 'Location', am: 'ቦታ', or: 'Bakka' },
        bin: { en: 'Bin', am: 'ሳጥን', or: 'Kuusaa' },
        sku: { en: 'SKU', am: 'SKU', or: 'SKU' },
        scanBarcode: { en: 'Scan Barcode', am: 'ባርኮድ ስካን', or: 'Baarkoodii Iskaani' },
        startJob: { en: 'Start Job', am: 'ስራ ጀምር', or: 'Hojii Jalqabi' },
        completeJob: { en: 'Complete', am: 'ጨርስ', or: 'Xumuri' },

        // Status
        status: { en: 'Status', am: 'ሁኔታ', or: 'Haala' },
        pending: { en: 'Pending', am: 'በመጠባበቅ ላይ', or: 'Eeggachaa' },
        inProgress: { en: 'In Progress', am: 'በሂደት ላይ', or: 'Hojii Irra Jira' },
        completed: { en: 'Completed', am: 'ተጠናቀቀ', or: 'Xumurameera' },
        allStatus: { en: 'All', am: 'ሁሉም', or: 'Hundumaa' },

        // Scanner
        scanBin: { en: 'Scan Bin', am: 'ሳጥን ስካን', or: 'Kuusaa Iskaani' },
        scanItem: { en: 'Scan Item', am: 'ዕቃ ስካን', or: 'Mi\'a Iskaani' },
        invalidBin: { en: 'Invalid Bin', am: 'የተሳሳተ ሳጥን', or: 'Kuusaa Dogoggoraa' },

        // Location
        zone: { en: 'Zone', am: 'ዞን', or: 'Zoonii' },
        aisle: { en: 'Aisle', am: 'መተላለፊያ', or: 'Dabarbii' },
        selectLocation: { en: 'Select Location', am: 'ቦታ ምረጥ', or: 'Bakka Fili' },
        selectStorageLocation: { en: 'Select Storage Location', am: 'የማከማቻ ቦታ ምረጥ', or: 'Bakka Kuusaa Fili' },
        selectPickLocation: { en: 'Select Pick Location', am: 'የመምረጫ ቦታ ምረጥ', or: 'Bakka Filannoo Fili' },
        selectedLocation: { en: 'Selected Location', am: 'የተመረጠ ቦታ', or: 'Bakka Filatame' },
        available: { en: 'Available', am: 'ይገኛል', or: 'Ni argama' },
        occupied: { en: 'Occupied', am: 'ተይዟል', or: 'Qabameera' },

        // Messages
        jobComplete: { en: 'Job Complete!', am: 'ስራ ተጠናቀቀ!', or: 'Hojiin Xumurameera!' },
        receptionComplete: { en: 'Reception Complete', am: 'ቅበላ ተጠናቀቀ', or: 'Fudhannaan Xumurameera' },
        jobAssigned: { en: 'Job assigned to you', am: 'ስራ ተመድቦልዎታል', or: 'Hojiin siif ramadameera' },

        // Dock Management
        dockManagement: { en: 'Dock Management', am: 'የመርከብ አስተዳደር', or: 'Bulchiinsa Buufata' },
        yardQueue: { en: 'Yard Queue', am: 'የጓሮ ወረፋ', or: 'Tarree Oobdii' },
        empty: { en: 'Empty', am: 'ባዶ', or: 'Duwwaa' },
        maintenance: { en: 'Maintenance', am: 'ጥገና', or: 'Suphaa' },

        // Receiving
        poNumber: { en: 'PO Number', am: 'የግዢ ትዕዛዝ ቁጥር', or: 'Lakkoofsa Ajaja Bittaa' },
        supplier: { en: 'Supplier', am: 'አቅራቢ', or: 'Dhiyeessaa' },
        expectedQty: { en: 'Expected Qty', am: 'የሚጠበቀው ብዛት', or: 'Baay\'ina Eegamu' },
        receivedQty: { en: 'Received Qty', am: 'የተቀበለው ብዛት', or: 'Baay\'ina Fudhatame' },
        startReceiving: { en: 'Start Receiving', am: 'መቀበል ጀምር', or: 'Fudhachuu Jalqabi' },
        confirmReceipt: { en: 'Confirm Receipt', am: 'ደረሰኝ አረጋግጥ', or: 'Nagahee Mirkaneessi' },

        // Putaway
        putawayOperations: { en: 'Putaway Operations', am: 'የማስቀመጫ ስራዎች', or: 'Tarkaanfii Galiinsa Kuusaa Keessatti' },
        putawayJobs: { en: 'Putaway Jobs', am: 'የማስቀመጫ ስራዎች', or: 'Hojiiwwan Kaawwachuu' },
        itemsToPutaway: { en: 'Items to Putaway', am: 'ለማስቀመጥ ዕቃዎች', or: 'Mi\'oota Kaawwachuu' },
        storeReceivedGoods: { en: 'Store received goods in warehouse locations', am: 'የተቀበሉ እቃዎችን በመጋዘን ቦታዎች ውስጥ አከማች', or: 'Meeshaa fudhataman bakka kuusaa keessatti kaa\'i' },

        // Pick
        pickJobs: { en: 'Pick Jobs', am: 'የመምረጫ ስራዎች', or: 'Hojiiwwan Filannoo' },
        itemsToPick: { en: 'Items to Pick', am: 'ለመምረጥ ዕቃዎች', or: 'Mi\'oota Filachuu' },

        // Pack
        packJobs: { en: 'Pack Jobs', am: 'የማሸጊያ ስራዎች', or: 'Hojiiwwan Saamuu' },
        itemsToPack: { en: 'Items to Pack', am: 'ለማሸግ ዕቃዎች', or: 'Mi\'oota Saamuu' },
        boxSize: { en: 'Box Size', am: 'የሳጥን መጠን', or: 'Hanga Saanduqaa' },
        small: { en: 'Small', am: 'ትንሽ', or: 'Xiqqaa' },
        medium: { en: 'Medium', am: 'መካከለኛ', or: 'Giddugaleessa' },
        large: { en: 'Large', am: 'ትልቅ', or: 'Guddaa' },
        extraLarge: { en: 'Extra Large', am: 'በጣም ትልቅ', or: 'Baay\'ee Guddaa' },

        // Count
        inventoryCount: { en: 'Inventory Count', am: 'የእቃ ቆጠራ', or: 'Lakkaa\'uu Meeshaalee' },
        expectedCount: { en: 'Expected Count', am: 'የሚጠበቀው ቁጠራ', or: 'Lakkaa\'uu Eegamu' },
        actualCount: { en: 'Actual Count', am: 'ትክክለኛ ቁጠራ', or: 'Lakkaa\'uu Dhugaa' },
        variance: { en: 'Variance', am: 'ልዩነት', or: 'Garaagarummaa' },

        // Actions & Buttons
        start: { en: 'Start', am: 'ጀምር', or: 'Jalqabi' },
        viewDetails: { en: 'View Details', am: 'ዝርዝሮችን ይመልከቱ', or: 'Bal\'ina Ilaali' },
        noJobs: { en: 'No jobs available', am: 'ምንም ስራዎች የሉም', or: 'Hojiiwwan hin jiran' },
        sort: { en: 'Sort', am: 'ደርድር', or: 'Sosoochi' },
        sortBy: { en: 'Sort:', am: 'ደርድር:', or: 'Sosoochi:' },
        searchByJobID: { en: 'Search by Job ID or PO number...', am: 'ስራዎችን በመለያ ወይም በPO ቁጥር ፈልግ...', or: 'Job ID yookiin Lakkoofsa PO\'n barbaadi...' },

        // Placeholders
        scanProductSKU: { en: 'Scan Product SKU...', am: 'የምርት SKU ስካን ያድርጉ...', or: 'SKU Oomishaa Iskaani...' },
        scanOrderID: { en: 'Scan Order ID / Receipt...', am: 'የትዕዛዝ መታወቂያ ስካን ያድርጉ...', or: 'Eenyummaa Ajajaa Iskaani...' },
        enterManually: { en: 'Or Enter Location Manually', am: 'ወይም ቦታ በእጅ ያስገቡ', or: 'Yookaan Bakka Harkaan Galchi' },

        // Job Details
        orderReference: { en: 'Order Reference', am: 'የትዕዛዝ ማጣቀሻ', or: 'Wabii Ajajaa' },
        itemCount: { en: 'Item Count', am: 'የዕቃ ብዛት', or: 'Baay\'ina Mi\'aa' },

        // Additional Missing Translations
        allItemsProcessed: { en: 'All items processed.', am: 'ሁሉም ዕቃዎች ተካሂደዋል።', or: 'Mi\'ootni hundi adeemaniiru.' },
        closeScanner: { en: 'Close Scanner', am: 'ስካነር ዝጋ', or: 'Iskaana Cufi' },
        items: { en: 'Items', am: 'ዕቃዎች', or: 'Mi\'oota' },
        remaining: { en: 'Remaining', am: 'ቀሪ', or: 'Hafaa' },
        from: { en: 'From', am: 'ከ', or: 'Irratti' },
        to: { en: 'To', am: 'ወደ', or: 'Gara' },
        scanView: { en: 'SCAN VIEW', am: 'የስካን እይታ', or: 'Ilaalcha Iskaanaa' },
        viewList: { en: 'VIEW LIST', am: 'ዝርዝር ይመልከቱ', or: 'Tarree Ilaali' },
        exit: { en: 'EXIT', am: 'ውጣ', or: 'Ba\'i' },
        nA: { en: 'N/A', am: 'የለም', or: 'Hin jiru' },
        short: { en: 'Short', am: 'አጭር', or: 'Gabaabaa' },
        picked: { en: 'Picked', am: 'ተመረጠ', or: 'Filatame' },
        chooseWhereToStore: { en: 'Choose where to store this item', am: 'ይህንን ዕቃ የት እንደሚያከማቹ ይምረጡ', or: 'Mi\'a kana eessa kuusuu akka barbaadan filadhu' },
        chooseWhereToPick: { en: 'Choose where to pick this item', am: 'ይህንን ዕቃ የት እንደሚወስዱ ይምረጡ', or: 'Mi\'a kana eessa fudhatuu akka barbaadan filadhu' },
        scanLocationBarcode: { en: 'or Scan Location Barcode', am: 'ወይም የቦታ ባርኮድ ስካን', or: 'Yookaan Baarkoodii Bakkaa Iskaani' },
        scanOrEnterLocation: { en: 'Scan or enter location (e.g., A-01-05, B-03-12)', am: 'ቦታ ስካን ወይም ያስገቡ (ለምሳሌ: A-01-05, B-03-12)', or: 'Bakka iskaani yookaan galchi (fakkeenyaaf: A-01-05, B-03-12)' },
        use: { en: 'Use', am: 'ጥቀም', or: 'Fayyadami' },
        tipScanLocation: { en: '💡 Tip: Scan location barcode or type format:', am: '💡 ምክር: የቦታ ባርኮድ ስካን ወይም ቅርጸት ይተይቡ:', or: '💡 Gorsa: Baarkoodii bakkaa iskaani yookaan qaama galchi:' },
        orUseCamera: { en: '• Or use 📷 camera button', am: '• ወይም 📷 ካሜራ ቁልፍ ይጠቀሙ', or: '• Yookaan 📷 kaameeraa fayyadami' },
        temperatureRequirement: { en: 'Temperature Requirement', am: 'የሙቀት መስፈርት', or: 'Haala Ho\'a' },
        useZoneForStorage: { en: 'Use {zone} for proper storage', am: 'ለትክክለኛ ማከማቻ {zone} ይጠቀሙ', or: 'Kuusaa sirrii ta\'eef {zone} fayyadami' },
        smartSuggestions: { en: '💡 Smart Suggestions', am: '💡 ዘመናዊ ምክሮች', or: '💡 Gorsa Ogeessa' },
        basedOnCategory: { en: 'Based on product category', am: 'በምርት ምድብ ላይ የተመሰረተ', or: 'Ramaddii oomishaa irratti hundaa\'e' },
        selectedStorageLocation: { en: 'Selected Storage Location', am: 'የተመረጠ የማከማቻ ቦታ', or: 'Bakka Kuusaa Filatame' },
        locationOccupied: { en: '⚠️ This location is occupied. Consider choosing another.', am: '⚠️ ይህ ቦታ ተይዟል። ሌላ መምረጥ ይመልከቱ።', or: '⚠️ Bakka kana qabameera. Kan biraa filachuu yaali.' },
        changeLocation: { en: 'Change Location', am: 'ቦታ ለውጥ', or: 'Bakka Jijjiiramsi' },
        scanProductBarcode: { en: 'Scan Product Barcode', am: 'የምርት ባርኮድ ስካን', or: 'Baarkoodii Oomishaa Iskaani' },
        scanBarcodeOrEnterSKU: { en: 'Scan barcode or enter SKU...', am: 'ባርኮድ ስካን ወይም SKU ያስገቡ...', or: 'Baarkoodii iskaani yookaan SKU galchi...' },
        expected: { en: 'Expected', am: 'የሚጠበቀው', or: 'Eegamu' },
        confirm: { en: 'CONFIRM', am: 'አረጋግጥ', or: 'MIRKANEESSI' },
        skipItem: { en: 'SKIP ITEM', am: 'ዕቃ ዝለል', or: 'MI\'A DABALSI' },
        shortPick: { en: 'SHORT PICK', am: 'አጭር ምረጥ', or: 'FILANNOO GABABAA' },
        enterActualQuantity: { en: 'Enter ACTUAL quantity found (Expected: {qty}):', am: 'የተገኘውን ትክክለኛ ብዛት ያስገቡ (የሚጠበቀው: {qty}):', or: 'Baay\'ina dhugaa argame galchi (Eegamu: {qty}):' },
        shortPickRecorded: { en: 'Short Pick Recorded: {actual}/{expected}. Inventory flagged for cycle count.', am: 'አጭር ምረጥ ተመዝግቧል: {actual}/{expected}። አቅም ለዑደት ቆጠራ ምልክት ተደርጎበታል።', or: 'Filannoo Gababaa Galmeeffame: {actual}/{expected}. Kuusaa lakkaa\'uu dhaabaa keessatti mallatteeffameera.' },
        invalidQuantity: { en: 'Invalid quantity.', am: 'የማያገለግል ብዛት።', or: 'Baay\'ina hin fayyadne.' },
        itemSkipped: { en: 'Item skipped. Moved to end of pick list.', am: 'ዕቃ ተዘልሏል። ወደ የመምረጫ ዝርዝር መጨረሻ ተዛውሯል።', or: 'Mi\'a dabalameera. Gara booda tarree filannoo geessameera.' },
        productVerified: { en: '✓ Product verified!', am: '✓ ምርት ተረጋግጧል!', or: '✓ Oomishni mirkaneeffameera!' },
        wrongProduct: { en: '⚠️ Wrong product! Expected: {expected}, Scanned: {scanned}', am: '⚠️ የተሳሳተ ምርት! የሚጠበቀው: {expected}, የተስካነው: {scanned}', or: '⚠️ Oomishni Dogoggoraa! Eegamu: {expected}, Iskaaname: {scanned}' },
        checkExpiry: { en: 'Check Expiry', am: 'የአገልግሎት ጊዜ ይፈትሹ', or: 'Yeroo Xumuraa Mirkaneessi' },
        noDate: { en: 'No Date', am: 'ቀን የለም', or: 'Guyyaa Hin Jiru' },
        criticalExpires: { en: 'CRITICAL (Expires < 7 Days)', am: 'አስፈላጊ (ከ7 ቀናት በታች ይወድቃል)', or: 'BAKKA BU\'UURA (Guyyaa 7 Ol Booda Xumura)' },
        warningExpires: { en: 'Warning (< 30 Days)', am: 'ማስጠንቀቂያ (< 30 ቀናት)', or: 'Akeekkachiisa (< Guyyaa 30)' },
        good: { en: 'Good', am: 'ጥሩ', or: 'Toltuu' },
        invalidBinLabel: { en: 'Invalid Bin Label', am: 'የማያገለግል የሳጥን መለያ', or: 'Mallattoo Kuusaa Hin Fayyadne' },
        pleaseSelectLocation: { en: 'Please select a location', am: 'እባክዎ ቦታ ይምረጡ', or: 'Maaloo bakka filadhu' },
        locationSelected: { en: 'Location selected: {location}', am: 'ቦታ ተመርጧል: {location}', or: 'Bakka filatame: {location}' },
        pleaseSelectStorageLocation: { en: 'Please select a storage location first', am: 'እባክዎ በመጀመሪያ የማከማቻ ቦታ ይምረጡ', or: 'Maaloo dura bakka kuusaa filadhu' },
        jobAssignedToYou: { en: 'Job assigned to you ({name})', am: 'ስራ ተመድቦልዎታል ({name})', or: 'Hojiin siif ramadameera ({name})' },
        errorJobNoItems: { en: 'Error: Job has no items. Please contact IT.', am: 'ስህተት: ስራው ዕቃዎች የሉትም። እባክዎ IT ያግኙ።', or: 'Dogoggora: Hojii kana keessatti mi\'oota hin jiru. Maaloo IT qunnamti.' },
        jobCompleteStartingNext: { en: 'Job {id} complete! Starting next job...', am: 'ስራ {id} ተጠናቋል! ቀጣዩን ስራ በመጀመር ላይ...', or: 'Hojii {id} xumurameera! Hojii itti aanu jalqabaa jira...' },
        jobCompleteAllDone: { en: 'Job {id} complete! All {type} jobs done.', am: 'ስራ {id} ተጠናቋል! ሁሉም {type} ስራዎች ተጠናቀዋል።', or: 'Hojii {id} xumurameera! Hojiiwwan {type} hundi xumuramaniiru.' },
        invalidFormat: { en: 'Invalid format. Use format: A-01-01', am: 'የማያገለግል ቅርጸት። ቅርጸት ይጠቀሙ: A-01-01', or: 'Qaama hin fayyadne. Qaama fayyadami: A-01-01' },
        driverDashboard: { en: 'Driver Dashboard', am: 'የአሽከርካሪ ዳሽቦርድ', or: 'Daashboordii Konkolaachisaa' },
        activeDeliveries: { en: 'Active Deliveries & Tasks', am: 'ንቁ ማድረሻዎች እና ተግባራት', or: 'Ergiiwwan Jireenyaa fi Hojiiwwan' },
        assignedJobs: { en: 'Assigned Jobs', am: 'የተመደቡ ስራዎች', or: 'Hojiiwwan Ramadaman' },
        noActiveDeliveries: { en: 'No active deliveries', am: 'ንቁ ማድረሻዎች የሉም', or: 'Ergiiwwan jireenyaa hin jiran' },
        allCaughtUp: { en: 'You\'re all caught up!', am: 'ሁሉም ነገር ተጠናቋል!', or: 'Hundumtuu xumurameera!' },
        approved: { en: '✓ Approved', am: '✓ ተጸድቋል', or: '✓ Mirkaneeffameera' },
        itemsLabel: { en: 'Items', am: 'ዕቃዎች', or: 'Mi\'oota' },
        scanLocationWithCamera: { en: 'Scan Location with Camera', am: 'ቦታን በካሜራ ስካን', or: 'Bakka Kaameeraan Iskaani' },
        scanProductWithCamera: { en: 'Scan Product with Camera', am: 'ምርትን በካሜራ ስካን', or: 'Oomishaa Kaameeraan Iskaani' },
        approvedPOsWillAppear: { en: 'Approved purchase orders from Procurement will appear here', am: 'ከግዢ ክፍል የተጸድቁ የግዢ ትዕዛዞች እዚህ ይታያሉ', or: 'Ajajoota bittaa mirkaneeffaman kan Bittaa irraa kan dhufan asitti mul\'atu' },
        reference: { en: 'Ref', am: 'ማጣቀሻ', or: 'Wabii' },
        truck: { en: 'Truck', am: 'መኪና', or: 'Makiinaa' },
        minutes: { en: 'min', am: 'ደቂቃ', or: 'daqiiqaa' },
        noPendingJobsMatch: { en: 'No pending jobs match filters', am: 'ምንም በመጠባበቅ ላይ ያሉ ስራዎች ከፊልተሮች ጋር አይዛመዱም', or: 'Hojiiwwan eegaa jiran filtaroota waliin hin walgahu' },
        availableStaff: { en: 'Available Staff', am: 'የሚገኝ ሰራተኛ', or: 'Hojjettuu Argama' },

        // Processing & Status
        processing: { en: 'Processing...', am: 'በሂደት ላይ...', or: 'Adeemsa irra jira...' },
        continue: { en: 'Continue', am: 'ቀጥል', or: 'Itti fufi' },
        continueArrow: { en: 'Continue →', am: 'ቀጥል →', or: 'Itti fufi →' },
        startArrow: { en: 'Start →', am: 'ጀምር →', or: 'Jalqabi →' },
        assignedToText: { en: 'Assigned to', am: 'ተመድቦልዎታል ለ', or: 'Kan ramadameef' },
        completedToday: { en: 'Completed Today', am: 'ዛሬ የተጠናቀቀ', or: 'Har\'a Xumurameera' },
        noPendingJobs: { en: 'No Pending Putaway Jobs', am: 'ምንም የማስቀመጫ ስራዎች የሉም', or: 'Hojiiwwan Kaawwachuu hin jiran' },
        noJobsMatchFilters: { en: 'No jobs match your filters', am: 'ምንም ስራዎች ከፊልተሮችዎ ጋር አይዛመዱም', or: 'Hojiiwwan filtaroota keessan waliin hin walgahu' },
        tryAdjustingFilters: { en: 'Try adjusting your search or filters', am: 'ፍለጋዎን ወይም ፊልተሮችዎን ይስተካከሉ', or: 'Barbaachisaan yookaan filtarootaan bakka bu\'i' },
        jobsAppearAfterReceive: { en: 'Jobs will appear here after receiving goods in RECEIVE tab', am: 'ስራዎች ከRECEIVE ታብ ውስጥ እቃዎች ከተቀበሉ በኋላ እዚህ ይታያሉ', or: 'Hojiiwwan erga mi\'oota TAB RECEIVE keessatti fudhatamanii booda asitti mul\'atu' },
        selectJobToAssign: { en: '← Select a job to assign', am: '← ስራ ምረጥ ለመመድብ', or: '← Hojii filadhu ramachuuf' },
        selectJobFirst: { en: 'Select a job first', am: 'በመጀመሪያ ስራ ይምረጡ', or: 'Dura hojii filadhu' },
        match: { en: 'Match', am: 'የሚዛመድ', or: 'Walgahu' },
        active: { en: 'active', am: 'ንቁ', or: 'jireenyaa' },
        searchJobsByID: { en: 'Search jobs by ID...', am: 'ስራዎችን በመለያ ፈልግ...', or: 'Hojiiwwan eenyummaan barbaadi...' },
        pendingJobs: { en: 'Pending Jobs', am: 'በመጠባበቅ ላይ ያሉ ስራዎች', or: 'Hojiiwwan Eegaa jiran' },
        moreItems: { en: 'more items', am: 'ተጨማሪ ዕቃዎች', or: 'mi\'oota dabalataa' },
        zoneLocked: { en: 'Zone is locked', am: 'ዞኑ ተፈርጋል', or: 'Zooniin cufameera' },
        zoneLockedLabel: { en: '🔒 Zone Locked', am: '🔒 ዞን ተፈርጋል', or: '🔒 Zooniin Cufameera' },
        suggested: { en: 'Suggested', am: 'የታሰበ', or: 'Yaadatame' },
        tapToScan: { en: 'Tap a card to start scanner', am: 'ስካነር ለማስጀመር ካርድ ይንኩ', or: 'Iskaanaa eegaluuf kaardii tuqi' },
        packDesc: { en: 'Pack orders for delivery', am: 'ለማድረስ ትዕዛዞችን አሽጉ', or: 'Ajajoota erguuf saami' },
        approvedPOsWillAppear: { en: 'Approved purchase orders will appear here', am: 'የተጸድቁ የግዢ ትዕዛዞች እዚህ ይታያሉ', or: 'Ajajoota bittaa mirkaneeffaman asitti mulatu' },

        // Docks Section
        docks: {
            incoming: { en: 'Incoming (Inbound)', am: 'ገቢ (መቀበያ)', or: 'Seensaa (Fudhannaa)' },
            outgoing: { en: 'Outgoing (Outbound)', am: 'ወጪ (ማጓጓዣ)', or: 'Gadii (Ergaa)' },
            driver: { en: 'Driver Portal', am: 'አሽከርካሪ ፖርታል', or: 'Poortaalii Konkolaachisaa' },
            inboundTitle: { en: 'Inbound Docks (Receiving)', am: 'የገቢ መርከቦች (መቀበያ)', or: 'Buufata Seensaa (Fudhannaa)' },
            outboundTitle: { en: 'Outbound Docks (Shipping)', am: 'የወጪ መርከቦች (ማጓጓዣ)', or: 'Buufata Gadii (Ergaa)' },
            empty: { en: 'EMPTY', am: 'ባዶ', or: 'DUWWAA' },
            occupied: { en: 'OCCUPIED', am: 'የተያዘ', or: 'QABAMEERA' },
            maintenance: { en: 'MAINTENANCE', am: 'ጥገና', or: 'SUPHAAN' },
            addDock: { en: 'ADD DOCK', am: 'መርከብ ጨምር', or: 'Buufata Ida\'i' },
            supplier: { en: 'Supplier', am: 'አቅራቢ', or: 'Dhiyeessaa' },
            assignDock: { en: 'Assign Dock', am: 'መርከብ መድብ', or: 'Buufata Ramadi' },
        },

        // General Warehouse Dashboard
        totalItems: { en: 'Total Items', am: 'ጠቅላላ ዕቃዎች', or: 'Mi\'oota Walii Galaa' },
        workersActive: { en: 'Workers Active', am: 'ንቁ ሰራተኞች', or: 'Hojjettoota Jireenyaa' },
        priority: { en: 'Priority', am: 'ቅድሚያ', or: 'Dursa' },

        // Receiving Section
        noApprovedPOs: { en: 'No Approved Purchase Orders', am: 'ምንም የተጸድቁ የግዢ ትዕዛዞች የሉም', or: 'Ajajoota bittaa mirkaneeffaman hin jiran' },
        receivingQueue: { en: 'Receiving Queue', am: 'የመቀበያ ወረፋ', or: 'Tarree Fudhannaa' },
        noItemsReceivedYet: { en: 'No items received yet', am: 'ምንም ዕቃዎች እስካሁን አልተቀበሉም', or: 'Mi\'ootni ammaatti hin fudhatamne' },
        reprintLabels: { en: 'Reprint labels for this item', am: 'ለዚህ ዕቃ መለያዎችን እንደገና አትም', or: 'Mi\'a kanaaf mallattoolee irra deebi\'ii maxxansi' },
        generateNewSKU: { en: 'Generate New SKU', am: 'አዲስ SKU ፍጠር', or: 'SKU Haaraa Uumu' },
        selectLabelSize: { en: 'Select Label Size', am: 'የመለያ መጠን ይምረጡ', or: 'Hanga Mallattoo Fili' },
        selectLabelFormat: { en: 'Select Label Format', am: 'የመለያ ቅርጸት ይምረጡ', or: 'Qaama Mallattoo Fili' },
        scanOrEnterSupplierBarcode: { en: 'Scan or enter supplier barcode...', am: 'የአቅራቢ ባርኮድ ስካን ወይም ያስገቡ...', or: 'Baarkoodii dhiyeessaa iskaani yookaan galchi...' },
        completeOnly: { en: 'Complete Only', am: 'ብቻ ጨርስ', or: 'Qofa Xumuri' },
        completeAndPrintLabels: { en: 'Complete & Print Labels', am: 'ጨርስ እና መለያዎችን አትም', or: 'Xumuri fi Mallattoolee Maxxansi' },
        quantityToReceive: { en: 'Quantity to receive', am: 'የሚቀበለው ብዛት', or: 'Baay\'ina Fudhatamu' },

        // Picking Section
        pickAllAdmin: { en: 'Pick All (Admin)', am: 'ሁሉንም ዝርዝ (አስተዳዳሪ)', or: 'Hunda Filadhu (Bulchiinsa)' },
        goToLocation: { en: '📍 GO TO LOCATION', am: '📍 ወደ ቦታ ይሂዱ', or: '📍 Gara Bakkaa Deemi' },
        pickItem: { en: 'Pick {qty}x {name}', am: '{qty}x {name} ዝርዝ', or: '{qty}x {name} Fili' },
        noLocationAssigned: { en: 'No Location Assigned', am: 'ቦታ አልተመደበም', or: 'Bakka hin ramadame' },
        checkInventoryRecords: { en: 'Check inventory records for this item', am: 'ለዚህ ዕቃ የእቃ ምዝግብ ይፈትሹ', or: 'Mi\'a kanaaf galmee meeshaalee mirkaneessi' },
        thisLocationHasItems: { en: '📦 This location has existing items', am: '📦 ይህ ቦታ አሁን ያሉ ዕቃዎች አሉት', or: '📦 Bakka kana keessatti mi\'oota jiran' },

        // Packing Section
        packJobTitle: { en: 'Pack Job', am: 'የማሸጊያ ስራ', or: 'Hojii Saamuu' },
        startPacking: { en: 'Start Packing', am: 'ማሸግ ጀምር', or: 'Saamuu Jalqabi' },
        startPutaway: { en: 'Start Putaway', am: 'ማስቀመጥ ጀምር', or: 'Kaawwachuu Jalqabi' },
        startPicking: { en: 'Start Picking', am: 'ምረጥ ጀምር', or: 'Filannoo Jalqabi' },

        // Replenish Section
        forwardPickReplenishment: { en: 'Forward Pick Replenishment', am: 'የመፊት ምረጫ ማሟያ', or: 'Filannoo Duraan Guutuu' },
        restockPickFaces: { en: 'Restock pick faces from bulk storage based on demand', am: 'የመምረጫ ፊቶችን ከጅምላ ማከማቻ በፍላጎት መሰረት ሙላ', or: 'Fuullee filannoo kuusaa gurguddoo irraa haalli barbaachisuuf guuti' },
        selectAllLowStock: { en: 'Select All Low Stock', am: 'ሁሉንም ዝቅተኛ አቅም ይምረጡ', or: 'Kuusaa Xiqqaa Hunda Fili' },
        noItemsSelected: { en: 'No items selected for replenishment', am: 'ምንም ዕቃዎች ለማሟያ አልተመረጡም', or: 'Mi\'ootni guutuu filataman hin jiran' },

        // Transfer Section
        interSiteTransfers: { en: 'Inter-Site Transfers', am: 'የጣቢያ-ጣቢያ ማስተላለፍ', or: 'Dabarsuu Gidduu Bakkaa' },
        requestManageTransfers: { en: 'Request and manage inventory transfers between stores and warehouses', am: 'በመደብሮች እና መጋዘኖች መካከል የእቃ ማስተላለፍ ይጠይቁ እና ያስተዳድሩ', or: 'Dabarsuu meeshaalee gidduu dukaanootaa fi magaalaalee keessatti kadhadhu fi bulchi' },
        bulkDistribution: { en: 'Bulk Distribution', am: 'ጅምላ ስርጭት', or: 'Qo\'annoo Gurguddoo' },
        requestTransfer: { en: 'Request Transfer', am: 'ማስተላለፍ ይጠይቁ', or: 'Dabarsuu Kadhadhu' },
        requested: { en: 'Requested', am: 'የተጠየቀ', or: 'Kadhatee' },
        picking: { en: 'Picking', am: 'በመምረጥ ላይ', or: 'Filannoo irra jira' },
        packed: { en: 'Packed', am: 'ተሸግቷል', or: 'Sa\'ameera' },
        inTransit: { en: 'In Transit', am: 'በመጓዝ ላይ', or: 'Deemsa irra jira' },
        delivered: { en: 'Delivered', am: 'ደርሷል', or: 'Ga\'eera' },
        received: { en: 'Received', am: 'ተቀብሏል', or: 'Fudhatameera' },
        approve: { en: 'Approve', am: 'አጸድቅ', or: 'Mirkaneeffadhu' },
        markShipped: { en: 'Mark Shipped', am: 'እንደተላከ ምልክት አድርግ', or: 'Ergee Mirkaneessi' },
        creating: { en: 'Creating...', am: 'በመፍጠር ላይ...', or: 'Uumaa jira...' },
        createTransferRequest: { en: 'Create Transfer Request', am: 'የማስተላለፍ ጥያቄ ፍጠር', or: 'Kadhannoo Dabarsuu Uumi' },
        transferRequestCreated: { en: 'Transfer request created successfully!', am: 'የማስተላለፍ ጥያቄ በተሳካ ሁኔታ ተፈጥሯል!', or: 'Kadhannoo dabarsuu milkaa\'inaan uumameera!' },
        failedToCreateTransfer: { en: 'Failed to create transfer request', am: 'የማስተላለፍ ጥያቄ መፍጠር አልተሳካም', or: 'Kadhannoo dabarsuu uumuu hin milkaa\'ine' },
        transferApproved: { en: 'Transfer approved! Pick job created.', am: 'ማስተላለፍ ተጸድቋል! የመምረጫ ስራ ተፈጥሯል።', or: 'Dabarsuu mirkaneeffameera! Hojii filannoo uumameera.' },
        transferMarkedShipped: { en: 'Transfer marked as shipped! 🚚', am: 'ማስተላለፍ እንደተላከ ምልክት ተደርጎበታል! 🚚', or: 'Dabarsuu ergee akka ta\'e mirkaneessameera! 🚚' },
        failedToUpdateTransfer: { en: 'Failed to update transfer', am: 'ማስተላለፍ ማዘመን አልተሳካም', or: 'Dabarsuu haaromsuu hin milkaa\'ine' },

        // Short Pick Modal
        shortPickTitle: { en: 'Short Pick', am: 'አጭር ምረጥ', or: 'Filannoo Gababaa' },
        enterActualQuantityPicked: { en: 'Enter actual quantity picked', am: 'የተመረጠውን ትክክለኛ ብዛት ያስገቡ', or: 'Baay\'ina dhugaa filatame galchi' },
        expectedUnits: { en: 'Expected: {qty} units', am: 'የሚጠበቀው: {qty} ክፍሎች', or: 'Eegamu: {qty} yunitiin' },
        enterActualQuantity: { en: 'Enter the actual quantity you were able to pick', am: 'የቻሉትን ትክክለኛ ብዛት ያስገቡ', am: 'Baay\'ina dhugaa dandeessan filachuu galchi' },
        enterQuantity: { en: 'Enter quantity', am: 'ብዛት ያስገቡ', or: 'Baay\'ina Galchi' },

        // Zone Lock Modal
        lockZone: { en: 'Lock Zone {zone}', am: 'ዞን {zone} ዝጋ', or: 'Zoonii {zone} Cufi' },
        enterReasonLocking: { en: 'Enter reason for locking (optional)', am: 'ለመዝጋት ምክንያት ያስገቡ (አማራጭ)', or: 'Sababa cufuu galchi (filannoo)' },
        lockZoneButton: { en: 'Lock Zone', am: 'ዞን ዝጋ', or: 'Zoonii Cufi' },
        zoneLockedNotification: { en: 'Zone {zone} has been locked{reason}', am: 'ዞን {zone} ተፈርጋል{reason}', or: 'Zoonii {zone} cufameera{reason}' },
        forMaintenance: { en: ' for maintenance', am: ' ለጥገና', or: ' suphaa irratti' },
        cannotAssignJobZoneLocked: { en: 'Cannot assign job: Zone is locked for maintenance.', am: 'ስራ መመድብ አይቻልም: ዞኑ ለጥገና ተፈርጋል።', or: 'Hojii ramachuu hin dandeenyu: Zooniin suphaa irratti cufameera.' },

        // Labels Not Printed Modal
        stop: { en: '⛔ STOP', am: '⛔ ቁም', or: '⛔ DHUUBA' },
        labelsRequired: { en: 'Labels Required', am: 'መለያዎች ያስፈልጋሉ', or: 'Mallattooleen Barbaachisan' },
        mustPrintLabels: { en: 'You MUST print labels before completing reception.', am: 'መቀበልን ከመጨረስ በፊት መለያዎችን ማተም አለብዎት።', or: 'Fudhannaan xumuramuu dura mallattoolee maxxansuu qabda.' },
        mandatoryStep: { en: 'This step is mandatory to ensure inventory accuracy.', am: 'ይህ ደረጃ የእቃ ትክክለኛነትን ለማረጋገጥ የማያላምጥ ነው።', or: 'Ibsa kanaa mirkanoofachuu meeshaalee irratti waan barbaachisuudha.' },
        goBackPrintLabels: { en: '← Go Back & Print Labels', am: '← ተመለስ እና መለያዎችን አትም', or: '← Deebi\'i fi Mallattoolee Maxxansi' },
        pleasePrintLabels: { en: 'Please print labels to proceed', am: 'እባክዎ ለመቀጠል መለያዎችን ያትሙ', or: 'Maaloo itti fufuuf mallattoolee maxxansi' },

        // Incomplete Packing Modal
        incompletePacking: { en: 'Incomplete Packing', am: 'ያልተጠናቀቀ ማሸግ', or: 'Saamuu Hin Xumuramne' },
        notAllItemsPacked: { en: 'Not all items are packed', am: 'ሁሉም ዕቃዎች አልተሸጡም', or: 'Mi\'ootni hundi hin sa\'aman' },
        sureCompleteOrder: { en: 'Are you sure you want to complete this order?', am: 'ይህንን ትዕዛዝ ማጠናቀቅ መፈለግዎን እርግጠኛ ነዎት?', or: 'Ajaja kanaa xumuurachuu barbaaddanii mirkanooftee?' },
        onlyPackedOfTotal: { en: 'Only {packed} of {total} items are marked as packed.', am: 'ከ{total} ዕቃዎች ውስጥ {packed} ብቻ እንደተሸጡ ምልክት ተደርጎባቸዋል።', or: 'Mi\'oota {total} irraa {packed} qofa akka sa\'aman mallatteeffameera.' },
        unpackedMarkedMissing: { en: '⚠️ Unpacked items will be marked as "Missing" or "Backordered".', am: '⚠️ ያልተሸጡ ዕቃዎች እንደ "ጠፍቷል" ወይም "በትዕዛዝ" ምልክት ይደረጋቸዋል።', or: '⚠️ Mi\'ootni hin sa\'amne "Hinqabne" yookaan "Ajaja Keessa" jechuun mallatteeffamu.' },
        goBack: { en: 'Go Back', am: 'ተመለስ', or: 'Deebi\'i' },

        // Missing Ice Packs Modal
        missingIcePacks: { en: 'Missing Ice Packs', am: 'የበረዶ አሰር አልተገኘም', or: 'Akkorii Qorichoo Hin Argamne' },
        coldItemsDetected: { en: 'Cold items detected', am: 'የቅዝቃዜ ዕቃዎች ተገኝተዋል', or: 'Mi\'oota Qabaa Argame' },
        orderContainsColdItems: { en: 'This order contains cold items but ice packs have not been added.', am: 'ይህ ትዕዛዝ የቅዝቃዜ ዕቃዎች ይዟል ነገር ግን የበረዶ አሰር አልተጨመረም።', or: 'Ajajiin kun mi\'oota qabaa qaba garuu akkorii qorichoo hin ida\'amne.' },
        continueAnyway: { en: 'Do you want to continue anyway?', am: 'ሆኖም መቀጠል ይፈልጋሉ?', or: 'Ammas itti fufuu barbaaddanii?' },

        // Missing Protective Materials Modal
        missingProtectiveMaterials: { en: 'Missing Protective Materials', am: 'የመከላከያ ቁሳቁሶች አልተገኙም', or: 'Odeeffannoo Ittisaan Hin Argamne' },
        fragileItemsDetected: { en: 'Fragile items detected', am: 'የሚሰባበሩ ዕቃዎች ተገኝተዋል', or: 'Mi\'oota Rakkisaa Argame' },
        orderContainsFragileItems: { en: 'This order contains fragile items but no protective materials (bubble wrap or air pillows) have been selected.', am: 'ይህ ትዕዛዝ የሚሰባበሩ ዕቃዎች ይዟል ነገር ግን የመከላከያ ቁሳቁሶች (ቡብል ራፕ ወይም አየር ማረፊያዎች) አልተመረጡም።', or: 'Ajajiin kun mi\'oota rakkisaa qaba garuu odeeffannoon ittisaan (haguugoo bubbulaa yookaan rakkisaa hawaa) hin filatamne.' },

        // Bulk Distribution Modal
        bulkDistributionTitle: { en: 'Bulk Distribution', am: 'ጅምላ ስርጭት', or: 'Qo\'annoo Gurguddoo' },
        multiStoreDistribution: { en: 'Multi-Store Distribution', am: 'የብዙ መደብር ስርጭት', or: 'Qo\'annoo Dukaanoota Hedduu' },
        distributeToMultipleStores: { en: 'Distribute products to multiple stores at once. System will create separate transfers for each destination.', am: 'ምርቶችን ወደ ብዙ መደብሮች በአንድ ጊዜ ይሰራጩ። ስርዓቱ ለእያንዳንዱ መድረሻ ለየብቻ ማስተላለፎችን ይፈጥራል።', or: 'Oomishaalee gara dukaanoota hedduu yeroo tokkotti qo\'anni. Siistemiin dabarsuu adda addaa bakka hundaaf uuma.' },
        distributionMode: { en: 'Distribution Mode', am: 'የስርጭት ሁነት', or: 'Hayyama Qo\'annoo' },
        singleProduct: { en: 'Single Product', am: 'አንድ ምርት', or: 'Oomisha Tokko' },
        waveDistribution: { en: 'Wave Distribution', am: 'የሞገድ ስርጭት', or: 'Qo\'annoo Malkaa' },
        selectSourceWarehouse: { en: 'Select Source Warehouse', am: 'የመነሻ መጋዘን ይምረጡ', or: 'Magaalaa Eegduu Fili' },
        selectProduct: { en: 'Select Product', am: 'ምርት ይምረጡ', or: 'Oomisha Fili' },
        removeAllocation: { en: 'Remove Allocation', am: 'መመደብ አስወግድ', or: 'Ramaddii Haqi' },
        selectProductToAdd: { en: 'Select Product to Add', am: 'ለመጨመር ምርት ይምረጡ', or: 'Ida\'uuf Oomisha Fili' },
        removeProduct: { en: 'Remove Product', am: 'ምርት አስወግድ', or: 'Oomisha Balleessi' },
        waveAllocationQuantity: { en: 'Wave Allocation Quantity', am: 'የሞገድ መመደብ ብዛት', or: 'Baay\'ina Ramaddii Malkaa' },

        // Return Processing
        returnProcessedSuccessfully: { en: 'Return Processed Successfully', am: 'ምላሽ በተሳካ ሁኔታ ተካሂዷል', or: 'Deebiin Milkaa\'inaan Adeemameera' },
        rmaGenerated: { en: 'RMA #{rma} has been generated.', am: 'RMA #{rma} ተፈጥሯል።', or: 'RMA #{rma} uumameera.' },
        printReceiptButton: { en: 'Print Receipt', am: 'ደረሰኝ አትም', or: 'Nagahee Maxxansi' },
        printingReceipt: { en: 'Printing receipt...', am: 'ደረሰኝ በመትም ላይ...', or: 'Nagahee maxxansaa jira...' },
        newReturn: { en: 'New Return', am: 'አዲስ ምላሽ', or: 'Deebii Haaraa' },
        processRefund: { en: 'Process Refund', am: 'የመመለስ ክፍያ ሂደት', or: 'Kaffaltii Deebisuu Adeemsi' },
        backToSelection: { en: 'Back to Selection', am: 'ወደ ምርጫ ተመለስ', or: 'Gara Filannoo Deebi\'i' },

        // Waste Section
        wasteQuantity: { en: 'Waste Quantity', am: 'የብክነት ብዛት', or: 'Baay\'ina Balleessa' },
        selectReason: { en: 'Select Reason', am: 'ምክንያት ይምረጡ', or: 'Sababa Fili' },
        describeDamage: { en: 'Describe damage...', am: 'የጉዳቱን ይግለጹ...', or: 'Balleessaa ibsi...' },

        // Return Section
        orderID: { en: 'Order ID (e.g. ORD-12345)', am: 'የትዕዛዝ መለያ (ለምሳሌ ORD-12345)', or: 'Eenyummaa Ajajaa (fakkeenyaaf ORD-12345)' },
        selectItem: { en: 'Select Item', am: 'ዕቃ ይምረጡ', or: 'Mi\'a Fili' },
        returnQuantity: { en: 'Return Quantity', am: 'የምላሽ ብዛት', or: 'Baay\'ina Deebii' },
        returnReason: { en: 'Return Reason', am: 'የምላሽ ምክንያት', or: 'Sababa Deebii' },
        returnCondition: { en: 'Return Condition', am: 'የምላሽ ሁኔታ', or: 'Haala Deebii' },
        returnAction: { en: 'Return Action', am: 'የምላሽ ተግባር', or: 'Gocha Deebii' },

        // Reprint Pack Label
        reprintPackLabel: { en: 'Reprint Pack Label', am: 'የማሸጊያ መለያ እንደገና አትም', or: 'Mallattoo Saamuu Irra Deebi\'ii Maxxansi' },
        orderColon: { en: 'Order:', am: 'ትዕዛዝ:', or: 'Ajaja:' },
        labelSize: { en: 'Label Size', am: 'የመለያ መጠን', or: 'Hanga Mallattoo' },
        codeFormat: { en: 'Code Format', am: 'የኮድ ቅርጸት', or: 'Qaama Koodii' },
        generating: { en: 'Generating...', am: 'በመፍጠር ላይ...', or: 'Uumaa jira...' },
        printLabel: { en: 'Print Label', am: 'መለያ አትም', or: 'Mallattoo Maxxansi' },

        // Location Input Placeholders
        zonePlaceholder: { en: 'Zone (A)', am: 'ዞን (A)', or: 'Zoonii (A)' },
        aislePlaceholder: { en: 'Aisle (01)', am: 'መተላለፊያ (01)', or: 'Dabarbii (01)' },
        binRangePlaceholder: { en: 'Bin Range (01-10)', am: 'የሳጥን ክልል (01-10)', or: 'Bitaraa Kuusaa (01-10)' },

        // Other Common Strings
        stock: { en: 'Stock', am: 'አቅም', or: 'Kuusaa' },
        qty: { en: 'Qty', am: 'ብዛት', or: 'Baay\'ina' },
        noDetailedItemList: { en: 'No detailed item list available', am: 'ዝርዝር የዕቃ ዝርዝር አልተገኘም', or: 'Tarree mi\'aa bal\'aa hin argamne' },
        invalidLocationFormat: { en: 'Invalid location format. Expected: A-01-01', am: 'የማያገለግል የቦታ ቅርጸት። የሚጠበቀው: A-01-01', or: 'Qaama bakkaa hin fayyadne. Eegamu: A-01-01' },
        scanLocationBarcodeQR: { en: 'Scan Location Barcode/QR', am: 'የቦታ ባርኮድ/QR ስካን', or: 'Baarkoodii/QR Bakkaa Iskaani' },
        scanProductBarcodeQR: { en: 'Scan Product Barcode/QR', am: 'የምርት ባርኮድ/QR ስካን', or: 'Baarkoodii/QR Oomishaa Iskaani' },
        positionLocationBarcode: { en: 'Position the location barcode within the frame', am: 'የቦታውን ባርኮድ በፍሬም ውስጥ ያስቀምጡ', or: 'Baarkoodii bakkaa keessatti feeramii galchi' },
        positionProductBarcode: { en: 'Position the product barcode within the frame', am: 'የምርቱን ባርኮድ በፍሬም ውስጥ ያስቀምጡ', or: 'Baarkoodii oomishaa keessatti feeramii galchi' },
    },
    posCommand: {
        // POS Command Center
        title: { en: 'POS Command Center', am: 'የPOS ትዕዛዝ ማዕከል', or: 'Wiirtuu Ajaja POS' },
        receivingQueue: { en: 'Receiving Queue', am: 'የመቀበያ ወረፋ', or: 'Tarree Fudhannaa' },
        pendingOrders: { en: 'Pending Orders', am: 'በመጠባበቅ ላይ ያሉ ትዕዛዞች', or: 'Ajajoota Eegaa jiran' },
        receive: { en: 'Receive', am: 'ተቀበል', or: 'Fudhadhu' },
        items: { en: 'items', am: 'ዕቃዎች', or: 'mi\'oota' },
    },
    inventory: {
        // Inventory Page
        title: { en: 'Inventory Management', am: 'የእቃ አስተዳደር', or: 'Bulchiinsa Meeshaalee' },
        products: { en: 'Products', am: 'ምርቶች', or: 'Oomishaalee' },
        categories: { en: 'Categories', am: 'ምድቦች', or: 'Ramaddilee' },
        lowStock: { en: 'Low Stock', am: 'ዝቅተኛ አቅም', or: 'Kuusaa Xiqqaa' },
        outOfStock: { en: 'Out of Stock', am: 'ከአቅም ውጪ', or: 'Kuusaa Dhabee' },
        addProduct: { en: 'Add Product', am: 'ምርት ጨምር', or: 'Oomisha Ida\'i' },
        stockLevel: { en: 'Stock Level', am: 'የአቅም ደረጃ', or: 'Sadarkaa Kuusaa' },
        reorderPoint: { en: 'Reorder Point', am: 'እንደገና የማዘዣ ነጥብ', or: 'Qabxii Irra Deebi\'ii Ajajuu' },
        category: { en: 'Category', am: 'ምድብ', or: 'Ramaddii' },
        inStock: { en: 'In Stock', am: 'በአቅም ውስጥ', or: 'Kuusaa keessa' },
        actions: { en: 'Actions', am: 'ድርጊቶች', or: 'Gocha' },
    }
};
