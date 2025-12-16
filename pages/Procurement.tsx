import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Truck, Plus, Search, Filter, Download, Star, Clock, Package, CheckCircle,
    XCircle, AlertCircle, Trash2, Printer, Lock, DollarSign, Calendar, FileText,
    User, Building, Wheat, ShoppingBag, UploadCloud, Globe, Anchor, CreditCard,
    MapPin, PieChart as PieIcon, TrendingUp, ArrowRight, ChevronRight, Send,
    ClipboardList, ThumbsUp, Mail, Phone, ExternalLink, Check, X, Edit3
} from 'lucide-react';
import { generatePOId } from '../utils/idGenerator';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { CURRENCY_SYMBOL } from '../constants';
import { PurchaseOrder, Supplier, POItem, SupplierType, Product } from '../types';
import Modal from '../components/Modal';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { Protected, ProtectedButton } from '../components/Protected';

// --- COMPREHENSIVE CATEGORIES (EXPANDED) ---
const GROCERY_CATEGORIES = {
    'Fresh Produce': ['Fruits', 'Vegetables', 'Herbs & Spices', 'Organic Produce', 'Salad Mixes', 'Exotic Fruits'],
    'Meat & Seafood': ['Fresh Meat', 'Poultry', 'Seafood', 'Deli Meats', 'Frozen Meat', 'Sausages & Bacon'],
    'Dairy & Eggs': ['Milk', 'Cheese', 'Yogurt', 'Butter & Margarine', 'Eggs', 'Cream', 'Plant-Based Dairy'],
    'Bakery': ['Bread', 'Pastries', 'Cakes', 'Cookies', 'Donuts', 'Tortillas & Wraps', 'Buns & Rolls'],
    'Beverages': ['Soft Drinks', 'Juices', 'Water', 'Coffee & Tea', 'Energy Drinks', 'Alcohol', 'Sports Drinks'],
    'Pantry Staples': ['Rice & Grains', 'Pasta', 'Flour & Baking', 'Cooking Oil', 'Canned Goods', 'Sauces & Condiments', 'Spices & Seasonings', 'Jams & Spreads'],
    'Snacks & Sweets': ['Chips & Crisps', 'Chocolate', 'Candy', 'Nuts & Seeds', 'Popcorn', 'Biscuits', 'Crackers', 'Dried Fruit'],
    'Frozen Foods': ['Ice Cream', 'Frozen Vegetables', 'Frozen Meals', 'Frozen Pizza', 'Frozen Desserts', 'Frozen Fruit'],
    'Health & Wellness': ['Vitamins & Supplements', 'First Aid', 'Personal Care', 'Baby Products', 'Pharmacy', 'Sports Nutrition'],
    'Household': ['Cleaning Supplies', 'Paper Products', 'Laundry', 'Kitchen Supplies', 'Air Fresheners', 'Pest Control'],
    'Personal Care': ['Bath & Body', 'Hair Care', 'Oral Care', 'Cosmetics', 'Hygiene Products', 'Shaving & Grooming'],
    'Pet Supplies': ['Pet Food', 'Pet Treats', 'Pet Accessories', 'Pet Grooming'],
    'International Foods': ['Asian Foods', 'Mediterranean', 'Latin American', 'African Foods', 'Indian Foods', 'European Foods'],
    'Organic & Natural': ['Organic Produce', 'Natural Foods', 'Gluten-Free', 'Vegan Products', 'Superfoods'],
    'Baby & Kids': ['Baby Food', 'Diapers', 'Baby Care', 'Kids Snacks', 'Toys', 'Baby Gear'],
    'Office & Stationery': ['Office Supplies', 'School Supplies', 'Writing Materials', 'Paper', 'Ink & Toner', 'Office Furniture'],
    'Electronics': ['Phone Accessories', 'Batteries', 'Small Electronics', 'Computers', 'Peripherals', 'Cables & Chargers'],
    'Home & Garden': ['Gardening', 'Home Decor', 'Tools', 'Lighting', 'Hardware', 'Outdoor Living'],
    'Automotive': ['Car Care', 'Fluids', 'Accessories', 'Tools'],
    'Industrial': ['Safety Gear', 'Packaging Materials', 'Warehouse Supplies', 'Maintenance'],
    'Other': ['Miscellaneous', 'General Merchandise', 'Seasonal']
};

const COMMON_UNITS = [
    'piece', 'kg', 'g', 'liter', 'ml', 'box', 'pack', 'carton',
    'bag', 'bottle', 'can', 'jar', 'dozen', 'bundle', 'tray'
];

// ═══════════════════════════════════════════════════════════════
// CATEGORY-SPECIFIC ATTRIBUTES CONFIGURATION
// Defines which fields are relevant for each product category
// ═══════════════════════════════════════════════════════════════
type AttributeField = {
    key: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'date';
    placeholder?: string;
    options?: string[];
    required?: boolean;
};

const CATEGORY_ATTRIBUTES: Record<string, AttributeField[]> = {
    // PERISHABLES - Need temperature and expiry
    'Fresh Produce': [
        { key: 'origin', label: 'Origin', type: 'text', placeholder: 'Country/Region' },
        { key: 'tempReq', label: 'Temp', type: 'select', options: ['Ambient', 'Chilled (2-8°C)', 'Frozen (-18°C)'], required: true },
        { key: 'shelfLife', label: 'Shelf Life', type: 'text', placeholder: '7 days' },
    ],
    'Meat & Seafood': [
        { key: 'cutType', label: 'Cut/Type', type: 'text', placeholder: 'e.g., Fillet, Whole' },
        { key: 'tempReq', label: 'Temp', type: 'select', options: ['Chilled (2-8°C)', 'Frozen (-18°C)'], required: true },
        { key: 'shelfLife', label: 'Shelf Life', type: 'text', placeholder: '3 days' },
        { key: 'origin', label: 'Origin', type: 'text', placeholder: 'Country' },
    ],
    'Dairy & Eggs': [
        { key: 'fatContent', label: 'Fat %', type: 'text', placeholder: 'Full, Low, Skim' },
        { key: 'tempReq', label: 'Temp', type: 'select', options: ['Chilled (2-8°C)'], required: true },
        { key: 'shelfLife', label: 'Shelf Life', type: 'text', placeholder: '14 days' },
    ],
    'Bakery': [
        { key: 'freshness', label: 'Freshness', type: 'select', options: ['Fresh Daily', 'Packaged', 'Frozen'] },
        { key: 'shelfLife', label: 'Shelf Life', type: 'text', placeholder: '3 days' },
        { key: 'allergens', label: 'Allergens', type: 'text', placeholder: 'Gluten, Nuts...' },
    ],
    'Frozen Foods': [
        { key: 'tempReq', label: 'Temp', type: 'select', options: ['Frozen (-18°C)', 'Deep Frozen (-25°C)'], required: true },
        { key: 'cookTime', label: 'Cook Time', type: 'text', placeholder: '20 mins' },
    ],

    // BEVERAGES - Volume and container
    'Beverages': [
        { key: 'volume', label: 'Volume', type: 'text', placeholder: '500ml, 1L, 2L', required: true },
        { key: 'container', label: 'Container', type: 'select', options: ['Bottle', 'Can', 'Tetra', 'Carton', 'Keg'] },
        { key: 'flavor', label: 'Flavor', type: 'text', placeholder: 'Original, Lemon...' },
    ],

    // PANTRY - Less strict
    'Pantry Staples': [
        { key: 'weight', label: 'Weight', type: 'text', placeholder: '500g, 1kg' },
        { key: 'shelfLife', label: 'Shelf Life', type: 'text', placeholder: '1 year' },
    ],
    'Snacks & Sweets': [
        { key: 'weight', label: 'Weight', type: 'text', placeholder: '100g, 200g' },
        { key: 'flavor', label: 'Flavor', type: 'text', placeholder: 'Original, BBQ...' },
    ],

    // HEALTH & PERSONAL
    'Health & Wellness': [
        { key: 'strength', label: 'Strength', type: 'text', placeholder: '500mg, 1000IU' },
        { key: 'quantity', label: 'Count', type: 'text', placeholder: '30 tablets, 60 caps' },
        { key: 'expiry', label: 'Expiry', type: 'date' },
    ],
    'Personal Care': [
        { key: 'volume', label: 'Size', type: 'text', placeholder: '200ml, 100g' },
        { key: 'variant', label: 'Variant', type: 'text', placeholder: 'Sensitive, Normal...' },
    ],
    'Baby & Kids': [
        { key: 'ageRange', label: 'Age', type: 'text', placeholder: '0-6mo, 1-3yr' },
        { key: 'size', label: 'Size', type: 'text', placeholder: 'Small, Medium, Large' },
    ],

    // HOUSEHOLD
    'Household': [
        { key: 'volume', label: 'Size', type: 'text', placeholder: '500ml, 1L, 5L' },
        { key: 'scent', label: 'Scent', type: 'text', placeholder: 'Lemon, Lavender...' },
    ],
    'Pet Supplies': [
        { key: 'petType', label: 'Pet', type: 'select', options: ['Dog', 'Cat', 'Bird', 'Fish', 'Other'] },
        { key: 'weight', label: 'Weight', type: 'text', placeholder: '1kg, 5kg, 15kg' },
        { key: 'ageGroup', label: 'Age', type: 'select', options: ['Puppy/Kitten', 'Adult', 'Senior'] },
    ],

    // ELECTRONICS
    'Electronics': [
        { key: 'model', label: 'Model', type: 'text', placeholder: 'Model number', required: true },
        { key: 'warranty', label: 'Warranty', type: 'text', placeholder: '1 year, 2 years' },
        { key: 'voltage', label: 'Voltage', type: 'text', placeholder: '220V, USB...' },
    ],

    // OFFICE
    'Office & Stationery': [
        { key: 'quantity', label: 'Pack Size', type: 'text', placeholder: '500 sheets, 12 pens' },
        { key: 'color', label: 'Color', type: 'text', placeholder: 'Blue, Black, Multi' },
    ],

    // INDUSTRIAL
    'Industrial': [
        { key: 'material', label: 'Material', type: 'text', placeholder: 'Steel, Plastic...' },
        { key: 'dimensions', label: 'Dimensions', type: 'text', placeholder: 'LxWxH' },
        { key: 'weight', label: 'Weight', type: 'text', placeholder: '5kg, 10kg' },
    ],
    'Automotive': [
        { key: 'fitment', label: 'Fitment', type: 'text', placeholder: 'Universal, Toyota...' },
        { key: 'partNumber', label: 'Part #', type: 'text', placeholder: 'OEM number' },
    ],

    // DEFAULT - Minimal fields
    '_default': [
        { key: 'description', label: 'Description', type: 'text', placeholder: 'Additional details' },
    ],
};

// Helper function to get attributes for a category
const getCategoryAttributes = (category: string): AttributeField[] => {
    return CATEGORY_ATTRIBUTES[category] || CATEGORY_ATTRIBUTES['_default'];
};

// ═══════════════════════════════════════════════════════════════
// DESCRIPTION TEMPLATES - Common product descriptions by category
// ═══════════════════════════════════════════════════════════════
type DescriptionTemplate = {
    label: string;
    description: string;
};

const DESCRIPTION_TEMPLATES: Record<string, DescriptionTemplate[]> = {
    'Fresh Produce': [
        { label: '1kg Box', description: '1kg Fresh Box' },
        { label: '500g Pack', description: '500g Fresh Pack' },
        { label: '2kg Crate', description: '2kg Fresh Crate' },
        { label: '5kg Bulk', description: '5kg Bulk Box' },
        { label: 'Per Piece', description: 'Fresh – Per Piece' },
        { label: 'Bundle', description: 'Fresh Bundle' },
    ],
    'Meat & Seafood': [
        { label: '500g Chilled Tray', description: '500g Chilled Tray' },
        { label: '1kg Frozen Pack', description: '1kg Frozen Pack' },
        { label: '250g Fresh Portion', description: '250g Fresh Portion' },
        { label: '2kg Bulk Frozen', description: '2kg Bulk Frozen Box' },
        { label: 'Per kg', description: 'Fresh – Per kg' },
    ],
    'Dairy & Eggs': [
        { label: '1L Carton', description: '1L Chilled Carton' },
        { label: '500ml Bottle', description: '500ml Chilled Bottle' },
        { label: '2L Jug', description: '2L Chilled Jug' },
        { label: '250g Pack', description: '250g Pack' },
        { label: '12 Eggs Tray', description: 'Dozen Eggs – Tray' },
        { label: '30 Eggs Crate', description: '30 Eggs Crate' },
    ],
    'Bakery': [
        { label: 'Loaf', description: 'Fresh Loaf' },
        { label: '6-Pack', description: 'Pack of 6' },
        { label: '12-Pack', description: 'Pack of 12' },
        { label: 'Per Piece', description: 'Fresh – Per Piece' },
        { label: '500g Pack', description: '500g Packaged' },
    ],
    'Beverages': [
        { label: '500ml Bottle', description: '500ml Bottle' },
        { label: '330ml Can', description: '330ml Can' },
        { label: '1L Bottle', description: '1L Bottle' },
        { label: '1.5L Bottle', description: '1.5L Bottle' },
        { label: '2L Bottle', description: '2L Bottle' },
        { label: '6-Pack Cans', description: '330ml Can – Pack of 6' },
        { label: '12-Pack Cans', description: '330ml Can – Pack of 12' },
        { label: '24-Pack Bottles', description: '500ml Bottle – Pack of 24' },
        { label: '5L Gallon', description: '5L Gallon' },
        { label: '19L Dispenser', description: '19L Water Dispenser Bottle' },
    ],
    'Pantry Staples': [
        { label: '500g Pack', description: '500g Pack' },
        { label: '1kg Bag', description: '1kg Bag' },
        { label: '2kg Bag', description: '2kg Bag' },
        { label: '5kg Bag', description: '5kg Bag' },
        { label: '25kg Sack', description: '25kg Bulk Sack' },
        { label: '400g Can', description: '400g Can' },
        { label: '1L Bottle', description: '1L Bottle' },
        { label: '5L Jerrycan', description: '5L Jerrycan' },
    ],
    'Snacks & Sweets': [
        { label: '50g Pack', description: '50g Single Pack' },
        { label: '100g Pack', description: '100g Pack' },
        { label: '150g Pack', description: '150g Family Pack' },
        { label: '200g Pack', description: '200g Sharing Pack' },
        { label: '12-Pack Box', description: 'Box of 12' },
        { label: '24-Pack Box', description: 'Box of 24' },
        { label: '500g Tub', description: '500g Tub' },
    ],
    'Frozen Foods': [
        { label: '500g Pack Frozen', description: '500g Frozen Pack' },
        { label: '1kg Pack Frozen', description: '1kg Frozen Pack' },
        { label: '2kg Bulk Frozen', description: '2kg Frozen Bulk' },
        { label: '4-Pack Frozen', description: 'Frozen – Pack of 4' },
        { label: '6-Pack Frozen', description: 'Frozen – Pack of 6' },
    ],
    'Health & Wellness': [
        { label: '30 Tablets', description: '30 Tablets Bottle' },
        { label: '60 Capsules', description: '60 Capsules Bottle' },
        { label: '90 Tablets', description: '90 Tablets Bottle' },
        { label: '100ml Syrup', description: '100ml Syrup Bottle' },
        { label: '250ml Syrup', description: '250ml Syrup Bottle' },
        { label: 'First Aid Pack', description: 'First Aid Pack' },
    ],
    'Personal Care': [
        { label: '100ml', description: '100ml Bottle' },
        { label: '200ml', description: '200ml Bottle' },
        { label: '250ml', description: '250ml Bottle' },
        { label: '400ml', description: '400ml Bottle' },
        { label: '500ml', description: '500ml Bottle' },
        { label: '1L Refill', description: '1L Refill Pack' },
        { label: '100g Bar', description: '100g Bar' },
        { label: '3-Pack', description: 'Value Pack of 3' },
        { label: '6-Pack', description: 'Value Pack of 6' },
    ],
    'Household': [
        { label: '500ml Spray', description: '500ml Spray Bottle' },
        { label: '750ml', description: '750ml Bottle' },
        { label: '1L', description: '1L Bottle' },
        { label: '2L', description: '2L Bottle' },
        { label: '5L Bulk', description: '5L Bulk Container' },
        { label: '2-Pack Rolls', description: 'Paper Rolls – Pack of 2' },
        { label: '6-Pack Rolls', description: 'Paper Rolls – Pack of 6' },
        { label: '12-Pack Rolls', description: 'Paper Rolls – Pack of 12' },
    ],
    'Pet Supplies': [
        { label: '1kg Bag', description: '1kg Bag' },
        { label: '3kg Bag', description: '3kg Bag' },
        { label: '7kg Bag', description: '7kg Bag' },
        { label: '15kg Bag', description: '15kg Bag' },
        { label: '100g Treats', description: '100g Treats Pack' },
        { label: '12-Pack Cans', description: 'Wet Food – 12 Cans' },
    ],
    'Electronics': [
        { label: 'Single Unit', description: 'Single Unit – Boxed' },
        { label: '2-Pack', description: 'Pack of 2' },
        { label: '4-Pack', description: 'Pack of 4' },
        { label: '1 Meter Cable', description: '1m Cable' },
        { label: '2 Meter Cable', description: '2m Cable' },
        { label: '4-Pack Batteries', description: 'Batteries – Pack of 4' },
        { label: '8-Pack Batteries', description: 'Batteries – Pack of 8' },
    ],
    'Office & Stationery': [
        { label: 'Single', description: 'Single Piece' },
        { label: '12-Pack', description: 'Pack of 12' },
        { label: '24-Pack', description: 'Pack of 24' },
        { label: '50-Pack', description: 'Pack of 50' },
        { label: '500 Sheets', description: '500 Sheets Ream' },
        { label: '5-Ream Box', description: '5 Reams Box (2500 Sheets)' },
    ],
    'Industrial': [
        { label: 'Single Unit', description: 'Single Unit' },
        { label: '10-Pack', description: 'Pack of 10' },
        { label: '25-Pack', description: 'Pack of 25' },
        { label: '50-Pack', description: 'Pack of 50' },
        { label: '100-Pack Box', description: 'Box of 100' },
        { label: '5kg', description: '5kg' },
        { label: '20kg', description: '20kg' },
    ],
    '_default': [
        { label: 'Single Unit', description: 'Single Unit' },
        { label: 'Pack', description: 'Pack' },
        { label: 'Box', description: 'Box' },
        { label: 'Carton', description: 'Carton' },
        { label: 'Bulk', description: 'Bulk' },
    ],
};

// Helper to get description templates
const getDescriptionTemplates = (category: string): DescriptionTemplate[] => {
    return DESCRIPTION_TEMPLATES[category] || DESCRIPTION_TEMPLATES['_default'];
};

// Valid site types for PO destinations (WAREHOUSES ONLY - Stores use Internal Transfers)
const PO_DESTINATION_SITE_TYPES = ['Warehouse', 'Distribution Center'] as const;


type Tab = 'overview' | 'requests' | 'orders' | 'suppliers';
type FilterStatus = 'All' | 'Pending' | 'Received' | 'Cancelled';
type POStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Ordered' | 'Received' | 'Partially Received';
type DateRangeOption = 'All Time' | 'This Month' | 'Last Month' | 'This Quarter' | 'This Year' | 'Last Year';

// --- CHART CONFIG ---
const COLORS = ['#00ff9d', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function Procurement() {
    const { user } = useStore();
    const {
        allOrders, suppliers, products, createPO, updatePO, addSupplier, deletePO, activeSite, sites, addNotification, addProduct
    } = useData();
    // --- REPORT GENERATOR ---
    const { generateQuarterlyReport } = require('../utils/reportGenerator');

    // Use allOrders but rename to orders for consistency in the rest of the component
    const orders = allOrders;

    const [activeTab, setActiveTab] = useState<Tab>('overview');

    // Filter & Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('All');

    // State for Modals
    const [isCreatePOOpen, setIsCreatePOOpen] = useState(false);
    const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [isProductCatalogOpen, setIsProductCatalogOpen] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);

    // Bulk Selection State (for Super Admin)
    const [selectedPOIds, setSelectedPOIds] = useState<string[]>([]);
    const [isBulkApproving, setIsBulkApproving] = useState(false);

    // Create PO State - FLEXIBLE VENDOR ENTRY
    const [isManualVendor, setIsManualVendor] = useState(false);
    const [manualVendorName, setManualVendorName] = useState('');
    const [manualVendorContact, setManualVendorContact] = useState('');
    const [manualVendorPhone, setManualVendorPhone] = useState('');
    const [newPOSupplier, setNewPOSupplier] = useState('');
    const [newPOItems, setNewPOItems] = useState<POItem[]>([]);
    const [currentProductToAdd, setCurrentProductToAdd] = useState('');
    const [isRequestMode, setIsRequestMode] = useState(false);

    // Flexible Item Entry State - CATEGORY-BASED
    const [isCustomItem, setIsCustomItem] = useState(true);
    const [customItemName, setCustomItemName] = useState('');
    const [selectedMainCategory, setSelectedMainCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [customItemBrand, setCustomItemBrand] = useState('');
    const [customItemSize, setCustomItemSize] = useState(''); // NEW: Size/Weight/Volume (e.g., 500ml, 2kg)
    const [customItemSpecs, setCustomItemSpecs] = useState('');
    const [customItemUnit, setCustomItemUnit] = useState('');

    // PO Financials & Terms (ALL OPTIONAL)
    const [currentQty, setCurrentQty] = useState(0);
    const [currentCost, setCurrentCost] = useState(0);
    const [shippingCost, setShippingCost] = useState(0);
    const [taxRate, setTaxRate] = useState(0);
    const [discountRate, setDiscountRate] = useState(0);
    const [poCurrency, setPoCurrency] = useState(CURRENCY_SYMBOL);
    const [poNotes, setPoNotes] = useState('');
    const [expectedDate, setExpectedDate] = useState('');

    // Enterprise Fields (OPTIONAL)
    const [paymentTerms, setPaymentTerms] = useState('');
    const [incoterms, setIncoterms] = useState('');
    const [destinationSiteIds, setDestinationSiteIds] = useState<string[]>([]); // CHANGED: Array for multi-site
    const [isMultiSiteMode, setIsMultiSiteMode] = useState(false);
    const [quantityDistribution, setQuantityDistribution] = useState<'shared' | 'per-store'>('per-store'); // NEW: How to distribute quantities

    // Dynamic Category Attributes (for custom items)
    const [itemAttributes, setItemAttributes] = useState<Record<string, string>>({});

    // Selected description template
    const [selectedDescTemplate, setSelectedDescTemplate] = useState('');

    // Pack quantity (e.g., "Pack of 8" - how many single items are in the box)
    const [packQuantity, setPackQuantity] = useState(0);

    // File Input Ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Helper function to get valid PO destination sites (WAREHOUSES ONLY - sorted by type then name)
    const getValidPODestinationSites = () => {
        return sites
            .sort((a, b) => {
                // Sort by type first (Warehouse, then Distribution Center)
                const typeOrder = { 'Warehouse': 1, 'Distribution Center': 2 };
                const typeCompare = (typeOrder[a.type as keyof typeof typeOrder] || 99) - (typeOrder[b.type as keyof typeof typeOrder] || 99);
                if (typeCompare !== 0) return typeCompare;
                // Then sort by name
                return a.name.localeCompare(b.name);
            });
    };

    // --- DATE FILTERING STATE ---
    const [dateRange, setDateRange] = useState<DateRangeOption>('This Quarter');

    // --- DATE FILTERING LOGIC ---
    const getQuarterInfo = (d = new Date()) => {
        const q = Math.floor(d.getMonth() / 3) + 1;
        const year = d.getFullYear();
        const start = new Date(year, (q - 1) * 3, 1);
        const end = new Date(year, q * 3, 0);
        return { q, year, start, end };
    };

    const getDateRangeLabels = () => {
        const { q, year, start, end } = getQuarterInfo();

        switch (dateRange) {
            case 'This Month':
                return `Current Month (${new Date().toLocaleDateString('default', { month: 'short' })})`;
            case 'Last Month':
                return `Previous Month`;
            case 'This Quarter':
                return `Q${q} ${year} (${start.toLocaleDateString(undefined, { month: 'short' })} - ${end.toLocaleDateString(undefined, { month: 'short' })})`;
            case 'This Year':
                return `FY ${year}`;
            case 'Last Year':
                return `FY ${year - 1}`;
            case 'All Time':
            default:
                return "All Available Data";
        }
    };

    // Fiscal Progress
    const getQuarterProgress = () => {
        const now = new Date();
        if (dateRange !== 'This Quarter') return 0;
        const { start, end } = getQuarterInfo(now);
        const totalDays = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
        const daysPassed = (now.getTime() - start.getTime()) / (1000 * 3600 * 24);
        return Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
    };


    // Filtering Helper
    const isWithinRange = (dateString: string) => {
        if (dateRange === 'All Time') return true;
        const date = new Date(dateString);
        const now = new Date();
        const { q, year } = getQuarterInfo(now);
        const start = new Date();

        // Reset
        start.setHours(0, 0, 0, 0);

        switch (dateRange) {
            case 'This Month':
                start.setDate(1);
                return date >= start && date <= now;
            case 'Last Month':
                start.setMonth(now.getMonth() - 1);
                start.setDate(1);
                const endLM = new Date(now.getFullYear(), now.getMonth(), 0);
                return date >= start && date <= endLM;
            case 'This Quarter':
                const qStart = new Date(year, (q - 1) * 3, 1);
                const qEnd = new Date(now);
                qEnd.setHours(23, 59, 59, 999);
                return date >= qStart && date <= qEnd;
            case 'This Year':
                const yStart = new Date(year, 0, 1);
                return date >= yStart;
            case 'Last Year':
                const lyStart = new Date(year - 1, 0, 1);
                const lyEnd = new Date(year - 1, 11, 31);
                return date >= lyStart && date <= lyEnd;
            default:
                return true;
        }
    };


    // Add Supplier State
    const [newSupType, setNewSupType] = useState<SupplierType>('Business');
    const [newSupName, setNewSupName] = useState('');
    const [newSupEmail, setNewSupEmail] = useState('');
    const [newSupPhone, setNewSupPhone] = useState('');
    const [newSupCategory, setNewSupCategory] = useState('');
    const [newSupID, setNewSupID] = useState('');
    const [newSupLocation, setNewSupLocation] = useState('');

    // Modal State for Confirmations
    const [isDeletePOModalOpen, setIsDeletePOModalOpen] = useState(false);
    const [poToDelete, setPoToDelete] = useState<PurchaseOrder | null>(null);
    const [deleteInput, setDeleteInput] = useState('');

    const [isRejectPOModalOpen, setIsRejectPOModalOpen] = useState(false);
    const [poToReject, setPoToReject] = useState<PurchaseOrder | null>(null);

    const [isBulkApproveModalOpen, setIsBulkApproveModalOpen] = useState(false);

    // ACCESS CONTROL
    const canEdit = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'manager';
    const canApprove = user?.role === 'super_admin' || user?.role === 'admin';
    const canReceive = user?.role === 'admin' || user?.role === 'warehouse_manager' || user?.role === 'dispatcher' || user?.role === 'super_admin';

    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === id
                ? 'bg-cyber-primary text-black shadow-[0_0_15px_rgba(0,255,157,0.3)] font-bold'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
        >
            <Icon size={16} />
            <span>{label}</span>
        </button>
    );

    // --- ANALYTICS DATA ---
    const metrics = useMemo(() => {
        const dateFilteredOrders = orders.filter(po => isWithinRange(po.date || new Date().toISOString()));

        const totalSpend = dateFilteredOrders.reduce((sum, o) => sum + (o.status !== 'Cancelled' ? o.totalAmount : 0), 0);
        const openPO = dateFilteredOrders.filter(o => o.status === 'Pending').length;
        const pendingValue = dateFilteredOrders.filter(o => o.status === 'Pending').reduce((sum, o) => sum + o.totalAmount, 0);

        // Spend by Category (Mocked via Supplier Category)
        const categorySpend: Record<string, number> = {};
        dateFilteredOrders.forEach(o => {
            const sup = suppliers.find(s => s.id === o.supplierId);
            const cat = sup?.category || 'General';
            categorySpend[cat] = (categorySpend[cat] || 0) + o.totalAmount;
        });
        const categoryData = Object.keys(categorySpend).map(k => ({ name: k, value: categorySpend[k] }));

        // Spend Trend (Mocked)
        const trendData = [
            { name: 'Jan', spend: totalSpend * 0.1 },
            { name: 'Feb', spend: totalSpend * 0.15 },
            { name: 'Mar', spend: totalSpend * 0.12 },
            { name: 'Apr', spend: totalSpend * 0.25 },
            { name: 'May', spend: totalSpend * 0.2 },
            { name: 'Jun', spend: totalSpend * 0.18 },
        ];

        return { totalSpend, openPO, pendingValue, categoryData, trendData };
    }, [orders, suppliers]);

    // --- FILTERING LOGIC ---
    const filteredOrders = orders.filter(po => {
        const poNumber = (po.po_number || po.poNumber || po.id).toLowerCase();
        const matchesSearch =
            poNumber.includes(searchTerm.toLowerCase()) ||
            po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (po.destination && po.destination.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesFilter = statusFilter === 'All' || po.status === statusFilter;

        // Multi-store filtering: Super admin sees all, others see only their site's POs
        const matchesSite = user?.role === 'super_admin' || !activeSite || po.siteId === activeSite.id;

        return matchesSearch && matchesFilter && matchesSite;
    });


    const activePurchaseOrders = filteredOrders.filter(o => !o.notes?.includes('[PR]'));

    const cycleFilter = () => {
        const states: FilterStatus[] = ['All', 'Pending', 'Received', 'Cancelled'];
        const currentIndex = states.indexOf(statusFilter);
        setStatusFilter(states[(currentIndex + 1) % states.length]);
    };



    const handleGenerateReport = () => {
        const reportMetrics = {
            totalSpend: metrics.totalSpend,
            openPO: metrics.openPO,
            pendingValue: metrics.pendingValue,
        };
        generateQuarterlyReport(reportMetrics, getDateRangeLabels(), 'Procurement');
    };

    // --- EFFECTS ---

    useEffect(() => {
        window.scrollTo(0, 0);
        console.log("Procurement Component Mounted - VERSION CHECK v2");
    }, []);
    useEffect(() => {
        if (newPOSupplier) {
            const supplier = suppliers.find(s => s.id === newPOSupplier);
            if (supplier) {
                const date = new Date();
                date.setDate(date.getDate() + (supplier.leadTime || 3));
                setExpectedDate(date.toISOString().split('T')[0]);

                if (supplier.type === 'Farmer' || supplier.type === 'One-Time') {
                    setTaxRate(0);
                    setPaymentTerms('Cash on Delivery');
                } else {
                    setTaxRate(15);
                    setPaymentTerms('Net 30');
                }
            }
        }
    }, [newPOSupplier, suppliers]);

    useEffect(() => {
        if (currentProductToAdd && !isCustomItem) {
            const product = products.find(p => p.id === currentProductToAdd);
            if (product) {
                setCurrentCost(product.costPrice || product.price * 0.7);
            }
        }
    }, [currentProductToAdd, products, isCustomItem]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- HANDLERS ---

    const handleCreatePO = async () => {
        // Prevent double submit
        if (isSubmitting) return;

        // Only items are required, everything else is optional
        if (newPOItems.length === 0) {
            addNotification('alert', "Please add at least one item to the order.");
            return;
        }

        // VALIDATION: Destination Site is COMPULSORY
        if (destinationSiteIds.length === 0) {
            addNotification('alert', "Please select at least one Destination Site.");
            return;
        }

        setIsSubmitting(true);

        try {
            // Get vendor name - either from dropdown, manual entry, or leave blank
            let vendorName = 'Unspecified Vendor';
            let vendorId = 'UNSPECIFIED';

            if (isManualVendor) {
                if (manualVendorName.trim()) {
                    vendorName = manualVendorName;
                    vendorId = `MANUAL-${Date.now()}`;
                }
            } else {
                if (newPOSupplier) {
                    const supplier = suppliers.find(s => s.id === newPOSupplier);
                    vendorName = supplier?.name || 'Unknown';
                    vendorId = newPOSupplier;
                }
            }

            const itemsTotal = newPOItems.reduce((sum, item) => sum + item.totalCost, 0);
            const taxAmount = itemsTotal * (taxRate / 100);
            const discountAmount = itemsTotal * (discountRate / 100);
            const totalAmount = itemsTotal + taxAmount + shippingCost - discountAmount;
            const totalItems = newPOItems.reduce((sum, item) => sum + item.quantity, 0);

            const finalNotes = isRequestMode && poNotes.trim() ? `[PR] ${poNotes}` : poNotes;
            let successfulPOs = 0;

            // Loop through each selected destination site and create a PO
            for (const siteId of destinationSiteIds) {
                const destSite = sites.find(s => s.id === siteId);
                const destination = destSite?.name || 'Unknown Location';

                const newPO: PurchaseOrder = {
                    id: crypto.randomUUID(),
                    poNumber: generatePOId(),
                    siteId: siteId,
                    supplierId: vendorId,
                    supplierName: vendorName,
                    date: new Date().toLocaleDateString('en-CA'),
                    status: 'Draft', // Always create as Draft
                    totalAmount,
                    itemsCount: totalItems,
                    expectedDelivery: expectedDate || new Date(Date.now() + 86400000 * 7).toLocaleDateString('en-CA'),
                    lineItems: newPOItems, // Send full items to each site
                    shippingCost: shippingCost || 0,
                    taxAmount: taxAmount || 0,
                    notes: finalNotes,
                    paymentTerms: paymentTerms || 'To be determined',
                    incoterms: incoterms || 'N/A',
                    destination: destination,
                    discount: discountAmount || 0,
                    createdBy: user?.name || 'Unknown'
                };

                await createPO(newPO);
                successfulPOs++;
            }

            // Close modal and reset
            setIsCreatePOOpen(false);

            // Wait a moment for notifications to clear
            setTimeout(() => {
                if (successfulPOs === 1) {
                    addNotification('success', `Purchase Order created successfully for 1 site (Draft mode)`);
                } else {
                    addNotification('success', `Purchase Orders created successfully for ${successfulPOs} sites (Draft mode)`);
                }
            }, 500);

            // Clean up state
            setNewPOItems([]);
            setPoNotes('');
            setDestinationSiteIds([]);
            setIsManualVendor(false);
            setManualVendorName('');
            setNewPOSupplier('');
            setIsRequestMode(false);

        } catch (error) {
            console.error(error);
            addNotification('alert', "Failed to create Purchase Order(s). Please try again.");
        } finally {
            setIsSubmitting(false);
        }
        resetPOForm();
    };

    const resetPOForm = () => {
        setNewPOSupplier('');
        setIsManualVendor(false);
        setManualVendorName('');
        setManualVendorContact('');
        setManualVendorPhone('');
        setNewPOItems([]);
        setShippingCost(0);
        setPoNotes('');
        setPoCurrency(CURRENCY_SYMBOL);
        setDiscountRate(0);
        setTaxRate(0);
        setPaymentTerms('');
        setIncoterms('');
        // Reset to default site (current site or first warehouse)
        const defaultSite = activeSite?.id || sites.find(s => s.type === 'Warehouse' || s.type === 'Distribution Center')?.id || sites[0]?.id;
        setDestinationSiteIds(defaultSite ? [defaultSite] : []);
        setIsMultiSiteMode(false); // Reset to single-site mode
        setExpectedDate('');
        setIsCustomItem(true);
        setQuantityDistribution('per-store'); // Reset to default
    };



    const addItemToPO = async () => {
        // ═══════════════════════════════════════════════════════════════
        // ROBUST ITEM VALIDATION - Comprehensive Checks
        // ═══════════════════════════════════════════════════════════════

        // 1. QUANTITY VALIDATION
        if (!currentQty || currentQty <= 0) {
            addNotification('alert', "Please enter a valid quantity (must be greater than 0).");
            return;
        }
        if (currentQty > 999999) {
            addNotification('alert', "Quantity exceeds maximum limit (999,999 units).");
            return;
        }
        if (!Number.isInteger(currentQty)) {
            addNotification('alert', "Quantity must be a whole number.");
            return;
        }

        // 2. PRICE VALIDATION
        if (currentCost === undefined || currentCost === null || currentCost < 0) {
            addNotification('alert', "Please enter a valid unit price (cannot be negative).");
            return;
        }
        if (currentCost > 99999999) {
            addNotification('alert', "Unit price exceeds maximum limit.");
            return;
        }
        // Allow zero price for samples/promos but warn
        if (currentCost === 0) {
            const confirmZero = window.confirm("Unit price is 0. This item will be free. Continue?");
            if (!confirmZero) return;
        }

        // 3. PRODUCT/CATEGORY VALIDATION
        let productId = '';
        let productName = '';

        if (isCustomItem) {
            // Custom item validation
            if (!selectedMainCategory && !customItemName) {
                addNotification('alert', "Please select a category or enter an item name.");
                return;
            }

            // ═══════════════════════════════════════════════════════════════
            // SIMPLIFIED PRODUCT NAME GENERATOR
            // Format: "[Brand] [Item Name] [Size][Unit] – Pack of X"
            // Example: "Coca-Cola Milk 1L – Pack of 8"
            // Example: "Nestle Water 500ml – Pack of 24"
            // ═══════════════════════════════════════════════════════════════

            const nameParts: string[] = [];

            // 1. BRAND (if provided) - goes first
            if (customItemBrand?.trim()) {
                nameParts.push(customItemBrand.trim());
            }

            // 2. ITEM NAME (or category as fallback)
            if (customItemName?.trim()) {
                nameParts.push(customItemName.trim());
            } else if (selectedMainCategory) {
                nameParts.push(selectedMainCategory);
            }

            // 3. SIZE + UNIT (e.g., "1L", "500ml", "2kg")
            if (customItemSize?.trim() && customItemUnit) {
                nameParts.push(`${customItemSize.trim()}${customItemUnit}`);
            } else if (customItemSize?.trim()) {
                nameParts.push(customItemSize.trim());
            } else if (customItemUnit) {
                nameParts.push(customItemUnit);
            }

            // Build base name
            let finalName = nameParts.join(' ');

            // 4. PACK QUANTITY (e.g., "– Pack of 8")
            if (packQuantity > 1) {
                finalName += ` – Pack of ${packQuantity}`;
            }

            productName = finalName || 'Unnamed Item';

            // Validate name length
            if (productName.length > 200) {
                addNotification('alert', "Item name is too long. Please shorten it.");
                return;
            }

            // Generate SKU
            const categoryPrefix = selectedMainCategory
                ? selectedMainCategory.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
                : 'GEN';
            const timestamp = Date.now().toString().slice(-6);
            const newSku = `${categoryPrefix}-${timestamp}`;

            // Use CUSTOM prefix to identify custom items
            productId = `CUSTOM-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

            // Optionally auto-create product in catalog (only if user wants)
            // For now, just use the CUSTOM ID - product will be created when PO is approved/received

        } else {
            // Catalog product validation
            if (!currentProductToAdd) {
                addNotification('alert', "Please select a product from the catalog.");
                return;
            }

            const product = products.find(p => p.id === currentProductToAdd);
            if (!product) {
                addNotification('alert', "Selected product not found. Please refresh and try again.");
                return;
            }

            productId = product.id;
            productName = product.name;

            // Auto-fill price if not set and product has cost price
            if (currentCost === 0 && product.costPrice && product.costPrice > 0) {
                setCurrentCost(product.costPrice);
                addNotification('info', `Auto-filled price from catalog: ${product.costPrice}`);
                // Don't return - user can adjust and re-add
            }
        }

        // 4. DUPLICATE DETECTION
        const existingItem = newPOItems.find(item =>
            item.productId === productId ||
            (isCustomItem && item.productName.toLowerCase() === productName.toLowerCase())
        );

        if (existingItem) {
            const confirmDuplicate = window.confirm(
                `"${productName}" is already in this order with ${existingItem.quantity} units.\n\n` +
                `Would you like to add ${currentQty} more units to it instead of creating a duplicate?`
            );

            if (confirmDuplicate) {
                // Update existing item quantity
                const updatedItems = newPOItems.map(item => {
                    if (item.productId === productId ||
                        (isCustomItem && item.productName.toLowerCase() === productName.toLowerCase())) {
                        const newQty = item.quantity + currentQty;
                        return {
                            ...item,
                            quantity: newQty,
                            totalCost: item.unitCost * newQty
                        };
                    }
                    return item;
                });
                setNewPOItems(updatedItems);
                addNotification('success', `Updated quantity for "${productName}" to ${existingItem.quantity + currentQty} units.`);

                // Reset fields
                resetItemFields();
                return;
            }
            // If user says no, allow duplicate (different price scenarios)
        }

        // 5. CALCULATE TOTAL (with precision handling)
        const totalCost = Math.round(currentCost * currentQty * 100) / 100; // 2 decimal precision

        // 6. CREATE THE PO ITEM
        const newItem: POItem = {
            productId,
            productName,
            quantity: currentQty,
            unitCost: currentCost,
            totalCost
        };

        // 7. ADD TO LIST
        setNewPOItems(prev => [...prev, newItem]);

        // 8. SUCCESS FEEDBACK
        addNotification('success', `Added: ${productName} × ${currentQty} = ${CURRENCY_SYMBOL}${totalCost.toLocaleString()}`);

        // 9. RESET FIELDS
        resetItemFields();
    };

    // Helper function to reset all item input fields
    const resetItemFields = () => {
        setCurrentProductToAdd('');
        setCustomItemName('');
        setSelectedMainCategory('');
        setSelectedSubCategory('');
        setCustomItemBrand('');
        setCustomItemSize('');
        setCustomItemSpecs('');
        setCustomItemUnit('');
        setCurrentQty(0);
        setCurrentCost(0);
        setItemAttributes({}); // Reset dynamic attributes
        setSelectedDescTemplate(''); // Reset description template
        setPackQuantity(0); // Reset pack quantity
    };

    const removePOItem = (idx: number) => {
        setNewPOItems(newPOItems.filter((_, i) => i !== idx));
    };

    // State for inline editing of PO items
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
    const [editingItem, setEditingItem] = useState<{ qty: number; price: number } | null>(null);

    // Start editing an item
    const startEditItem = (idx: number) => {
        const item = newPOItems[idx];
        setEditingItemIndex(idx);
        setEditingItem({ qty: item.quantity, price: item.unitCost });
    };

    // Save edited item
    const saveEditItem = () => {
        if (editingItemIndex === null || !editingItem) return;

        // Validate
        if (editingItem.qty <= 0) {
            addNotification('alert', 'Quantity must be greater than 0');
            return;
        }
        if (editingItem.price < 0) {
            addNotification('alert', 'Price cannot be negative');
            return;
        }

        const updatedItems = newPOItems.map((item, i) => {
            if (i === editingItemIndex) {
                const newTotal = Math.round(editingItem.qty * editingItem.price * 100) / 100;
                return {
                    ...item,
                    quantity: editingItem.qty,
                    unitCost: editingItem.price,
                    totalCost: newTotal
                };
            }
            return item;
        });

        setNewPOItems(updatedItems);
        addNotification('success', `Updated item: ${newPOItems[editingItemIndex].productName}`);
        setEditingItemIndex(null);
        setEditingItem(null);
    };

    // Cancel editing
    const cancelEditItem = () => {
        setEditingItemIndex(null);
        setEditingItem(null);
    };

    const handleAddSupplier = () => {
        if (!newSupName) {
            addNotification('alert', "Supplier Name is required.");
            return;
        }
        const newSup: Supplier = {
            id: `SUP-${suppliers.length + 1}`,
            name: newSupName,
            type: newSupType,
            email: newSupEmail,
            phone: newSupPhone,
            category: newSupCategory,
            contact: 'Primary Contact',
            status: 'Active',
            leadTime: newSupType === 'One-Time' ? 0 : 7,
            rating: 5.0,
            taxId: newSupType === 'Business' ? newSupID : undefined,
            nationalId: (newSupType === 'Farmer' || newSupType === 'Individual') ? newSupID : undefined,
            location: newSupLocation
        };
        addSupplier(newSup);
        setIsAddSupplierOpen(false);
        // Reset
        setNewSupName('');
        setNewSupEmail('');
        setNewSupPhone('');
        setNewSupCategory('');
        setNewSupID('');
        setNewSupLocation('');
    };

    // Removed: handleReceivePO - Receiving is now ONLY done in WMS Operations
    // Procurement creates and approves POs, Warehouse receives goods

    const handleDeletePO = () => {
        if (!selectedPO) return;
        setPoToDelete(selectedPO);
        setDeleteInput('');
        setIsDeletePOModalOpen(true);
    };

    const handleConfirmDeletePO = async () => {
        if (!poToDelete) return;

        if (deleteInput?.toUpperCase() !== "DELETE") {
            addNotification('alert', 'Please type "DELETE" to confirm.');
            return;
        }

        try {
            await deletePO(poToDelete.id);
            // deletePO handles notification
            setSelectedPO(null);
            setIsDeletePOModalOpen(false);
            setPoToDelete(null);
            setDeleteInput('');
        } catch (error) {
            console.error(error);
        }
    };

    const handlePrintPO = () => {
        if (!selectedPO) return;

        // Create a printable version with premium styling
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            addNotification('alert', 'Please allow popups to print');
            return;
        }

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Purchase Order - ${selectedPO.poNumber || selectedPO.id}</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    /* MODERN CLEAN A4 PRINT STYLES */
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                
                @page { 
                    size: A4; 
                    margin: 15mm 15mm 20mm 15mm; /* Top, Right, Bottom, Left */
                }
                
                * { box-sizing: border-box; }
                
                body { 
                    font-family: 'Inter', sans-serif; 
                    color: #111827;
                    line-height: 1.5;
                    font-size: 12px;
                    background: #fff;
                    margin: 0;
                    padding: 0;
                    -webkit-print-color-adjust: exact;
                }

                /* HEADER SECTION - Always top of first page */
                .header-container {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 40px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #000;
                }

                .brand-section h1 {
                    font-size: 24px;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                    margin: 0 0 5px 0;
                    text-transform: uppercase;
                }
                
                .brand-section p { color: #6b7280; font-size: 11px; margin: 0; }

                .document-details { text-align: right; }
                .document-title { 
                    font-size: 32px; 
                    font-weight: 900; 
                    margin: 0 0 10px 0; 
                    color: #000;
                    letter-spacing: 0.5px;
                }
                
                .meta-grid {
                    display: grid;
                    grid-template-columns: auto auto;
                    gap: 5px 20px;
                    justify-content: end;
                    text-align: left;
                }
                .meta-label { color: #6b7280; font-weight: 500; font-size: 11px; text-transform: uppercase; }
                .meta-value { font-weight: 600; font-size: 13px; text-align: right; }

                /* ADDRESS GRID - Top of page 1 */
                .addresses-container {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 60px;
                    margin-bottom: 50px;
                }
                
                .address-group h3 {
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #9ca3af;
                    margin: 0 0 10px 0;
                    font-weight: 600;
                    border-bottom: 1px solid #e5e7eb;
                    padding-bottom: 5px;
                    width: 100%;
                }
                
                .address-content p { margin: 2px 0; font-size: 13px; }
                .address-content strong { display: block; margin-bottom: 4px; font-size: 14px; font-weight: 700; }

                /* TABLE STYLES - ROBUST MULTI-PAGE */
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                }
                
                thead { display: table-header-group; }
                tfoot { display: table-footer-group; }
                tr { page-break-inside: avoid; }

                th {
                    background-color: #f9fafb;
                    color: #4b5563;
                    font-size: 10px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    padding: 12px 10px;
                    text-align: left;
                    border-top: 2px solid #000;
                    border-bottom: 1px solid #e5e7eb;
                }

                td {
                    padding: 12px 10px;
                    border-bottom: 1px solid #f3f4f6;
                    font-size: 12px;
                    vertical-align: top;
                }
                
                /* Alternating rows for readability on long lists */
                tbody tr:nth-child(even) { background-color: #fafbfc; }

                .item-name { font-weight: 600; color: #111827; font-size: 13px; }
                .item-sku { color: #6b7280; font-size: 10px; margin-top: 2px; font-family: 'Courier New', monospace; }

                /* TOTALS SECTION - Keep together */
                .totals-container {
                    display: flex;
                    justify-content: flex-end;
                    page-break-inside: avoid;
                    margin-top: 20px;
                }
                
                .totals-table {
                    width: 300px;
                    border-collapse: separate;
                    border-spacing: 0 8px;
                }
                
                .totals-table td {
                    padding: 0 10px;
                    border: none;
                }
                
                .totals-label { text-align: right; color: #6b7280; font-size: 12px; }
                .totals-value { text-align: right; font-weight: 600; font-size: 13px; }
                
                .grand-total .totals-label { color: #000; font-weight: 700; font-size: 14px; border-top: 2px solid #000; padding-top: 10px; }
                .grand-total .totals-value { color: #000; font-weight: 800; font-size: 18px; border-top: 2px solid #000; padding-top: 10px; }

                /* FOOTER & NOTES */
                .notes-container {
                    margin-top: 40px;
                    padding: 20px;
                    background: #f9fafb;
                    border-radius: 6px;
                    page-break-inside: avoid;
                }
                .notes-title { font-size: 11px; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; }
                .notes-text { font-size: 12px; color: #4b5563; line-height: 1.6; }

                .signatures {
                    margin-top: 60px;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 80px;
                    page-break-inside: avoid;
                }
                
                .sign-box { border-top: 1px solid #000; padding-top: 10px; }
                .sign-label { font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 40px; }

                .footer-page {
                    margin-top: 50px;
                    text-align: center;
                    font-size: 10px;
                    color: #9ca3af;
                    border-top: 1px solid #f3f4f6;
                    padding-top: 20px;
                }

                @media print {
                    button { display: none !important; }
                    .no-print { display: none !important; }
                    body { margin: 0; padding: 0; }
                }
                </style>
            </head>
            <body>
                <div class="header-container">
                    <div class="brand-section">
                        <h1>SIIFMART</h1>
                        <p>123 Business Avenue, Melbourne, VIC 3000</p>
                        <p>ABN: 12 345 678 901 | procurement@siifmart.com</p>
                    </div>
                    <div class="document-details">
                        <div class="document-title">PURCHASE ORDER</div>
                        <div class="meta-grid">
                            <span class="meta-label">PO Number</span>
                            <span class="meta-value">${selectedPO.poNumber || selectedPO.po_number || selectedPO.id}</span>
                            
                            <span class="meta-label">Date</span>
                            <span class="meta-value">${selectedPO.date}</span>
                            
                            <span class="meta-label">Status</span>
                            <span class="meta-value" style="color: ${selectedPO.status === 'Approved' ? '#059669' : '#000'}">${selectedPO.status?.toUpperCase()}</span>
                        </div>
                    </div>
                </div>

                <div class="addresses-container">
                    <div class="address-group">
                        <h3>Vendor / Supplier</h3>
                        <div class="address-content">
                            <strong>${selectedPO.supplierName}</strong>
                            <p>ID: ${selectedPO.supplierId}</p>
                            ${selectedPO.supplierEmail ? `<p>${selectedPO.supplierEmail}</p>` : ''}
                            ${selectedPO.supplierPhone ? `<p>${selectedPO.supplierPhone}</p>` : ''}
                        </div>
                    </div>
                    <div class="address-group">
                        <h3>Ship To / Deliver To</h3>
                        <div class="address-content">
                            <strong>${(() => {
                const site = sites.find(s => s.id === selectedPO.siteId) || sites.find(s => s.name === selectedPO.destination);
                return site ? site.name : (selectedPO.destination || 'Main Warehouse');
            })()}</strong>
                            ${(() => {
                const site = sites.find(s => s.id === selectedPO.siteId) || sites.find(s => s.name === selectedPO.destination);
                return `<p>${site ? site.address : 'Address checking...'}</p>`;
            })()}
                            <p style="margin-top: 8px"><span style="color:#6b7280; font-size:11px">EXPECTED DELIVERY:</span> <strong>${selectedPO.expectedDelivery}</strong></p>
                        </div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th width="5%">#</th>
                            <th width="45%">Item Details</th>
                            <th width="15%" style="text-align: right">Qty</th>
                            <th width="15%" style="text-align: right">Unit Price</th>
                            <th width="20%" style="text-align: right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${selectedPO.lineItems?.map((item, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>
                                    <div class="item-name">${item.productName}</div>
                                    ${item.productId ? `<div class="item-sku">SKU: ${item.productId.substring(0, 12)}</div>` : ''}
                                </td>
                                <td style="text-align: right; font-weight: 500">${item.quantity}</td>
                                <td style="text-align: right">${CURRENCY_SYMBOL}${item.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td style="text-align: right; font-weight: 600">${CURRENCY_SYMBOL}${item.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                        `).join('') || '<tr><td colspan="5" style="text-align: center; padding: 20px;">No items in this order</td></tr>'}
                    </tbody>
                </table>

                <div class="totals-container">
                    <table class="totals-table">
                        <tr>
                            <td class="totals-label">Subtotal</td>
                            <td class="totals-value">${CURRENCY_SYMBOL}${((selectedPO.totalAmount || 0) - (selectedPO.taxAmount || 0) - (selectedPO.shippingCost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                        ${selectedPO.discount > 0 ? `
                        <tr>
                            <td class="totals-label">Discount</td>
                            <td class="totals-value" style="color: #ef4444">-${CURRENCY_SYMBOL}${selectedPO.discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                        ` : ''}
                        <tr>
                            <td class="totals-label">Tax / GST</td>
                            <td class="totals-value">${CURRENCY_SYMBOL}${(selectedPO.taxAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                        ${(selectedPO.shippingCost || 0) > 0 ? `
                        <tr>
                            <td class="totals-label">Shipping</td>
                            <td class="totals-value">${CURRENCY_SYMBOL}${(selectedPO.shippingCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                        ` : ''}
                        <tr class="grand-total">
                            <td class="totals-label">TOTAL DUE</td>
                            <td class="totals-value">${CURRENCY_SYMBOL}${(selectedPO.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                    </table>
                </div>

                ${selectedPO.notes && selectedPO.notes.trim() ? `
                <div class="notes-container">
                    <div class="notes-title">Notes / Special Instructions</div>
                    <div class="notes-text">${selectedPO.notes.replace(/\n/g, '<br>')}</div>
                </div>
                ` : ''}

                <div class="footer">
                    <div>
                        Thank you for your business. Please include PO number on all invoices and shipping documents.
                    </div>
                    <div>
                        Page 1 of 1
                    </div>
                </div>

                <div style="text-align: center; margin-top: 40px;">
                    <button onclick="window.print()" style="padding: 12px 24px; background: #000; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 16px;">🖨️ Print Order</button>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    const handleApprovePO = async () => {
        if (!selectedPO) return;
        if (!canApprove) {
            addNotification('alert', 'Only Super Admin or Admin can approve purchase orders');
            return;
        }

        try {
            // Update PO status to Approved
            const updatedPO: PurchaseOrder = {
                ...selectedPO,
                status: 'Approved',
                approvedBy: user?.name || 'Unknown',
                approvedAt: new Date().toISOString()
            };

            // Persist to DB
            await updatePO(updatedPO);

            setSelectedPO({ ...updatedPO });
            addNotification('success', `PO ${selectedPO.poNumber || selectedPO.po_number || selectedPO.id} approved successfully`);

            // Close and reopen to refresh
            setTimeout(() => {
                setSelectedPO(null);
            }, 1500);
        } catch (error) {
            console.error('Error approving PO:', error);
            addNotification('alert', 'Failed to approve PO. Please try again.');
        }
    };

    const handleRejectPO = () => {
        if (!selectedPO) return;
        if (user?.role !== 'super_admin') {
            addNotification('alert', 'Only Super Admin can reject purchase orders');
            return;
        }
        setPoToReject(selectedPO);
        setIsRejectPOModalOpen(true);
    };

    const handleConfirmRejectPO = async () => {
        if (!poToReject) return;

        try {
            // Update PO status to Cancelled (rejected)
            const updatedPO: PurchaseOrder = {
                ...poToReject,
                status: 'Cancelled',
                notes: `${poToReject.notes || ''}\n[REJECTED_BY:${user?.name || 'Unknown'}:${new Date().toISOString()}]`.trim()
            };

            // Persist to DB
            await updatePO(updatedPO);

            setSelectedPO({ ...updatedPO });
            addNotification('info', `PO ${poToReject.poNumber || poToReject.id} has been rejected. You can now edit or delete it.`);

            setIsRejectPOModalOpen(false);
            setPoToReject(null);
        } catch (error) {
            console.error('Failed to reject PO:', error);
            addNotification('alert', 'Failed to reject PO');
        }
    };

    const handleBulkApprove = async () => {
        if (selectedPOIds.length === 0) {
            addNotification('alert', 'Please select at least one PO to approve');
            return;
        }

        if (user?.role !== 'super_admin' && user?.role !== 'admin') {
            addNotification('alert', 'Only Super Admin or Admin can approve purchase orders');
            return;
        }

        setIsBulkApproveModalOpen(true);
    };

    const handleConfirmBulkApprove = async () => {
        setIsBulkApproving(true);
        let approvedCount = 0;
        let failedCount = 0;

        try {
            for (const poId of selectedPOIds) {
                const po = orders.find(o => o.id === poId);
                if (!po || po.status !== 'Draft') {
                    failedCount++;
                    continue;
                }

                try {
                    const updatedPO: PurchaseOrder = {
                        ...po,
                        status: 'Approved',
                        approvedBy: user?.name || 'Unknown',
                        approvedAt: new Date().toISOString()
                    };

                    await updatePO(updatedPO);
                    approvedCount++;
                } catch (error) {
                    console.error(`Failed to approve PO ${poId}:`, error);
                    failedCount++;
                }
            }

            if (approvedCount > 0) {
                addNotification('success', `Approved ${approvedCount} Purchase Order(s)`);
            }
            if (failedCount > 0) {
                addNotification('alert', `Failed to approve ${failedCount} PO(s) (or they were not in Draft status)`);
            }

            setSelectedPOIds([]);
        } catch (error) {
            console.error('Bulk approve error:', error);
            addNotification('alert', 'An error occurred during bulk approval');
        } finally {
            setIsBulkApproving(false);
            setIsBulkApproveModalOpen(false);
        }
    };

    const selectedSupplierData = suppliers.find(s => s.id === newPOSupplier);
    const poSubtotal = newPOItems.reduce((sum, item) => sum + item.totalCost, 0);
    const poTax = poSubtotal * (taxRate / 100);
    const poDiscount = poSubtotal * (discountRate / 100);
    const poTotal = poSubtotal + poTax + shippingCost - poDiscount;

    const getSupplierIcon = (type: SupplierType) => {
        switch (type) {
            case 'Business': return Building;
            case 'Farmer': return Wheat;
            case 'Individual': return User;
            case 'One-Time': return ShoppingBag;
            default: return Truck;
        }
    };

    // --- COMPONENT: KPI CARD ---
    const KpiCard = ({ title, value, sub, icon: Icon, color }: any) => (
        <div className="bg-cyber-gray border border-white/5 rounded-2xl p-5 flex items-center gap-4 hover:border-white/10 transition-colors">
            <div className={`p-3 rounded-xl bg-white/5 ${color}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-xs text-gray-400 uppercase font-bold">{title}</p>
                <p className="text-xl font-mono font-bold text-white">{value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>
            </div>
        </div>
    );

    // Footer for Create PO Modal
    const createPOFooter = (
        <div className="flex justify-between items-center w-full">
            <div className="text-xs text-gray-400">
                Requester: <span className="font-bold text-cyber-primary">{user?.name}</span>
            </div>
            <div className="flex gap-3">
                <button
                    onClick={() => setIsCreatePOOpen(false)}
                    className="px-6 py-2 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleCreatePO}
                    disabled={isSubmitting}
                    className={`px-8 py-2 rounded-lg font-bold text-sm shadow-lg transition-all ${isSubmitting ? 'bg-gray-500 cursor-not-allowed text-gray-300' : isRequestMode ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20' : 'bg-cyber-primary hover:bg-cyber-accent text-black shadow-cyber-primary/30'}`}
                >
                    {isSubmitting ? (
                        <span className="flex items-center gap-2">
                            <span className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"></span>
                            Processing...
                        </span>
                    ) : (
                        isRequestMode ? 'Submit Request' : 'Issue Order'
                    )}
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Truck className="text-cyber-primary" />
                        Procurement Command
                    </h2>
                    <p className="text-gray-400 text-sm">Strategic sourcing, purchasing, and vendor management.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <ProtectedButton
                        permission="CREATE_PO"
                        onClick={() => {
                            setIsRequestMode(false);
                            setIsCreatePOOpen(true);
                            // Default to current site, ensuring no undefined values
                            const defaultSite = activeSite?.id || sites.find(s => s.type === 'Warehouse' || s.type === 'Distribution Center')?.id || sites[0]?.id;
                            setDestinationSiteIds(defaultSite ? [defaultSite] : []);
                            setIsMultiSiteMode(false); // Reset to single-site mode by default
                        }}
                        className="bg-cyber-primary hover:bg-cyber-primary/80 text-black px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={20} />
                        Create Purchase Order
                    </ProtectedButton>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-cyber-gray p-1 rounded-xl border border-white/5 w-fit overflow-x-auto">
                <TabButton id="overview" label="Overview" icon={PieIcon} />

                <TabButton id="orders" label="Orders (PO)" icon={Package} />
                <TabButton id="suppliers" label="Suppliers" icon={Truck} />
            </div>

            {/* --- OVERVIEW TAB --- */}
            {activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in">
                    {/* Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard title="Total Spend (YTD)" value={`${CURRENCY_SYMBOL} ${(metrics.totalSpend / 1000).toFixed(1)}k`} sub="Across all categories" icon={DollarSign} color="text-cyber-primary" />
                        <KpiCard title="Open Orders" value={metrics.openPO} sub={`Value: ${CURRENCY_SYMBOL} ${metrics.pendingValue.toLocaleString()}`} icon={Package} color="text-blue-400" />
                        <KpiCard title="Active Vendors" value={suppliers.filter(s => s.status === 'Active').length} sub="Top rated first" icon={Building} color="text-yellow-400" />
                        <KpiCard title="On-Time Delivery" value="94.2%" sub="Last 30 Days" icon={Clock} color="text-purple-400" />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
                            <h3 className="font-bold text-white mb-6">Spend by Category</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                                    <PieChart>
                                        <Pie data={metrics.categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {metrics.categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-center gap-4 flex-wrap mt-4">
                                {metrics.categoryData.map((entry, index) => (
                                    <div key={index} className="flex items-center gap-2 text-xs text-gray-400">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        {entry.name}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
                            <h3 className="font-bold text-white mb-6">Monthly Spend Trend</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                                    <AreaChart data={metrics.trendData}>
                                        <defs>
                                            <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                        <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                                        <Area type="monotone" dataKey="spend" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSpend)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {/* --- ORDERS (PO) TAB --- */}
            {activeTab === 'orders' && (
                <div className="bg-cyber-gray border border-white/5 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-white/5 flex gap-4">
                        <div className="flex items-center bg-black/30 border border-white/10 rounded-xl px-4 py-2 flex-1 max-w-md focus-within:border-cyber-primary/50 transition-colors">
                            <Search className="w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search PO # or Supplier..."
                                className="bg-transparent border-none ml-3 flex-1 text-white text-sm outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={cycleFilter}
                            className={`p-2 rounded-lg border flex items-center gap-2 px-3 transition-colors ${statusFilter !== 'All' ? 'bg-cyber-primary/10 border-cyber-primary text-cyber-primary' : 'border-white/10 text-gray-400 hover:bg-white/5'
                                }`}
                        >
                            <Filter className="w-4 h-4" />
                            <span className="text-xs">{statusFilter}</span>
                        </button>
                    </div>

                    {/* Bulk Actions Bar (Super Admin Only) */}
                    {user?.role === 'super_admin' && selectedPOIds.length > 0 && (
                        <div className="mx-4 mb-4 bg-cyber-primary/10 border border-cyber-primary/30 rounded-lg p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-cyber-primary">
                                    {selectedPOIds.length} PO{selectedPOIds.length !== 1 ? 's' : ''} selected
                                </span>
                                <button
                                    onClick={() => setSelectedPOIds([])}
                                    className="text-xs text-gray-400 hover:text-white transition-colors"
                                >
                                    Clear Selection
                                </button>
                            </div>
                            <button
                                onClick={handleBulkApprove}
                                disabled={isBulkApproving}
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg text-sm transition-colors flex items-center gap-2"
                            >
                                {isBulkApproving ? (
                                    <>
                                        <Clock size={16} className="animate-spin" />
                                        Approving...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={16} />
                                        Approve Selected ({selectedPOIds.length})
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    <div className="overflow-x-auto p-4">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/5">
                                    {/* Bulk Selection Checkbox (Super Admin Only) */}
                                    {user?.role === 'super_admin' && (
                                        <th className="p-4 w-12">
                                            {activePurchaseOrders.filter(po => po.status === 'Draft').length > 0 && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPOIds.length > 0 && selectedPOIds.length === activePurchaseOrders.filter(po => po.status === 'Draft').length}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedPOIds(activePurchaseOrders.filter(po => po.status === 'Draft').map(po => po.id));
                                                        } else {
                                                            setSelectedPOIds([]);
                                                        }
                                                    }}
                                                    className="w-4 h-4 rounded border-gray-600 text-cyber-primary focus:ring-cyber-primary bg-black/50"
                                                    title="Select All Draft POs"
                                                    aria-label="Select All Draft POs"
                                                />
                                            )}
                                        </th>
                                    )}
                                    <th className="p-4 text-xs text-gray-400 uppercase">PO Number</th>
                                    <th className="p-4 text-xs text-gray-400 uppercase">Supplier</th>
                                    <th className="p-4 text-xs text-gray-400 uppercase">Destination</th>
                                    <th className="p-4 text-xs text-gray-400 uppercase">Date</th>
                                    <th className="p-4 text-xs text-gray-400 uppercase text-right">Items</th>
                                    <th className="p-4 text-xs text-gray-400 uppercase text-right">Amount</th>
                                    <th className="p-4 text-xs text-gray-400 uppercase text-center">Status</th>
                                    <th className="p-4 text-xs text-gray-400 uppercase"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {activePurchaseOrders.map((po) => {
                                    const isDraft = po.status === 'Draft';
                                    const isSelected = selectedPOIds.includes(po.id);
                                    return (
                                        <tr key={po.id} className={`hover:bg-white/5 group transition-colors ${isSelected ? 'bg-cyber-primary/5 border-l-2 border-cyber-primary' : ''}`}>
                                            {/* Selection Checkbox (Super Admin Only, Draft POs Only) */}
                                            {user?.role === 'super_admin' && (
                                                <td className="p-4">
                                                    {isDraft ? (
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedPOIds(prev => [...prev, po.id]);
                                                                } else {
                                                                    setSelectedPOIds(prev => prev.filter(id => id !== po.id));
                                                                }
                                                            }}
                                                            className="w-4 h-4 rounded border-gray-600 text-cyber-primary focus:ring-cyber-primary bg-black/50"
                                                        />
                                                    ) : (
                                                        <span className="w-4 h-4 block"></span>
                                                    )}
                                                </td>
                                            )}
                                            <td className="p-4 text-sm font-mono text-white font-bold">{po.poNumber || po.po_number || po.id}</td>
                                            <td className="p-4 text-sm text-gray-300">{po.supplierName}</td>
                                            <td className="p-4 text-sm text-gray-300">{po.destination || sites.find(s => s.id === po.siteId)?.name || 'Unknown'}</td>
                                            <td className="p-4 text-xs text-gray-500">{po.date}</td>
                                            <td className="p-4 text-sm text-gray-300 font-mono text-right">{po.itemsCount}</td>
                                            <td className="p-4 text-sm text-cyber-primary font-mono text-right">{CURRENCY_SYMBOL} {po.totalAmount.toLocaleString()}</td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase border ${po.status === 'Received' ? 'text-green-400 border-green-500/20 bg-green-500/10' :
                                                    po.status === 'Approved' ? 'text-cyan-400 border-cyan-500/20 bg-cyan-500/10' :
                                                        po.status === 'Draft' ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10' :
                                                            po.status === 'Pending' ? 'text-blue-400 border-blue-500/20 bg-blue-500/10' :
                                                                'text-red-400 border-red-500/20 bg-red-500/10'
                                                    }`}>
                                                    {po.status === 'Received' && <CheckCircle size={12} className="mr-1" />}
                                                    {po.status === 'Approved' && <CheckCircle size={12} className="mr-1" />}
                                                    {po.status === 'Draft' && <Clock size={12} className="mr-1" />}
                                                    {po.status === 'Pending' && <Clock size={12} className="mr-1" />}
                                                    {po.status === 'Cancelled' && <XCircle size={12} className="mr-1" />}
                                                    {po.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Approve button for Draft POs (Super Admin & Admin) */}
                                                    {po.status === 'Draft' && canApprove && (
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    // Update PO status to Approved
                                                                    const updatedPO: PurchaseOrder = {
                                                                        ...po,
                                                                        status: 'Approved',
                                                                        approvedBy: user?.name || 'Unknown',
                                                                        approvedAt: new Date().toISOString()
                                                                    };

                                                                    // Persist to database
                                                                    await updatePO(updatedPO);
                                                                    addNotification('success', `PO ${po.poNumber || po.po_number || po.id} approved successfully`);
                                                                } catch (error) {
                                                                    console.error('Error approving PO:', error);
                                                                    addNotification('alert', 'Failed to approve PO. Please try again.');
                                                                }
                                                            }}
                                                            className="text-xs bg-green-500 hover:bg-green-600 px-3 py-1 rounded text-white font-bold transition-colors flex items-center gap-1"
                                                        >
                                                            <CheckCircle size={12} />
                                                            Approve
                                                        </button>
                                                    )}
                                                    <button onClick={() => setSelectedPO(po)} className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1 rounded border border-white/10 text-white transition-colors">View</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {activePurchaseOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={user?.role === 'super_admin' ? 9 : 8} className="p-8 text-center text-gray-500 italic">No active purchase orders found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- SUPPLIERS TAB --- */}
            {activeTab === 'suppliers' && (
                <div className="space-y-6">
                    {/* Header Actions */}
                    <div className="flex justify-between items-center bg-cyber-dark/50 p-4 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-cyber-primary/10 rounded-lg">
                                <Building size={24} className="text-cyber-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Supplier Directory</h2>
                                <p className="text-xs text-gray-400">{suppliers.length} Active Partners</p>
                            </div>
                        </div>
                        <Protected permission="MANAGE_SUPPLIERS">
                            <button
                                onClick={() => setIsAddSupplierOpen(true)}
                                className="px-4 py-2 bg-cyber-primary text-black rounded-lg font-bold flex items-center gap-2 hover:bg-cyber-accent transition-all shadow-[0_0_15px_rgba(0,255,157,0.3)] transform hover:scale-105"
                            >
                                <Plus size={18} /> Add New Supplier
                            </button>
                        </Protected>
                    </div>

                    {/* Suppliers Table */}
                    <div className="bg-cyber-gray/30 border border-white/10 rounded-2xl overflow-x-auto backdrop-blur-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10 text-xs text-gray-400 uppercase tracking-wider">
                                    <th className="p-4 font-bold pl-6">Supplier Name</th>
                                    <th className="p-4 font-bold">Category</th>
                                    <th className="p-4 font-bold">Status</th>
                                    <th className="p-4 font-bold">Performance</th>
                                    <th className="p-4 font-bold">Contact Info</th>
                                    <th className="p-4 font-bold text-right pr-6">Quick Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suppliers.map((sup) => {
                                    const Icon = getSupplierIcon(sup.type);
                                    return (
                                        <tr
                                            key={sup.id}
                                            onClick={() => {
                                                setSelectedSupplier(sup);
                                                setIsContactModalOpen(true);
                                            }}
                                            className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group last:border-0"
                                        >
                                            <td className="p-4 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-cyber-primary group-hover:bg-cyber-primary/10 transition-colors">
                                                        <Icon size={20} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-white group-hover:text-cyber-primary transition-colors">{sup.name}</h3>
                                                        <p className="text-[10px] text-gray-500 font-mono">Terms: {sup.paymentTerms || 'Net 30'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-gray-300 font-medium">{sup.category}</span>
                                                    <span className="text-[10px] text-gray-500">{sup.type}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${sup.status === 'Active' ? 'text-green-400 border-green-500/20 bg-green-500/10' : 'text-red-400 border-red-500/20 bg-red-500/10'
                                                    }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${sup.status === 'Active' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                                    {sup.status}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                                        <span className="text-sm text-white font-bold">{sup.rating}</span>
                                                        <span className="text-xs text-gray-600">/ 5.0</span>
                                                    </div>
                                                    <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                                                        <div className="h-full bg-green-500" style={{ width: '98%' }}></div>
                                                    </div>
                                                    <span className="text-[10px] text-green-400">98% OTIF Score</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1.5">
                                                    {sup.email ? (
                                                        <div className="flex items-center gap-2 text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                                                            <Mail size={12} />
                                                            <span className="truncate max-w-[150px]">{sup.email}</span>
                                                        </div>
                                                    ) : null}
                                                    {sup.phone ? (
                                                        <div className="flex items-center gap-2 text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                                                            <Phone size={12} />
                                                            <span>{sup.phone}</span>
                                                        </div>
                                                    ) : null}
                                                    {!sup.email && !sup.phone && <span className="text-xs text-gray-600 italic">No contact info</span>}
                                                </div>
                                            </td>
                                            <td className="p-4 pr-6 text-right">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedSupplier(sup);
                                                        setIsProductCatalogOpen(true);
                                                    }}
                                                    className="px-3 py-1.5 bg-white/5 hover:bg-cyber-primary hover:text-black text-xs font-bold rounded-lg transition-all border border-white/10 hover:border-cyber-primary text-gray-300 flex items-center gap-2 ml-auto"
                                                >
                                                    <Package size={14} /> Catalog
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {suppliers.length === 0 && (
                            <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                    <Search size={32} className="opacity-50" />
                                </div>
                                <p className="text-lg font-bold text-gray-400">No suppliers found</p>
                                <p className="text-sm mt-1">Add a new supplier to get started.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- MODAL: CREATE PO (Elegant Minimal Redesign) --- */}
            <Modal isOpen={isCreatePOOpen} onClose={() => setIsCreatePOOpen(false)} title="" size="xl" footer={createPOFooter}>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white">{isRequestMode ? "New Purchase Request" : "New Purchase Order"}</h2>
                            <p className="text-sm text-gray-400 mt-1">{new Date().toLocaleDateString()}</p>
                        </div>
                        <span className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-bold">Draft</span>
                    </div>

                    {/* Info Cards - 4 column grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {/* Vendor */}
                        <div className="bg-white/5 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-gray-500 uppercase tracking-wider">Vendor</p>
                                <button onClick={() => { setIsManualVendor(!isManualVendor); setNewPOSupplier(''); setManualVendorName(''); }} className="text-[10px] text-gray-400 hover:text-white">
                                    {isManualVendor ? '📋 Use List' : '✏️ Manual'}
                                </button>
                            </div>
                            {isManualVendor ? (
                                <input className="w-full bg-transparent border-b border-white/20 py-1 text-white text-sm focus:border-cyber-primary outline-none" placeholder="Enter vendor name..." value={manualVendorName} onChange={(e) => setManualVendorName(e.target.value)} />
                            ) : (
                                <select className="w-full bg-transparent text-white text-sm focus:outline-none cursor-pointer" value={newPOSupplier} onChange={(e) => setNewPOSupplier(e.target.value)} title="Select Vendor">
                                    <option value="" className="bg-cyber-dark">Select...</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id} className="bg-cyber-dark">{s.name}</option>)}
                                </select>
                            )}
                        </div>

                        {/* Destination - Multi-Site */}
                        <div className="bg-white/5 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-gray-500 uppercase tracking-wider">Destination(s)</p>
                                <span className="text-[10px] text-cyber-primary">{destinationSiteIds.length} selected</span>
                            </div>
                            <div className="max-h-[80px] overflow-y-auto space-y-1">
                                {getValidPODestinationSites().map(site => (
                                    <label key={site.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 rounded px-1 py-0.5">
                                        <input
                                            type="checkbox"
                                            className="accent-cyber-primary"
                                            checked={destinationSiteIds.includes(site.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setDestinationSiteIds(prev => [...prev, site.id]);
                                                } else {
                                                    setDestinationSiteIds(prev => prev.filter(id => id !== site.id));
                                                }
                                            }}
                                        />
                                        <span className="text-sm text-white truncate">{site.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Expected */}
                        <div className="bg-white/5 rounded-xl p-4">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Expected</p>
                            <input type="date" className="w-full bg-transparent text-white text-sm focus:outline-none" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} />
                        </div>

                        {/* Terms */}
                        <div className="bg-white/5 rounded-xl p-4">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Payment Terms</p>
                            <input className="w-full bg-transparent border-b border-white/20 py-1 text-white text-sm focus:border-cyber-primary outline-none" placeholder="Net 30" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} />
                        </div>
                    </div>

                    {/* Add Item Section - SIMPLIFIED */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Add Item</h3>
                            <button onClick={() => { setIsCustomItem(!isCustomItem); setCurrentProductToAdd(''); setCustomItemName(''); setSelectedMainCategory(''); setItemAttributes({}); setSelectedDescTemplate(''); }} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${isCustomItem ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}>
                                {isCustomItem ? '✏️ Custom Item' : '📦 From Catalog'}
                            </button>
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-gray-400 hover:text-white transition-colors" title="Export PDF" onClick={handleGenerateReport}>
                                    <Download size={20} />
                                </button>
                                <button onClick={() => { setIsCustomItem(!isCustomItem); setCurrentProductToAdd(''); setCustomItemName(''); setSelectedMainCategory(''); setItemAttributes({}); setSelectedDescTemplate(''); }} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${isCustomItem ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}>
                                    {isCustomItem ? '✏️ Custom Item' : '📦 From Catalog'}
                                </button>
                            </div>
                        </div>

                        {isCustomItem ? (
                            <div className="space-y-3">
                                {/* Row 1: Category + Item Name + Brand */}
                                <div className="grid grid-cols-12 gap-2">
                                    {/* Category */}
                                    <div className="col-span-3">
                                        <label className="text-[10px] text-cyber-primary uppercase mb-1 block">Category *</label>
                                        <select
                                            className="w-full bg-black/30 border border-white/20 rounded-lg px-2 py-2 text-sm text-white"
                                            value={selectedMainCategory}
                                            onChange={e => {
                                                setSelectedMainCategory(e.target.value);
                                                setSelectedSubCategory('');
                                                setItemAttributes({});
                                            }}
                                            title="Category"
                                        >
                                            <option value="">Select...</option>
                                            {Object.keys(GROCERY_CATEGORIES).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>

                                    {/* Item Name */}
                                    <div className="col-span-5">
                                        <label className="text-[10px] text-cyber-primary uppercase mb-1 block">Item Name *</label>
                                        <input
                                            className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
                                            placeholder="e.g., Milk, Water, Rice..."
                                            value={customItemName}
                                            onChange={e => setCustomItemName(e.target.value)}
                                        />
                                    </div>

                                    {/* Brand */}
                                    <div className="col-span-4">
                                        <label className="text-[10px] text-gray-500 uppercase mb-1 block">Brand</label>
                                        <input
                                            className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
                                            placeholder="e.g., Coca-Cola, Nestle..."
                                            value={customItemBrand}
                                            onChange={e => setCustomItemBrand(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Row 2: Unit + Size + Pack Qty (Single Item vs Box) */}
                                <div className="grid grid-cols-12 gap-2">
                                    {/* Unit (Dropdown) */}
                                    <div className="col-span-3">
                                        <label className="text-[10px] text-cyber-primary uppercase mb-1 block">Unit *</label>
                                        <select
                                            className="w-full bg-black/30 border border-cyber-primary/50 rounded-lg px-2 py-2 text-sm text-white"
                                            value={customItemUnit}
                                            onChange={e => setCustomItemUnit(e.target.value)}
                                            title="Unit of measurement"
                                        >
                                            <option value="">Select unit...</option>
                                            <option value="L">Liter (L)</option>
                                            <option value="ml">Milliliter (ml)</option>
                                            <option value="kg">Kilogram (kg)</option>
                                            <option value="g">Gram (g)</option>
                                            <option value="pcs">Piece (pcs)</option>
                                            <option value="bottle">Bottle</option>
                                            <option value="can">Can</option>
                                            <option value="box">Box</option>
                                            <option value="bag">Bag</option>
                                            <option value="pack">Pack</option>
                                            <option value="carton">Carton</option>
                                            <option value="tray">Tray</option>
                                            <option value="roll">Roll</option>
                                            <option value="jar">Jar</option>
                                            <option value="sachet">Sachet</option>
                                        </select>
                                    </div>

                                    {/* Size (Input) */}
                                    <div className="col-span-2">
                                        <label className="text-[10px] text-cyber-primary uppercase mb-1 block">Size *</label>
                                        <input
                                            type="text"
                                            className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 text-center"
                                            placeholder="1, 500, 2..."
                                            value={customItemSize}
                                            onChange={e => setCustomItemSize(e.target.value)}
                                        />
                                    </div>

                                    {/* Pack Qty (How many in the box) */}
                                    <div className="col-span-3">
                                        <label className="text-[10px] text-yellow-400 uppercase mb-1 block">Pack Qty</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">Pack of</span>
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-full bg-black/30 border border-yellow-500/30 rounded-lg pl-16 pr-3 py-2 text-sm text-white text-center"
                                                placeholder="0"
                                                value={packQuantity || ''}
                                                onChange={e => setPackQuantity(parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>

                                    {/* Live Preview - Shows instantly what the description will look like */}
                                    <div className="col-span-4">
                                        <label className="text-[10px] text-gray-500 uppercase mb-1 block">Preview</label>
                                        <div className="w-full bg-cyber-primary/10 border border-cyber-primary/30 rounded-lg px-3 py-2 text-sm text-cyber-primary font-medium truncate">
                                            {(() => {
                                                const parts = [];
                                                if (customItemBrand) parts.push(customItemBrand);
                                                if (customItemName) parts.push(customItemName);
                                                else if (selectedMainCategory) parts.push(selectedMainCategory);
                                                if (customItemSize && customItemUnit) parts.push(`${customItemSize}${customItemUnit}`);
                                                else if (customItemSize) parts.push(customItemSize);
                                                else if (customItemUnit) parts.push(customItemUnit);
                                                let name = parts.join(' ');
                                                if (packQuantity > 1) name += ` – Pack of ${packQuantity}`;
                                                return name || 'Enter details...';
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                {/* Row 3: Qty + Price + Total + Add */}
                                <div className="grid grid-cols-4 gap-3 pt-2 border-t border-white/10">
                                    <div>
                                        <label className="text-[10px] text-cyber-primary uppercase mb-1 block">Order Qty *</label>
                                        <input type="number" min="1" className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-sm text-white text-center" placeholder="0" value={currentQty || ''} onChange={e => setCurrentQty(parseInt(e.target.value) || 0)} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-cyber-primary uppercase mb-1 block">Unit Price *</label>
                                        <input type="number" min="0" step="0.01" className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-sm text-white text-right" placeholder="0.00" value={currentCost || ''} onChange={e => setCurrentCost(parseFloat(e.target.value) || 0)} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase mb-1 block">Total</label>
                                        <div className="w-full bg-black/50 border border-cyber-primary/30 rounded-lg px-3 py-2 text-sm text-cyber-primary font-mono font-bold text-right">
                                            {CURRENCY_SYMBOL}{(currentCost * currentQty).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="flex items-end">
                                        <button onClick={addItemToPO} className="w-full bg-cyber-primary hover:bg-cyber-accent text-black py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-1" title="Add Item">
                                            <Plus size={16} /> Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Catalog Product Selection */
                            <div className="grid grid-cols-12 gap-3">
                                <div className="col-span-12 md:col-span-6">
                                    <select className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-sm text-white" value={currentProductToAdd} onChange={e => setCurrentProductToAdd(e.target.value)} title="Product">
                                        <option value="">Select product from catalog...</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                                    </select>
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <input type="number" min="1" className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-sm text-white text-center" placeholder="Qty" value={currentQty || ''} onChange={e => setCurrentQty(parseInt(e.target.value) || 0)} />
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <input type="number" min="0" step="0.01" className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-sm text-white text-right" placeholder="Price" value={currentCost || ''} onChange={e => setCurrentCost(parseFloat(e.target.value) || 0)} />
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <button onClick={addItemToPO} className="w-full bg-cyber-primary hover:bg-cyber-accent text-black py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-1" title="Add Item">
                                        <Plus size={16} /> Add
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Items Table - With Inline Editing */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Items ({newPOItems.length})</h3>
                            {newPOItems.length > 0 && <span className="text-xs text-gray-500">{newPOItems.reduce((sum, item) => sum + item.quantity, 0)} units total</span>}
                        </div>
                        <div className="bg-white/5 rounded-xl overflow-hidden max-h-[220px] overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 bg-white/10">
                                    <tr className="border-b border-white/10">
                                        <th className="text-left p-3 text-xs text-gray-500 font-medium w-8">#</th>
                                        <th className="text-left p-3 text-xs text-gray-500 font-medium">Product</th>
                                        <th className="text-right p-3 text-xs text-gray-500 font-medium w-20">Qty</th>
                                        <th className="text-right p-3 text-xs text-gray-500 font-medium w-24">Price</th>
                                        <th className="text-right p-3 text-xs text-gray-500 font-medium w-24">Total</th>
                                        <th className="w-20 text-center text-xs text-gray-500 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {newPOItems.map((item, i) => (
                                        <tr key={i} className={`transition-colors ${editingItemIndex === i ? 'bg-cyber-primary/10' : 'hover:bg-white/5'}`}>
                                            <td className="p-3 text-gray-500 text-sm">{i + 1}</td>
                                            <td className="p-3">
                                                <span className="text-white">{item.productName}</span>
                                                {item.productId.startsWith('CUSTOM') && <span className="ml-2 text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">Custom</span>}
                                            </td>

                                            {/* Quantity - Editable */}
                                            <td className="p-2 text-right">
                                                {editingItemIndex === i ? (
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="w-16 bg-black/50 border border-cyber-primary rounded px-2 py-1 text-sm text-white text-center"
                                                        value={editingItem?.qty || 0}
                                                        onChange={e => setEditingItem(prev => prev ? { ...prev, qty: parseInt(e.target.value) || 0 } : null)}
                                                        title="Quantity"
                                                    />
                                                ) : (
                                                    <span className="text-gray-300">{item.quantity}</span>
                                                )}
                                            </td>

                                            {/* Price - Editable */}
                                            <td className="p-2 text-right">
                                                {editingItemIndex === i ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="w-20 bg-black/50 border border-cyber-primary rounded px-2 py-1 text-sm text-white text-right"
                                                        value={editingItem?.price || 0}
                                                        onChange={e => setEditingItem(prev => prev ? { ...prev, price: parseFloat(e.target.value) || 0 } : null)}
                                                        title="Unit Price"
                                                    />
                                                ) : (
                                                    <span className="text-gray-400 font-mono">{item.unitCost.toLocaleString()}</span>
                                                )}
                                            </td>

                                            {/* Total - Calculated */}
                                            <td className="p-3 text-cyber-primary text-right font-mono font-bold">
                                                {editingItemIndex === i
                                                    ? ((editingItem?.qty || 0) * (editingItem?.price || 0)).toLocaleString()
                                                    : item.totalCost.toLocaleString()
                                                }
                                            </td>

                                            {/* Actions */}
                                            <td className="p-2 text-center">
                                                {editingItemIndex === i ? (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button onClick={saveEditItem} className="p-1 text-green-400 hover:text-green-300 transition-colors" title="Save">
                                                            <Check size={14} />
                                                        </button>
                                                        <button onClick={cancelEditItem} className="p-1 text-gray-400 hover:text-white transition-colors" title="Cancel">
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button onClick={() => startEditItem(i)} className="p-1 text-gray-500 hover:text-cyber-primary transition-colors" title="Edit">
                                                            <Edit3 size={14} />
                                                        </button>
                                                        <button onClick={() => removePOItem(i)} className="p-1 text-gray-500 hover:text-red-400 transition-colors" title="Remove">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {newPOItems.length === 0 && (
                                        <tr><td colSpan={6} className="p-8 text-center text-gray-500 italic">No items added yet. Use the form above to add items.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Notes & Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Notes */}
                        <div className="bg-white/5 rounded-xl p-4">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Notes (Optional)</p>
                            <textarea className="w-full bg-transparent border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 resize-none h-20 focus:border-cyber-primary outline-none" placeholder="Add any notes or instructions..." value={poNotes} onChange={e => setPoNotes(e.target.value)} />
                        </div>

                        {/* Summary */}
                        <div className="bg-cyber-primary/10 border border-cyber-primary/30 rounded-xl p-4">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-gray-400">
                                    <span>Subtotal</span>
                                    <span className="font-mono text-white">{CURRENCY_SYMBOL} {poSubtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>Tax ({taxRate}%)</span>
                                    <span className="font-mono text-white">{CURRENCY_SYMBOL} {poTax.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-cyber-primary/30">
                                    <span className="text-gray-400 font-bold">Total</span>
                                    <span className="text-2xl font-bold text-cyber-primary font-mono">{CURRENCY_SYMBOL} {poTotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* --- MODAL: VIEW PO (Elegant Redesign) --- */}
            <Modal isOpen={!!selectedPO} onClose={() => setSelectedPO(null)} title="" size="lg">
                {selectedPO && (
                    <div className="space-y-6">
                        {/* Header - Clean & Minimal */}
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white tracking-tight">
                                    {selectedPO.poNumber || selectedPO.po_number || `PO-${selectedPO.id?.slice(0, 8)}`}
                                </h2>
                                <p className="text-sm text-gray-400 mt-1">
                                    {selectedPO.supplierName}
                                    {selectedPO.supplierId?.startsWith('MANUAL') && (
                                        <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">MANUAL</span>
                                    )}
                                </p>
                            </div>
                            <div className={`px-4 py-2 rounded-full text-sm font-bold ${selectedPO.status === 'Received' ? 'bg-green-500/20 text-green-400' :
                                selectedPO.status === 'Approved' || selectedPO.status === 'Pending' ? 'bg-blue-500/20 text-blue-400' :
                                    selectedPO.status === 'Draft' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-red-500/20 text-red-400'
                                }`}>
                                {selectedPO.status}
                            </div>
                        </div>

                        {/* Key Info - Enhanced Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-white/5 rounded-xl p-4">
                                <p className="text-xs text-gray-500 uppercase tracking-wider">Created</p>
                                <p className="text-white font-medium mt-1">{selectedPO.date || 'N/A'}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4">
                                <p className="text-xs text-gray-500 uppercase tracking-wider">Requested By</p>
                                <p className="text-white font-medium mt-1">{selectedPO.createdBy || user?.name || 'N/A'}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4">
                                <p className="text-xs text-gray-500 uppercase tracking-wider">Destination</p>
                                <p className="text-white font-medium mt-1 truncate">{selectedPO.destination || 'N/A'}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4">
                                <p className="text-xs text-gray-500 uppercase tracking-wider">Expected By</p>
                                <p className="text-white font-medium mt-1">{selectedPO.expectedDelivery || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Additional Details Row */}
                        {(selectedPO.paymentTerms || selectedPO.approvedBy) && (
                            <div className="flex flex-wrap gap-4 text-sm">
                                {selectedPO.paymentTerms && (
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <span className="text-gray-500">Payment:</span>
                                        <span className="text-white">{selectedPO.paymentTerms}</span>
                                    </div>
                                )}
                                {selectedPO.approvedBy && (
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <span className="text-gray-500">Approved by:</span>
                                        <span className="text-green-400">{selectedPO.approvedBy}</span>
                                        {selectedPO.approvedAt && (
                                            <span className="text-gray-600">({selectedPO.approvedAt})</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Line Items - Enhanced Table */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                                    Items ({selectedPO.lineItems?.length || 0})
                                </h3>
                                <span className="text-xs text-gray-500">
                                    {selectedPO.lineItems?.reduce((sum, item) => sum + item.quantity, 0) || 0} units total
                                </span>
                            </div>
                            <div className="bg-white/5 rounded-xl overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left p-4 text-xs text-gray-500 font-medium w-8">#</th>
                                            <th className="text-left p-4 text-xs text-gray-500 font-medium">Product</th>
                                            <th className="text-right p-4 text-xs text-gray-500 font-medium w-20">Qty</th>
                                            <th className="text-right p-4 text-xs text-gray-500 font-medium w-28">Unit Price</th>
                                            <th className="text-right p-4 text-xs text-gray-500 font-medium w-28">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {selectedPO.lineItems?.map((item, i) => (
                                            <tr key={i} className="hover:bg-white/5 transition-colors">
                                                <td className="p-4 text-gray-500 text-sm">{i + 1}</td>
                                                <td className="p-4">
                                                    <div className="text-white font-medium">{item.productName}</div>
                                                    {item.productId && !item.productId.startsWith('CUSTOM') && (
                                                        <div className="text-xs text-gray-500 mt-0.5">ID: {item.productId.slice(0, 8)}...</div>
                                                    )}
                                                    {item.productId?.startsWith('CUSTOM') && (
                                                        <span className="inline-block mt-1 text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">Custom Item</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-gray-300 text-right font-medium">{item.quantity}</td>
                                                <td className="p-4 text-gray-400 text-right font-mono">{CURRENCY_SYMBOL} {item.unitCost.toLocaleString()}</td>
                                                <td className="p-4 text-cyber-primary text-right font-mono font-bold">{CURRENCY_SYMBOL} {item.totalCost.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        {(!selectedPO.lineItems || selectedPO.lineItems.length === 0) && (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-gray-500 italic">No items in this order</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Summary - Subtotal, Tax, Total */}
                        <div className="flex justify-end">
                            <div className="bg-cyber-primary/10 border border-cyber-primary/30 rounded-xl p-5 min-w-[280px]">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-gray-400">
                                        <span>Subtotal</span>
                                        <span className="font-mono text-white">{CURRENCY_SYMBOL} {(selectedPO.totalAmount - (selectedPO.taxAmount || 0)).toLocaleString()}</span>
                                    </div>
                                    {selectedPO.shippingCost && selectedPO.shippingCost > 0 && (
                                        <div className="flex justify-between text-gray-400">
                                            <span>Shipping</span>
                                            <span className="font-mono text-white">{CURRENCY_SYMBOL} {selectedPO.shippingCost.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {selectedPO.taxAmount && selectedPO.taxAmount > 0 && (
                                        <div className="flex justify-between text-gray-400">
                                            <span>Tax</span>
                                            <span className="font-mono text-white">{CURRENCY_SYMBOL} {selectedPO.taxAmount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between pt-2 border-t border-cyber-primary/30">
                                        <span className="text-gray-400 font-bold">Total</span>
                                        <span className="text-2xl font-bold text-cyber-primary font-mono">{CURRENCY_SYMBOL} {selectedPO.totalAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes - Subtle */}
                        {selectedPO.notes && (
                            <div className="bg-white/5 rounded-xl p-4">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Notes</p>
                                <p className="text-sm text-gray-400 italic">
                                    {selectedPO.notes.replace(/\[APPROVED_BY:.*?\]/g, '').replace(/\[SITES:.*?\]/g, '').replace(/\[Multi-Site Order.*?\]/g, '').trim() || 'No notes'}
                                </p>
                            </div>
                        )}

                        {/* Actions - Simple & Clear */}
                        <div className="pt-4 border-t border-white/10 space-y-3">
                            {/* Primary Actions for Draft POs */}
                            {selectedPO.status === 'Draft' && canApprove && (
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={handleApprovePO}
                                        className="py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={18} /> Approve
                                    </button>
                                    {user?.role === 'super_admin' && (
                                        <button
                                            onClick={handleRejectPO}
                                            className="py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-xl border border-red-500/30 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <XCircle size={18} /> Reject
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Status Messages */}
                            {selectedPO.status === 'Received' && (
                                <div className="py-3 px-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-400">
                                    <CheckCircle size={18} />
                                    <span className="text-sm font-medium">Order received and processed</span>
                                </div>
                            )}

                            {(selectedPO.status === 'Approved' || selectedPO.status === 'Pending') && (
                                <div className="py-3 px-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3 text-blue-400">
                                    <Package size={18} />
                                    <span className="text-sm">Receive in WMS → Operations → Receiving</span>
                                </div>
                            )}

                            {/* Secondary Actions */}
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={handlePrintPO}
                                    className="py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium"
                                >
                                    <Printer size={16} /> Print
                                </button>

                                {(selectedPO.status === 'Approved' || selectedPO.status === 'Pending' || selectedPO.status === 'Draft') && (
                                    <ProtectedButton
                                        permission="DELETE_PO"
                                        onClick={handleDeletePO}
                                        className="py-3 bg-white/5 hover:bg-red-500/10 text-gray-300 hover:text-red-400 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium border border-transparent hover:border-red-500/20"
                                    >
                                        <Trash2 size={16} /> Delete
                                    </ProtectedButton>
                                )}

                                <button
                                    onClick={() => setSelectedPO(null)}
                                    className="py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-medium"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal >

            {/* --- MODAL: ADD SUPPLIER --- */}
            < Modal isOpen={isAddSupplierOpen} onClose={() => setIsAddSupplierOpen(false)} title="Add New Supplier" size="md" >
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Supplier Name *</label>
                        <input
                            type="text"
                            className="w-full bg-black/30 border border-white/20 rounded p-2 text-sm text-white"
                            placeholder="Enter supplier name"
                            value={newSupName}
                            onChange={e => setNewSupName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Type</label>
                        <select
                            className="w-full bg-black/30 border border-white/20 rounded p-2 text-sm text-white"
                            value={newSupType}
                            onChange={e => setNewSupType(e.target.value as any)}
                            title="Select Supplier Type"
                            aria-label="Select Supplier Type"
                        >
                            <option value="Business" className="bg-cyber-dark">Business</option>
                            <option value="Individual" className="bg-cyber-dark">Individual</option>
                            <option value="Farmer" className="bg-cyber-dark">Farmer</option>
                            <option value="One-Time" className="bg-cyber-dark">One-Time</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Email</label>
                            <input
                                type="email"
                                className="w-full bg-black/30 border border-white/20 rounded p-2 text-sm text-white"
                                placeholder="Email address"
                                value={newSupEmail}
                                onChange={e => setNewSupEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Phone</label>
                            <input
                                type="tel"
                                className="w-full bg-black/30 border border-white/20 rounded p-2 text-sm text-white"
                                placeholder="Phone number"
                                value={newSupPhone}
                                onChange={e => setNewSupPhone(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Category</label>
                        <input
                            type="text"
                            className="w-full bg-black/30 border border-white/20 rounded p-2 text-sm text-white"
                            placeholder="e.g. Electronics, Food, etc."
                            value={newSupCategory}
                            onChange={e => setNewSupCategory(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Tax ID / National ID</label>
                        <input
                            type="text"
                            className="w-full bg-black/30 border border-white/20 rounded p-2 text-sm text-white"
                            placeholder="Optional"
                            value={newSupID}
                            onChange={e => setNewSupID(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Location</label>
                        <input
                            type="text"
                            className="w-full bg-black/30 border border-white/20 rounded p-2 text-sm text-white"
                            placeholder="City, Country"
                            value={newSupLocation}
                            onChange={e => setNewSupLocation(e.target.value)}
                        />
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button
                            onClick={() => setIsAddSupplierOpen(false)}
                            className="flex-1 py-2 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddSupplier}
                            className="flex-1 py-2 rounded-lg bg-cyber-primary hover:bg-cyber-accent text-black font-bold text-sm transition-colors shadow-lg shadow-cyber-primary/20"
                        >
                            Add Supplier
                        </button>
                    </div>
                </div>
            </Modal >

            {/* Product Catalog Modal */}
            < Modal isOpen={isProductCatalogOpen} onClose={() => setIsProductCatalogOpen(false)} title={`Products from ${selectedSupplier?.name || 'Supplier'}`} size="xl" >
                {selectedSupplier && (
                    <div className="space-y-4">
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <Package className="text-blue-400" size={20} />
                                <h3 className="text-white font-bold">Supplier Product Catalog</h3>
                            </div>
                            <p className="text-xs text-gray-400">
                                Products available from {selectedSupplier.name}. Filter by category or search by name.
                            </p>
                        </div>

                        {/* Products List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
                            {products.slice(0, 20).map(product => (
                                <div key={product.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-cyber-primary/50 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <img src={product.image} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-white font-bold text-sm truncate">{product.name}</h4>
                                            <p className="text-xs text-gray-400 mt-1">SKU: {product.sku || product.id}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-cyber-primary font-bold text-sm">{CURRENCY_SYMBOL} {product.price.toLocaleString()}</span>
                                                {product.stock !== undefined && (
                                                    <span className="text-xs text-gray-500">Stock: {product.stock}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setIsCreatePOOpen(true);
                                            setIsProductCatalogOpen(false);
                                            addNotification('info', `Add "${product.name}" to your purchase order`);
                                        }}
                                        className="w-full mt-3 py-2 bg-cyber-primary/10 hover:bg-cyber-primary text-cyber-primary hover:text-black text-xs font-bold rounded-lg transition-colors"
                                    >
                                        Add to PO
                                    </button>
                                </div>
                            ))}
                        </div>

                        {products.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <Package size={48} className="mx-auto mb-4 opacity-50" />
                                <p className="text-sm">No products found</p>
                                <p className="text-xs mt-1">Products will appear here once they are added to the system</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal >

            {/* Supplier Details Modal */}
            <Modal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} title={`Supplier Details: ${selectedSupplier?.name || ''}`} size="lg">
                {selectedSupplier && (
                    <div className="space-y-6">
                        {/* Status & Overview */}
                        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 uppercase font-bold">Category</p>
                                <p className="text-white font-bold">{selectedSupplier.category}</p>
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 uppercase font-bold">Type</p>
                                <p className="text-white font-bold">{selectedSupplier.type}</p>
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 uppercase font-bold">Status</p>
                                <div className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${selectedSupplier.status === 'Active' ? 'text-green-400 border-green-500/20 bg-green-500/5' : 'text-red-400 border-red-500/20 bg-red-500/5'
                                    }`}>
                                    {selectedSupplier.status}
                                </div>
                            </div>
                        </div>

                        {/* Performance Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-black/20 p-3 rounded-xl border border-white/5 text-center">
                                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Performance</p>
                                <div className="flex items-center justify-center gap-1 text-yellow-400 font-bold">
                                    <Star size={14} fill="currentColor" /> {selectedSupplier.rating}
                                </div>
                            </div>
                            <div className="bg-black/20 p-3 rounded-xl border border-white/5 text-center">
                                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Lead Time</p>
                                <p className="text-white font-bold">{selectedSupplier.leadTime} Days</p>
                            </div>
                            <div className="bg-black/20 p-3 rounded-xl border border-white/5 text-center">
                                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Payment Terms</p>
                                <p className="text-white font-bold">{selectedSupplier.paymentTerms || 'Net 30'}</p>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Contact Information</h3>

                            {selectedSupplier.phone && (
                                <button
                                    onClick={() => {
                                        window.location.href = `tel:${selectedSupplier.phone}`;
                                        addNotification('success', `Calling ${selectedSupplier.name}...`);
                                    }}
                                    className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30">
                                        <Phone className="text-green-400" size={18} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-white font-bold text-sm">Call</p>
                                        <p className="text-xs text-gray-400">{selectedSupplier.phone}</p>
                                    </div>
                                    <ExternalLink size={14} className="text-gray-500" />
                                </button>
                            )}

                            {selectedSupplier.email && (
                                <button
                                    onClick={() => {
                                        window.location.href = `mailto:${selectedSupplier.email}?subject=Inquiry&body=Hello...`;
                                        addNotification('success', `Opening email...`);
                                    }}
                                    className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30">
                                        <Mail className="text-blue-400" size={18} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-white font-bold text-sm">Email</p>
                                        <p className="text-xs text-gray-400">{selectedSupplier.email}</p>
                                    </div>
                                    <ExternalLink size={14} className="text-gray-500" />
                                </button>
                            )}

                            {selectedSupplier.location && (
                                <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                        <MapPin className="text-purple-400" size={18} />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-sm">Location</p>
                                        <p className="text-xs text-gray-400">{selectedSupplier.location}</p>
                                    </div>
                                </div>
                            )}

                            {!selectedSupplier.phone && !selectedSupplier.email && !selectedSupplier.location && (
                                <div className="text-center py-8 text-gray-500">
                                    <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No specific contact details available</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
            {/* Delete PO Modal */}
            <Modal isOpen={isDeletePOModalOpen} onClose={() => setIsDeletePOModalOpen(false)} title="Delete Purchase Order" size="md">
                <div className="space-y-4">
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
                        <AlertCircle className="text-red-400 shrink-0" size={24} />
                        <div>
                            <h3 className="text-red-400 font-bold">Warning: Irreversible Action</h3>
                            <p className="text-xs text-red-300 mt-1">
                                You are about to delete Purchase Order <strong>{poToDelete?.poNumber || poToDelete?.id}</strong>.
                                This action cannot be undone.
                            </p>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Type "DELETE" to confirm</label>
                        <input
                            type="text"
                            value={deleteInput}
                            onChange={(e) => setDeleteInput(e.target.value)}
                            className="w-full bg-black/30 border border-white/20 rounded-lg p-3 text-white focus:border-red-500/50 outline-none transition-colors"
                            placeholder="DELETE"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setIsDeletePOModalOpen(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors">Cancel</button>
                        <button onClick={handleConfirmDeletePO} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors">Delete PO</button>
                    </div>
                </div>
            </Modal>

            {/* Reject PO Modal */}
            <Modal isOpen={isRejectPOModalOpen} onClose={() => setIsRejectPOModalOpen(false)} title="Reject Purchase Order" size="md">
                <div className="space-y-6">
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
                        <XCircle className="text-red-400 shrink-0" size={24} />
                        <div>
                            <h3 className="text-red-400 font-bold">Reject this Order?</h3>
                            <p className="text-xs text-red-300 mt-1">
                                Are you sure you want to reject Purchase Order <strong>{poToReject?.poNumber || poToReject?.id}</strong>?
                                The status will be set to 'Cancelled'.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setIsRejectPOModalOpen(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors">Cancel</button>
                        <button onClick={handleConfirmRejectPO} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors">Confirm Reject</button>
                    </div>
                </div>
            </Modal>

            {/* Bulk Approve Modal */}
            <Modal isOpen={isBulkApproveModalOpen} onClose={() => setIsBulkApproveModalOpen(false)} title="Bulk Approve Orders" size="md">
                <div className="space-y-6">
                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3">
                        <CheckCircle className="text-blue-400 shrink-0" size={24} />
                        <div>
                            <h3 className="text-blue-400 font-bold">Approve {selectedPOIds.length} Orders?</h3>
                            <p className="text-xs text-blue-300 mt-1">
                                You are about to approve {selectedPOIds.length} selected purchase orders.
                                This will change their status to 'Approved' and notify relevant staff.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setIsBulkApproveModalOpen(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors">Cancel</button>
                        <button onClick={handleConfirmBulkApprove} disabled={isBulkApproving} className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                            {isBulkApproving ? 'Approving...' : 'Confirm Approval'}
                        </button>
                    </div>
                </div>
            </Modal>
            {/* MULTI-SITE ORDER MODAL REMOVED */}
        </div >
    );
}
