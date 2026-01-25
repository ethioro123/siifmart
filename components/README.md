# Components Reference

This directory contains reusable UI components for SIIFMART.

## Core Components

### Layout
| Component | Description |
|-----------|-------------|
| `Layout.tsx` | Main app shell with sidebar |
| `Sidebar.tsx` | Navigation sidebar with role-based links |
| `TopBar.tsx` | Header with search, notifications, user menu |
| `ProtectedRoute.tsx` | Route guard with module permissions |

### Modals
| Component | Description |
|-----------|-------------|
| `Modal.tsx` | Base modal wrapper with close button |
| `UnknownBarcodeModal.tsx` | Barcode-to-product mapping flow |
| `GlobalErrorBoundary.tsx` | App-wide error catching |

### Data Display
| Component | Description |
|-----------|-------------|
| `DataTable.tsx` | Server-paginated table component |
| `MetricCard.tsx` | KPI cards for dashboards |
| `StatusBadge.tsx` | Color-coded status indicators |

### Forms
| Component | Description |
|-----------|-------------|
| `ProductForm.tsx` | Product create/edit form |
| `SearchInput.tsx` | Debounced search input |

## Usage Example

```tsx
import Modal from '../components/Modal';

<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Confirm Action"
  size="md" // 'sm' | 'md' | 'lg' | 'xl'
>
  <p>Modal content here</p>
</Modal>
```

## Styling Guidelines
- Use Tailwind utility classes
- Follow cyber/dark theme tokens
- Avoid inline styles (use CSS variables for dynamic values)
