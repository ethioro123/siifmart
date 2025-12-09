# 🚀 QUICK INTEGRATION GUIDE

## Finance Page - Add These Snippets

### 1. Add Imports (Top of Finance.tsx)
```typescript
import { 
  exportPnLToPDF,
  exportExpensesToExcel,
  exportCashFlowToExcel 
} from '../utils/financeExports';
import { 
  exponentialSmoothingForecast,
  arimaForecast,
  projectCashFlow,
  getBestForecastMethod 
} from '../utils/forecasting';
```

### 2. Add State (After existing state)
```typescript
const [forecastMethod, setForecastMethod] = useState<'ARIMA' | 'Exponential' | 'Linear'>(
  getBestForecastMethod(sales)
);
```

### 3. Add Calculations (After existing calculations)
```typescript
// Advanced forecasts
const advancedForecast = forecastMethod === 'ARIMA' 
  ? arimaForecast(sales, 30)
  : exponentialSmoothingForecast(sales, 30);

// Cash flow projection
const cashFlowData = projectCashFlow(sales, expenses, 30, 0);
```

### 4. Add Export Handlers (After existing handlers)
```typescript
const handleExportPnLPDF = () => {
  const taxData = {
    region: currentTaxConfig.name,
    rate: currentTaxConfig.rate,
    estimatedLiability,
    inputTaxCredit,
    netTaxPayable
  };
  exportPnLToPDF(sales, expenses, employees, taxData);
  addNotification('success', 'P&L Report exported as PDF');
};

const handleExportExpensesExcel = () => {
  exportExpensesToExcel(expenses);
  addNotification('success', 'Expenses exported to Excel');
};

const handleExportCashFlow = () => {
  exportCashFlowToExcel(cashFlowData);
  addNotification('success', 'Cash Flow projection exported');
};
```

### 5. Update Export Button (Replace existing Export JSON button)
```tsx
<div className="flex gap-2">
  <button
    onClick={handleExportPnLPDF}
    className="bg-white/5 text-white border border-white/10 px-4 py-2 rounded-lg text-sm hover:bg-white/10 flex items-center transition-colors"
  >
    <Download className="w-4 h-4 mr-2" /> P&L (PDF)
  </button>
  <button
    onClick={handleExportExpensesExcel}
    className="bg-white/5 text-white border border-white/10 px-4 py-2 rounded-lg text-sm hover:bg-white/10 flex items-center transition-colors"
  >
    <Download className="w-4 h-4 mr-2" /> Expenses (Excel)
  </button>
  <button
    onClick={handleExportPnL}
    className="bg-white/5 text-white border border-white/10 px-4 py-2 rounded-lg text-sm hover:bg-white/10 flex items-center transition-colors"
  >
    <Download className="w-4 h-4 mr-2" /> JSON
  </button>
</div>
```

### 6. Add Forecast Selector (In Overview tab, before forecast chart)
```tsx
<div className="flex items-center gap-3 mb-4">
  <label className="text-sm text-gray-400 font-bold">Forecast Method:</label>
  <select
    value={forecastMethod}
    onChange={(e) => setForecastMethod(e.target.value as any)}
    className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none"
  >
    <option value="ARIMA">ARIMA (Stable Data)</option>
    <option value="Exponential">Exponential Smoothing (Volatile)</option>
    <option value="Linear">Linear Regression (Simple)</option>
  </select>
  <span className="text-xs text-gray-500">
    Auto-selected: {getBestForecastMethod(sales)}
  </span>
</div>
```

### 7. Add Cash Flow Tab (Add to tab list)
```tsx
<TabButton id="cashflow" label="Cash Flow" icon={TrendingUp} />
```

### 8. Add Cash Flow Content (After budget tab content)
```tsx
{activeTab === 'cashflow' && (
  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
    <div className="flex justify-between items-center">
      <div>
        <h3 className="text-2xl font-bold text-white">30-Day Cash Flow Projection</h3>
        <p className="text-gray-400 text-sm">Projected inflows and outflows</p>
      </div>
      <button
        onClick={handleExportCashFlow}
        className="bg-cyber-primary text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
      >
        <Download size={16} /> Export Excel
      </button>
    </div>

    <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={cashFlowData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="date" stroke="#666" />
          <YAxis stroke="#666" />
          <Tooltip 
            contentStyle={{ background: '#1a1a1a', border: '1px solid #333' }}
            labelStyle={{ color: '#fff' }}
          />
          <Legend />
          <Bar dataKey="inflow" fill="#00ff9d" name="Cash Inflow" />
          <Bar dataKey="outflow" fill="#ef4444" name="Cash Outflow" />
          <Line 
            type="monotone" 
            dataKey="cumulativeCash" 
            stroke="#3b82f6" 
            name="Cumulative Cash" 
            strokeWidth={2}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>

    <div className="grid grid-cols-3 gap-4">
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
        <p className="text-xs text-gray-500 uppercase font-bold">Avg Daily Inflow</p>
        <p className="text-2xl font-bold text-green-400 mt-2">
          {CURRENCY_SYMBOL}{(cashFlowData.reduce((sum, d) => sum + d.inflow, 0) / cashFlowData.length).toFixed(0)}
        </p>
      </div>
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <p className="text-xs text-gray-500 uppercase font-bold">Avg Daily Outflow</p>
        <p className="text-2xl font-bold text-red-400 mt-2">
          {CURRENCY_SYMBOL}{(cashFlowData.reduce((sum, d) => sum + d.outflow, 0) / cashFlowData.length).toFixed(0)}
        </p>
      </div>
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <p className="text-xs text-gray-500 uppercase font-bold">30-Day Net Position</p>
        <p className="text-2xl font-bold text-blue-400 mt-2">
          {CURRENCY_SYMBOL}{cashFlowData[cashFlowData.length - 1].cumulativeCash.toFixed(0)}
        </p>
      </div>
    </div>
  </div>
)}
```

---

## Settings Page - Add These Snippets

### 1. Add Imports (Top of Settings.tsx)
```typescript
import { 
  SITE_TEMPLATES,
  createSiteFromTemplate,
  validateBulkOperation,
  generateBulkOperationSummary,
  exportMultipleSiteConfigurations,
  importSiteConfiguration 
} from '../utils/siteTemplates';
```

### 2. Add State (After existing state)
```typescript
const [selectedTemplate, setSelectedTemplate] = useState<string>('');
const [selectedSites, setSelectedSites] = useState<string[]>([]);
const [showBulkPanel, setShowBulkPanel] = useState(false);
```

### 3. Add Dark Mode Toggle (In General tab, after language selector)
```tsx
<ToggleGroup
  label="Dark Mode"
  sub="Switch between light and dark themes"
  checked={theme === 'dark'}
  onChange={toggleTheme}
/>
```

### 4. Add Template Selector (In site modal, before name input)
```tsx
<div className="mb-4">
  <label className="text-sm text-gray-300 font-bold block mb-2">
    Start from Template (Optional)
  </label>
  <select
    value={selectedTemplate}
    onChange={(e) => {
      setSelectedTemplate(e.target.value);
      if (e.target.value) {
        const template = SITE_TEMPLATES.find(t => t.id === e.target.value);
        if (template) {
          const siteData = createSiteFromTemplate(template, {
            name: '',
            address: '',
            manager: ''
          });
          setNewSite({ ...siteData, ...newSite });
        }
      }
    }}
    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm outline-none"
  >
    <option value="">Custom Site</option>
    {SITE_TEMPLATES.map(tpl => (
      <option key={tpl.id} value={tpl.id}>
        {tpl.name} - {tpl.description}
      </option>
    ))}
  </select>
</div>
```

### 5. Add Bulk Operations Panel (In locations tab, after site grid)
```tsx
{selectedSites.length > 0 && (
  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-cyber-gray border border-cyber-primary/50 rounded-2xl p-4 shadow-2xl z-50 flex items-center gap-4">
    <p className="text-white font-bold">{selectedSites.length} sites selected</p>
    <button
      onClick={() => {
        // Bulk update status
        const summary = generateBulkOperationSummary({
          type: 'update_status',
          siteIds: selectedSites,
          value: 'Maintenance'
        }, sites);
        if (confirm(summary)) {
          selectedSites.forEach(id => updateSite({ id, status: 'Maintenance' } as Site));
          setSelectedSites([]);
        }
      }}
      className="px-3 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm font-bold hover:bg-yellow-500/30"
    >
      Set Maintenance
    </button>
    <button
      onClick={() => {
        const summary = generateBulkOperationSummary({
          type: 'delete',
          siteIds: selectedSites
        }, sites);
        if (confirm(summary + '\n\nThis action cannot be undone!')) {
          selectedSites.forEach(id => deleteSite(id));
          setSelectedSites([]);
        }
      }}
      className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-bold hover:bg-red-500/30"
    >
      Delete
    </button>
    <button
      onClick={() => setSelectedSites([])}
      className="px-3 py-2 bg-white/10 text-white rounded-lg text-sm font-bold hover:bg-white/20"
    >
      Clear
    </button>
  </div>
)}
```

### 6. Add Checkboxes to Site Cards (In site card, top-left corner)
```tsx
<input
  type="checkbox"
  checked={selectedSites.includes(site.id)}
  onChange={(e) => {
    if (e.target.checked) {
      setSelectedSites([...selectedSites, site.id]);
    } else {
      setSelectedSites(selectedSites.filter(id => id !== site.id));
    }
  }}
  className="absolute top-4 left-4 w-5 h-5 accent-cyber-primary"
  onClick={(e) => e.stopPropagation()}
/>
```

### 7. Add Import/Export Buttons (In locations tab header)
```tsx
<div className="flex gap-2">
  <button
    onClick={() => {
      const config = exportMultipleSiteConfigurations(sites);
      const blob = new Blob([config], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sites_config_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    }}
    className="px-3 py-2 bg-white/5 text-white border border-white/10 rounded-lg text-sm hover:bg-white/10"
  >
    <Download size={16} className="inline mr-2" />
    Export All
  </button>
  <label className="px-3 py-2 bg-white/5 text-white border border-white/10 rounded-lg text-sm hover:bg-white/10 cursor-pointer">
    <Upload size={16} className="inline mr-2" />
    Import
    <input
      type="file"
      accept=".json"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          file.text().then(content => {
            const imported = importSiteConfiguration(content);
            if (imported) {
              addSite(imported as Site);
              addNotification('success', 'Site imported successfully');
            } else {
              addNotification('alert', 'Invalid configuration file');
            }
          });
        }
      }}
    />
  </label>
</div>
```

---

## ✅ That's It!

Copy and paste these snippets into the respective files and you're done!

All the heavy lifting is already done in the utility files. These snippets just expose the functionality to users.
