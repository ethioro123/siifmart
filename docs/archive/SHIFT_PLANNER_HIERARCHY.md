# Shift Planner Hierarchy Implementation

## Overview
The Shift Planner has been upgraded to display employees in a hierarchical tree structure, matching the organization chart. This provides a clearer view of staffing across different departments and management levels.

## Key Features
1. **Hierarchical Grouping**: Employees are now grouped by:
   - CEO & Executive
   - System Admin
   - Finance
   - HR
   - Procurement
   - Retail Operations (Managers -> Supervisors -> Cashiers)
   - Warehouse Operations (Managers -> Dispatchers -> Pickers/Drivers)
   - Other Employees

2. **Visual Indentation**:
   - Section headers are clearly distinct with role-based colors and icons.
   - Employee rows are indented based on their level in the hierarchy.
   - Sub-departments are nested under their parent departments.

3. **Consistent Styling**:
   - Uses the same color coding and icons as the Org Chart.
   - Maintains the cyber-themed aesthetic.

## Technical Details
- **Component**: `components/ShiftPlanner.tsx`
- **Logic**: Adapted the recursive tree building logic from `OrgChart.tsx`.
- **Rendering**: Flattens the tree into a list of rows (Headers + Employees) for efficient table rendering while preserving hierarchy levels.

## Usage
Navigate to **Employees** -> **Shift Planner** tab to view the new hierarchical schedule view.
