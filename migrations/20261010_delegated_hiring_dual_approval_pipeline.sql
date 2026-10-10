-- ============================================================================
-- Migration: 20261010_delegated_hiring_dual_approval_pipeline.sql
-- Description:
-- Adds columns to job_candidates to support the Delegated Sourcing & 
-- Dual-Approval Hiring Pipeline (Manager Sourcing -> HR Vetting -> Finance Salary Approval -> Synaptic Activation)
-- ============================================================================

ALTER TABLE public.job_candidates
ADD COLUMN IF NOT EXISTS hr_approved_by text,
ADD COLUMN IF NOT EXISTS hr_approved_at timestamptz,
ADD COLUMN IF NOT EXISTS hr_notes text,
ADD COLUMN IF NOT EXISTS finance_approved_by text,
ADD COLUMN IF NOT EXISTS finance_approved_at timestamptz,
ADD COLUMN IF NOT EXISTS finance_notes text,
ADD COLUMN IF NOT EXISTS hired_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS site_id text,
ADD COLUMN IF NOT EXISTS role text;
