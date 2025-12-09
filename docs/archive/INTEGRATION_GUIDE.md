# 🚀 SIIFMART - Complete Integration Guide

## ✅ What's Been Created

### **1. API Service Layer** (`services/supabase.service.ts`)
Complete CRUD operations for all entities:
- ✅ Sites
- ✅ Products (with stock management)
- ✅ Customers (with loyalty)
- ✅ Employees
- ✅ Suppliers
- ✅ Purchase Orders (with receiving)
- ✅ Sales (with stock deduction)
- ✅ Stock Movements
- ✅ Expenses
- ✅ WMS Jobs
- ✅ System Logs

### **2. Authentication Service** (`services/auth.service.ts`)
- ✅ Sign up / Sign in / Sign out
- ✅ Session management
- ✅ Role-based access control (9 roles)
- ✅ Password reset
- ✅ Current user retrieval
- ✅ Permission checking

### **3. Real-time Service** (`services/realtime.service.ts`)
- ✅ Live product updates
- ✅ Live sales updates
- ✅ Live stock movements
- ✅ Live customer updates
- ✅ Live WMS job updates
- ✅ Presence tracking (who's online)
- ✅ Custom broadcasts

---

## 📋 Integration Steps

### **Step 1: Update DataContext to Use Supabase**

Replace LocalStorage with Supabase calls in `contexts/DataContext.tsx`:

```typescript
import { 
  productsService, 
  customersService, 
  salesService,
  employeesService,
  purchaseOrdersService,
  // ... other services
} from '../services/supabase.service';
import { realtimeService } from '../services/realtime.service';

export const DataProvider = ({ children }: { children?: ReactNode }) => {
  // Replace useState with data from Supabase
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  // ... other state

  // Load data from Supabase on mount
  useEffect(() => {
    loadData();
    setupRealtime();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, salesData, customersData] = await Promise.all([
        productsService.getAll(),
        salesService.getAll(),
        customersService.getAll()
      ]);

      setProducts(productsData);
      setSales(salesData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const setupRealtime = () => {
    // Subscribe to real-time updates
    const subscriptions = realtimeService.subscribeToSite(activeSite?.id || '', {
      onProductChange: (event, payload) => {
        if (event === 'INSERT') {
          setProducts(prev => [payload, ...prev]);
        } else if (event === 'UPDATE') {
          setProducts(prev => prev.map(p => p.id === payload.id ? payload : p));
        } else if (event === 'DELETE') {
          setProducts(prev => prev.filter(p => p.id !== payload.id));
        }
      },
      onSaleChange: (event, payload) => {
        if (event === 'INSERT') {
          setSales(prev => [payload, ...prev]);
        }
      }
    });

    return () => realtimeService.unsubscribeAll(subscriptions);
  };

  // Update actions to use Supabase
  const addProduct = async (product: Product) => {
    try {
      const newProduct = await productsService.create(product);
      // Real-time will update the state automatically
      return newProduct;
    } catch (error) {
      console.error('Failed to add product:', error);
      throw error;
    }
  };

  const processSale = async (cart: CartItem[], method: PaymentMethod, ...) => {
    try {
      const sale = await salesService.create({
        site_id: activeSite?.id,
        subtotal,
        tax,
        total,
        payment_method: method,
        cashier_name: user,
        customer_id: customerId
      }, cart);

      return sale.id;
    } catch (error) {
      console.error('Failed to process sale:', error);
      throw error;
    }
  };

  // ... update all other actions similarly
};
```

---

### **Step 2: Update CentralStore for Authentication**

Replace mock authentication in `contexts/CentralStore.tsx`:

```typescript
import { authService, type AuthUser } from '../services/auth.service';

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
    
    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        if (session) {
          const authUser = await authService.getCurrentAuthUser();
          setUser(authUser);
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    try {
      const authUser = await authService.getCurrentAuthUser();
      setUser(authUser);
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await authService.signIn(email, password);
      const authUser = await authService.getCurrentAuthUser();
      setUser(authUser);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // ... rest of the provider
};
```

---

### **Step 3: Create Login Page**

Update `components/LoginPage.tsx` to use real authentication:

```typescript
import { authService } from '../services/auth.service';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const success = await login(email, password);
      if (!success) {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  return (
    // ... login form UI
  );
}
```

---

### **Step 4: Migrate Mock Data to Supabase**

Create a migration script `scripts/migrate-data.ts`:

```typescript
import { 
  sitesService, 
  productsService, 
  customersService,
  employeesService,
  suppliersService
} from '../services/supabase.service';
import { MOCK_SITES, MOCK_PRODUCTS, MOCK_CUSTOMERS } from '../constants';

async function migrateData() {
  console.log('🚀 Starting data migration...\n');

  try {
    // 1. Migrate Sites
    console.log('📍 Migrating sites...');
    for (const site of MOCK_SITES) {
      await sitesService.create(site);
    }
    console.log(`✅ Migrated ${MOCK_SITES.length} sites\n`);

    // 2. Migrate Products
    console.log('📦 Migrating products...');
    for (const product of MOCK_PRODUCTS) {
      await productsService.create(product);
    }
    console.log(`✅ Migrated ${MOCK_PRODUCTS.length} products\n`);

    // 3. Migrate Customers
    console.log('👥 Migrating customers...');
    for (const customer of MOCK_CUSTOMERS) {
      await customersService.create(customer);
    }
    console.log(`✅ Migrated ${MOCK_CUSTOMERS.length} customers\n`);

    // ... migrate other entities

    console.log('🎉 Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrateData();
```

Run with: `npx tsx scripts/migrate-data.ts`

---

### **Step 5: Add Real-time Updates to Components**

Example for Dashboard:

```typescript
import { realtimeService } from '../services/realtime.service';

export default function Dashboard() {
  const { sales, products } = useData();
  const [liveSales, setLiveSales] = useState(sales);

  useEffect(() => {
    // Subscribe to live sales
    const subscription = realtimeService.subscribeToSales(
      (event, payload) => {
        if (event === 'INSERT') {
          setLiveSales(prev => [payload, ...prev]);
          // Show notification
          toast.success(`New sale: $${payload.total}`);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ... rest of component
}
```

---

## 🎯 Quick Start Commands

### **1. Test Supabase Connection**
```bash
npm run dev
# Open browser console - should see no errors
```

### **2. Create First User**
```typescript
// In browser console:
import { authService } from './services/auth.service';

await authService.signUp(
  'admin@siifmart.com',
  'SecurePassword123!',
  {
    name: 'Admin User',
    role: 'super_admin',
    siteId: 'SITE-001'
  }
);
```

### **3. Migrate Data**
```bash
# Create migration script
npx tsx scripts/migrate-data.ts
```

### **4. Test Real-time**
```typescript
// In browser console:
import { realtimeService } from './services/realtime.service';

realtimeService.subscribeToProducts((event, payload) => {
  console.log('Product update:', event, payload);
});
```

---

## 📊 Integration Checklist

### **Phase 1: Core Services** ✅
- [x] API service layer created
- [x] Authentication service created
- [x] Real-time service created

### **Phase 2: Context Updates** (Next)
- [ ] Update DataContext to use Supabase
- [ ] Update CentralStore for auth
- [ ] Remove LocalStorage dependencies

### **Phase 3: Authentication** (Next)
- [ ] Update LoginPage
- [ ] Add sign-up flow
- [ ] Add password reset
- [ ] Add role-based routing

### **Phase 4: Data Migration** (Next)
- [ ] Create migration script
- [ ] Migrate sites
- [ ] Migrate products
- [ ] Migrate customers
- [ ] Migrate employees
- [ ] Migrate suppliers

### **Phase 5: Real-time** (Next)
- [ ] Add real-time to Dashboard
- [ ] Add real-time to POS
- [ ] Add real-time to Inventory
- [ ] Add presence tracking

### **Phase 6: Testing** (Final)
- [ ] Test all CRUD operations
- [ ] Test authentication flow
- [ ] Test real-time updates
- [ ] Test multi-user scenarios

---

## 🎉 What You Get

### **Backend Features:**
- ✅ PostgreSQL database (industry standard)
- ✅ Real-time updates across devices
- ✅ Secure authentication
- ✅ Role-based access control
- ✅ Automatic backups
- ✅ Audit trail (system logs)

### **Developer Experience:**
- ✅ Type-safe API calls
- ✅ Auto-complete in IDE
- ✅ Error handling
- ✅ Real-time subscriptions
- ✅ Easy to test

### **Cost:**
- ✅ $0/month (Free tier)
- ✅ Upgrade to $25/mo when needed
- ✅ 76% cheaper than Firebase

---

## 🆘 Need Help?

### **Common Issues:**

**1. "Cannot find module" errors**
- Make sure all services are in `services/` folder
- Check import paths

**2. "Authentication failed"**
- Check Supabase URL and keys in `.env.local`
- Verify user exists in Supabase Auth

**3. "Real-time not working"**
- Check Supabase Realtime is enabled
- Verify RLS policies allow access

**4. "Data not loading"**
- Check browser console for errors
- Verify Supabase connection
- Check RLS policies

---

## 📚 Next Steps

1. **Update DataContext** - Replace LocalStorage
2. **Update LoginPage** - Use real auth
3. **Migrate Data** - Move mock data to Supabase
4. **Add Real-time** - Live updates everywhere
5. **Test Everything** - Ensure it all works
6. **Deploy** - Go live!

---

**🎊 Your backend is ready! Let's integrate it!**
