import { UserRole } from './auth';

export interface EmployeeTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // Employee ID
  status: 'Pending' | 'In-Progress' | 'Completed';
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  createdBy?: string; // Employee ID or name of who created the task
}

export interface StaffSchedule {
  id: string;
  siteId: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  role: string; // Role for this specific shift
  notes?: string;
  status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled';
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceRecord {
  date: string;
  checkIn: string;
  checkOut: string;
  status: 'Present' | 'Late' | 'Absent' | 'Leave';
  hoursWorked: number;
}

export interface Employee {
  id: string;
  code: string; // Simplified Display ID
  siteId: string;
  site_id?: string; // Supabase compatibility
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  status: 'Active' | 'On Leave' | 'Terminated' | 'Pending Approval';
  joinDate: string;
  department: string;
  avatar: string;
  performanceScore: number;
  specialization?: string;
  salary?: number;
  badges?: string[];
  attendanceRate?: number;
  address?: string;
  emergencyContact?: string;
  // Driver-specific fields
  driverType?: 'internal' | 'subcontracted' | 'owner_operator';
  vehicleType?: string; // e.g., "Van", "Truck", "Motorcycle"
  vehiclePlate?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  lastLoginGps?: string;
  last_login_gps?: string;
  lastLoginAt?: string;
  last_login_at?: string;
  lastLoginDevice?: string;
  last_login_device?: string;
  loginHistory?: any[];
  login_history?: any[];
}
