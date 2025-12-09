# Shared Components Usage Guide

This guide shows how to use the centralized shared components for consistent styling across the app.

## Import Components

```typescript
// Import individual components
import { Card, StatCard, PageHeader, Button } from '../components/shared';

// Or import all
import * as Shared from '../components/shared';
```

## Component Examples

### 1. Card
Basic container with consistent styling.

```typescript
<Card>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>

// With custom padding
<Card padding="lg">Content</Card>

// With hover effect
<Card hover onClick={() => console.log('clicked')}>
  Clickable card
</Card>
```

### 2. StatCard
Display metrics and statistics.

```typescript
<StatCard
  label="Total Sales"
  value="$12,450"
  color="green"
  trend={{ value: 12.5, isPositive: true }}
  icon={<DollarSign size={20} />}
/>
```

### 3. PageHeader
Standardized page headers with title, subtitle, and actions.

```typescript
<PageHeader
  title="Inventory Management"
  subtitle="Track and manage your stock levels"
  actions={
    <>
      <Button variant="secondary" size="sm">Export</Button>
      <Button variant="primary" size="sm">Add Product</Button>
    </>
  }
  stats={
    <div className="grid grid-cols-4 gap-3">
      <StatCard label="Total Items" value="1,234" color="blue" />
      <StatCard label="Low Stock" value="45" color="yellow" />
      <StatCard label="Out of Stock" value="12" color="red" />
      <StatCard label="Total Value" value="$45,678" color="green" />
    </div>
  }
/>
```

### 4. FilterBar
Consistent search and filter interface.

```typescript
<FilterBar
  searchValue={searchTerm}
  onSearchChange={setSearchTerm}
  searchPlaceholder="Search products..."
  resultCount={filteredItems.length}
  filters={
    <>
      <FilterDropdown
        label="Category"
        value={categoryFilter}
        onChange={setCategoryFilter}
        options={[
          { value: 'all', label: 'All Categories' },
          { value: 'electronics', label: 'Electronics' },
          { value: 'food', label: 'Food & Beverage' }
        ]}
      />
      <FilterDropdown
        label="Status"
        value={statusFilter}
        onChange={setStatusFilter}
        options={[
          { value: 'all', label: 'All Status' },
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ]}
      />
    </>
  }
  actions={
    <Button variant="secondary" size="sm">
      <Download size={14} /> Export
    </Button>
  }
  showClearButton={categoryFilter !== 'all' || statusFilter !== 'all'}
  onClearFilters={() => {
    setCategoryFilter('all');
    setStatusFilter('all');
  }}
/>
```

### 5. TabSystem
Consistent tab navigation.

```typescript
<TabSystem
  tabs={[
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'details', label: 'Details', badge: 5 },
    { id: 'history', label: 'History' },
    { id: 'settings', label: 'Settings', disabled: true }
  ]}
  activeTab={activeTab}
  onChange={setActiveTab}
/>
```

### 6. Button
Standardized buttons with variants.

```typescript
// Primary button
<Button variant="primary" size="md">
  Save Changes
</Button>

// With icon
<Button variant="primary" icon={<Plus size={16} />}>
  Add New
</Button>

// Loading state
<Button variant="primary" loading>
  Saving...
</Button>

// Full width
<Button variant="primary" fullWidth>
  Submit
</Button>

// Different variants
<Button variant="secondary">Cancel</Button>
<Button variant="danger">Delete</Button>
<Button variant="success">Approve</Button>
<Button variant="ghost">Learn More</Button>
```

### 7. Badge
Status indicators and labels.

```typescript
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Out of Stock</Badge>
<Badge variant="info">New</Badge>
<Badge variant="primary">Featured</Badge>

// Different sizes
<Badge size="sm">Small</Badge>
<Badge size="md">Medium</Badge>
<Badge size="lg">Large</Badge>
```

### 8. EmptyState
Display when no data is available.

```typescript
<EmptyState
  icon={<Package size={64} />}
  title="No products found"
  description="Try adjusting your search or filters to find what you're looking for."
  action={{
    label: 'Add New Product',
    onClick: () => setShowAddModal(true)
  }}
/>
```

### 9. LoadingSpinner
Loading indicators.

```typescript
// Inline spinner
<LoadingSpinner size="md" color="primary" />

// With text
<LoadingSpinner size="lg" text="Loading data..." />

// Full screen overlay
<LoadingSpinner fullScreen text="Processing..." />
```

## Complete Page Example

```typescript
import React, { useState } from 'react';
import { Package, Plus, Download } from 'lucide-react';
import {
  PageHeader,
  StatCard,
  FilterBar,
  FilterDropdown,
  TabSystem,
  Card,
  Button,
  Badge,
  EmptyState,
  LoadingSpinner
} from '../components/shared';

export default function ExamplePage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Product Management"
        subtitle="Manage your product catalog"
        actions={
          <>
            <Button variant="secondary" size="sm" icon={<Download size={14} />}>
              Export
            </Button>
            <Button variant="primary" size="sm" icon={<Plus size={14} />}>
              Add Product
            </Button>
          </>
        }
        stats={
          <div className="grid grid-cols-4 gap-3">
            <StatCard label="Total Products" value="1,234" color="blue" />
            <StatCard label="Active" value="1,189" color="green" />
            <StatCard label="Low Stock" value="45" color="yellow" />
            <StatCard label="Out of Stock" value="12" color="red" />
          </div>
        }
      />

      {/* Tabs */}
      <TabSystem
        tabs={[
          { id: 'all', label: 'All Products', badge: 1234 },
          { id: 'active', label: 'Active', badge: 1189 },
          { id: 'inactive', label: 'Inactive', badge: 45 }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Filters */}
      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search products..."
        resultCount={1234}
        filters={
          <>
            <FilterDropdown
              label="Category"
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { value: 'all', label: 'All Categories' },
                { value: 'electronics', label: 'Electronics' },
                { value: 'food', label: 'Food & Beverage' }
              ]}
            />
          </>
        }
        showClearButton={categoryFilter !== 'all'}
        onClearFilters={() => setCategoryFilter('all')}
      />

      {/* Content */}
      <Card>
        {/* Your table or list content here */}
        <EmptyState
          icon={<Package size={64} />}
          title="No products found"
          description="Try adjusting your filters"
        />
      </Card>
    </div>
  );
}
```

## Benefits

1. **Consistency** - All pages look and feel the same
2. **Maintainability** - Update styling in one place
3. **Speed** - Build new pages faster
4. **Accessibility** - Built-in ARIA labels and keyboard support
5. **Responsive** - Mobile-friendly by default
6. **Type Safety** - Full TypeScript support

## Migration Guide

To migrate existing pages to use shared components:

1. Replace custom cards with `<Card>`
2. Replace stat displays with `<StatCard>`
3. Replace page headers with `<PageHeader>`
4. Replace filter sections with `<FilterBar>` and `<FilterDropdown>`
5. Replace tab navigation with `<TabSystem>`
6. Replace custom buttons with `<Button>`
7. Replace status badges with `<Badge>`
8. Replace empty states with `<EmptyState>`
9. Replace loading indicators with `<LoadingSpinner>`
