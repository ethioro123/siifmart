# 📘 Job Assignment System - Quick Reference Guide

## 🎯 Overview
The job assignment system allows managers to assign WMS jobs (PICK, PACK, PUTAWAY) to specific employees, track their progress, and measure performance.

---

## 🚀 Quick Start

### 1. Run Database Migration (ONE TIME)
```sql
-- In Supabase SQL Editor, paste and execute:
-- File: create_job_assignments_table.sql
```

### 2. Assign a Job (Code Example)
```typescript
// In your component or context:
const { assignJob, employees, jobs } = useData();

// Find an available picker
const picker = employees.find(e => e.role === 'picker');

// Find a pending PICK job
const pickJob = jobs.find(j => j.type === 'PICK' && j.status === 'Pending');

// Assign it!
await assignJob(pickJob.id, picker.id);
// or
await assignJob(pickJob.id, picker.name);
```

---

## 📋 API Reference

### `assignJob(jobId, employeeIdOrName)`

**Parameters:**
- `jobId` (string) - ID of the WMS job to assign
- `employeeIdOrName` (string) - Employee ID or name

**Returns:** `Promise<void>`

**Behavior:**
1. Validates job exists
2. Validates employee exists (by ID or name)
3. Checks employee workload (max 3 active jobs)
4. Estimates duration based on job type
5. Creates JobAssignment record
6. Updates job status to 'In-Progress'
7. Shows success/error notification

**Example:**
```typescript
try {
  await assignJob('job-123', 'emp-456');
  // Success! Job assigned
} catch (error) {
  // Error handled automatically with notification
}
```

---

## 🔢 Duration Estimation

The system automatically estimates how long a job will take:

| Job Type | Formula | Example |
|----------|---------|---------|
| **PICK** | `max(15, items × 3)` min | 10 items = 30 min |
| **PACK** | `max(10, items × 2)` min | 5 items = 10 min |
| **PUTAWAY** | `max(20, items × 4)` min | 8 items = 32 min |

---

## 🚦 Workload Limits

**Rule:** Each employee can have maximum **3 active jobs** simultaneously.

**Active statuses:**
- `Assigned` - Job assigned, not started
- `Accepted` - Employee accepted the job
- `In-Progress` - Currently working

**Inactive statuses:**
- `Paused` - Temporarily stopped
- `Completed` - Finished
- `Cancelled` - Cancelled

**Example:**
```typescript
// This will fail if employee already has 3 active jobs:
await assignJob(jobId, employeeId);
// Error: "John Doe already has 3 active jobs"
```

---

## 📊 Querying Assignments

### Get All Assignments for a Site
```typescript
import { jobAssignmentsService } from './services/supabase.service';

const assignments = await jobAssignmentsService.getAll(siteId);
```

### Get Employee's Assignments
```typescript
const myAssignments = await jobAssignmentsService.getByEmployeeId(employeeId);

// Only active ones:
const activeAssignments = await jobAssignmentsService.getByEmployeeId(
  employeeId, 
  'In-Progress'
);
```

### Get Assignments for a Job
```typescript
const jobAssignments = await jobAssignmentsService.getByJobId(jobId);
```

### Get Employee Performance
```typescript
const metrics = await jobAssignmentsService.getEmployeeMetrics(employeeId);
// Returns: {
//   totalJobs: 45,
//   completedJobs: 42,
//   avgDurationMinutes: 28.5,
//   avgAccuracyRate: 97.8,
//   totalUnitsProcessed: 450,
//   lastCompletedAt: '2025-11-25T01:30:00Z'
// }
```

---

## 🔄 Assignment Lifecycle

```
┌─────────────┐
│   Assigned  │ ← Job assigned to employee
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   Accepted  │ ← Employee accepts (future feature)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ In-Progress │ ← Employee starts work
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  Completed  │ ← Job finished
└─────────────┘
```

---

## 🎨 UI Integration (Future)

### Assignment Modal Example
```typescript
function AssignJobModal({ job, onClose }) {
  const { employees, assignJob } = useData();
  const [selectedEmployee, setSelectedEmployee] = useState('');

  // Filter employees by role
  const availableWorkers = employees.filter(e => {
    if (job.type === 'PICK') return e.role === 'picker';
    if (job.type === 'PACK') return e.role === 'wms';
    if (job.type === 'PUTAWAY') return e.role === 'wms';
    return false;
  });

  const handleAssign = async () => {
    await assignJob(job.id, selectedEmployee);
    onClose();
  };

  return (
    <Modal>
      <h2>Assign {job.type} Job</h2>
      <select onChange={e => setSelectedEmployee(e.target.value)}>
        <option value="">Select Employee...</option>
        {availableWorkers.map(emp => (
          <option key={emp.id} value={emp.id}>
            {emp.name} - {emp.role}
          </option>
        ))}
      </select>
      <button onClick={handleAssign}>Assign Job</button>
    </Modal>
  );
}
```

---

## 🧪 Testing

### Test Assignment Flow
```typescript
// 1. Create a test job
const testJob = {
  id: 'test-job-1',
  type: 'PICK',
  items: 5,
  status: 'Pending',
  // ... other fields
};

// 2. Create a test employee
const testEmployee = {
  id: 'test-emp-1',
  name: 'Test Picker',
  role: 'picker',
  // ... other fields
};

// 3. Assign
await assignJob(testJob.id, testEmployee.id);

// 4. Verify in database
const assignment = await jobAssignmentsService.getByJobId(testJob.id);
console.log(assignment);
// Should show:
// - employeeId: 'test-emp-1'
// - status: 'Assigned'
// - estimatedDuration: 15 (5 items × 3 min)
```

---

## ⚠️ Error Handling

The system handles these errors automatically:

| Error | Message | Cause |
|-------|---------|-------|
| Job not found | "Job not found" | Invalid jobId |
| Employee not found | "Employee not found" | Invalid employeeId/name |
| Workload exceeded | "{name} already has {count} active jobs" | Employee has 3+ active jobs |
| Database error | "Failed to assign job" | Supabase error |

All errors show user notifications automatically.

---

## 📈 Performance Metrics

### Tracked Automatically:
1. **Estimated Duration** - Set when assigned
2. **Actual Duration** - Calculated when completed (trigger)
3. **Units Processed** - Updated manually
4. **Accuracy Rate** - Updated manually

### Analytics Views:
```sql
-- Active assignments
SELECT * FROM active_job_assignments;

-- Employee performance
SELECT * FROM employee_performance_metrics 
WHERE employee_id = 'emp-123';
```

---

## 🔐 Security (RLS Policies)

**Who can do what:**

| Action | Allowed Roles |
|--------|---------------|
| **View** assignments | All users (site-filtered) |
| **Create** assignments | super_admin, admin, manager, wms, warehouse_manager |
| **Update** assignments | Assigned employee OR managers |
| **Delete** assignments | super_admin, admin only |

---

## 🎯 Next Features (Roadmap)

1. **Employee Dashboard**
   - View my assigned jobs
   - Accept/reject assignments
   - Start/pause/complete jobs

2. **Manager Dashboard**
   - See all assignments
   - Reassign jobs
   - View team performance

3. **Auto-Assignment**
   - Automatically assign jobs based on:
     - Employee availability
     - Skill level
     - Current workload
     - Zone proximity

4. **Push Notifications**
   - Notify employees of new assignments
   - Remind about pending jobs
   - Alert on overdue jobs

---

## 📞 Support

**Documentation:**
- Full implementation plan: `FULFILLMENT_IMPLEMENTATION_PLAN.md`
- Implementation summary: `JOB_ASSIGNMENT_IMPLEMENTATION.md`

**Database Schema:**
- Migration script: `create_job_assignments_table.sql`

**Code Locations:**
- Types: `types.ts` (line ~170)
- Service: `services/supabase.service.ts` (line ~1350)
- Context: `contexts/DataContext.tsx` (assignJob function)
