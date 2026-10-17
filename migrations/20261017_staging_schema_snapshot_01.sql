-- Staging schema snapshot, part 01 of 16.
SET search_path = public, extensions, auth;
-- Staging-only, schema-only snapshot of the live SIIFMART database.
-- Intentionally excludes all production rows, Auth users, Storage objects, and secrets.
SET search_path = public, extensions, auth;
-- Required public extension used by production indexes.
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE TYPE public."fulfillment_strategy_type" AS ENUM ('LOCAL_ONLY', 'NEAREST', 'SPLIT', 'MANUAL');
CREATE SEQUENCE public."po_number_seq" AS bigint INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1 NO CYCLE;
CREATE SEQUENCE public."shift_number_seq" AS bigint INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 4 CACHE 1 NO CYCLE;
CREATE SEQUENCE public."wallet_ledger_entries_id_seq" AS bigint INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1 NO CYCLE;
-- Tables and columns.
CREATE TABLE public."agent_deposits" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "agent_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "amount_cents" bigint NOT NULL,
  "currency_code" text NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
  "confirmed_at" timestamp(6) with time zone
);
CREATE TABLE public."agents" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "phone" text,
  "region_code" text,
  "latitude" double precision,
  "longitude" double precision,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "daily_limit_cents" bigint DEFAULT 0,
  "created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."ar_invoices" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "invoice_number" text NOT NULL,
  "customer_id" text NOT NULL,
  "customer_name" text NOT NULL,
  "site_id" text NOT NULL,
  "country_code" character varying(2) DEFAULT 'ET'::character varying NOT NULL,
  "invoice_date" date DEFAULT CURRENT_DATE NOT NULL,
  "due_date" date NOT NULL,
  "subtotal" numeric(15,2) DEFAULT 0 NOT NULL,
  "tax_amount" numeric(15,2) DEFAULT 0 NOT NULL,
  "total_amount" numeric(15,2) DEFAULT 0 NOT NULL,
  "amount_paid" numeric(15,2) DEFAULT 0 NOT NULL,
  "balance_due" numeric(15,2) DEFAULT 0 NOT NULL,
  "currency" character varying(5) DEFAULT 'ETB'::character varying NOT NULL,
  "payment_terms" character varying(20) DEFAULT 'Net_30'::character varying NOT NULL,
  "status" character varying(20) DEFAULT 'Issued'::character varying NOT NULL,
  "notes" text,
  "created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."barcode_approvals" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL,
  "barcode" text NOT NULL,
  "image_url" text,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "site_id" uuid,
  "created_by" uuid,
  "created_at" timestamp(6) with time zone DEFAULT now(),
  "reviewed_by" uuid,
  "reviewed_at" timestamp(6) with time zone,
  "rejection_reason" text,
  "country_code" character varying(10) DEFAULT 'ET'::character varying NOT NULL
);
CREATE TABLE public."brainstorm_nodes" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "description" text DEFAULT ''::text,
  "department" text DEFAULT 'general'::text,
  "priority" text DEFAULT 'medium'::text,
  "status" text DEFAULT 'idea'::text,
  "x" numeric DEFAULT 100,
  "y" numeric DEFAULT 100,
  "connections" text[] DEFAULT '{}'::text[],
  "created_by" text DEFAULT 'System'::text,
  "created_at" timestamp(6) with time zone DEFAULT now(),
  "updated_at" timestamp(6) with time zone DEFAULT now(),
  "due_date" timestamp(6) with time zone,
  "progress" integer DEFAULT 0,
  "tags" text[] DEFAULT '{}'::text[],
  "is_starred" boolean DEFAULT false,
  "completed_at" timestamp(6) with time zone,
  "notes" text DEFAULT ''::text,
  "color" text
);
CREATE TABLE public."category_zones" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid,
  "category" text NOT NULL,
  "default_zone" text NOT NULL,
  "created_at" timestamp(6) with time zone DEFAULT now(),
  "updated_at" timestamp(6) with time zone DEFAULT now()
);
CREATE TABLE public."chart_of_accounts" (
  "code" character varying(10) NOT NULL,
  "name" text NOT NULL,
  "category" character varying(20) NOT NULL,
  "sub_category" text,
  "normal_balance" character varying(6) DEFAULT 'Debit'::character varying NOT NULL,
  "country_code" character varying(2) DEFAULT 'ET'::character varying NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."currencies" (
  "code" text NOT NULL,
  "name" text NOT NULL,
  "symbol" text NOT NULL,
  "decimals" smallint DEFAULT 2 NOT NULL
);
CREATE TABLE public."customer_credit_limits" (
  "customer_id" text NOT NULL,
  "customer_name" text NOT NULL,
  "credit_limit" numeric(15,2) DEFAULT 0 NOT NULL,
  "current_outstanding" numeric(15,2) DEFAULT 0 NOT NULL,
  "is_hold" boolean DEFAULT false NOT NULL,
  "hold_reason" text,
  "country_code" character varying(2) DEFAULT 'ET'::character varying NOT NULL,
  "updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."customers" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "name" character varying(200) NOT NULL,
  "phone" character varying(20) NOT NULL,
  "email" character varying(200),
  "loyalty_points" integer DEFAULT 0,
  "total_spent" numeric(10,2) DEFAULT 0,
  "last_visit" date,
  "tier" character varying(20) DEFAULT 'Bronze'::character varying,
  "notes" text,
  "created_at" timestamp(6) with time zone DEFAULT now(),
  "updated_at" timestamp(6) with time zone DEFAULT now()
);
CREATE TABLE public."customs_declarations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "declaration_number" character varying(100) NOT NULL,
  "country_code" character varying(10) DEFAULT 'ET'::character varying NOT NULL,
  "port_of_entry" character varying(100) NOT NULL,
  "transport_mode" character varying(50) DEFAULT 'Sea / Maritime'::character varying NOT NULL,
  "carrier_name" character varying(200),
  "bill_of_lading" character varying(100),
  "letter_of_credit_ref" character varying(100),
  "clearing_agent" character varying(200),
  "customs_status" character varying(50) DEFAULT 'Submitted'::character varying NOT NULL,
  "duty_amount" numeric(15,2) DEFAULT 0.00,
  "currency" character varying(10) DEFAULT 'ETB'::character varying NOT NULL,
  "eta" date,
  "cleared_at" timestamp(6) with time zone,
  "associated_po_numbers" text[] DEFAULT '{}'::text[],
  "specialist_id" character varying(100),
  "specialist_name" character varying(200),
  "notes" text,
  "created_at" timestamp(6) with time zone DEFAULT now(),
  "cleared_by" character varying(200),
  "cleared_by_role" character varying(100)
);
CREATE TABLE public."deliveries" (
  "trip_id" uuid NOT NULL,
  "package_type" text,
  "declared_value_cents" bigint,
  "recipient_name" text,
  "recipient_phone" text,
  "recipient_verified" boolean DEFAULT false,
  "instructions" text
);
CREATE TABLE public."department_budgets" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "country_code" character varying(2) DEFAULT 'ET'::character varying NOT NULL,
  "site_id" text NOT NULL,
  "department" text NOT NULL,
  "category" text NOT NULL,
  "fiscal_year" integer NOT NULL,
  "fiscal_quarter" integer NOT NULL,
  "budgeted_amount" numeric(15,2) DEFAULT 0 NOT NULL,
  "actual_spent" numeric(15,2) DEFAULT 0 NOT NULL,
  "alert_threshold_pct" numeric(5,2) DEFAULT 85.00 NOT NULL,
  "approved_by_id" uuid,
  "created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."disciplinary_records" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "country_code" character varying(10) DEFAULT 'ET'::character varying NOT NULL,
  "site_id" text,
  "employee_id" uuid NOT NULL,
  "employee_name" text NOT NULL,
  "record_type" text NOT NULL,
  "severity" text DEFAULT 'Medium'::text NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "action_taken" text NOT NULL,
  "appeal_status" text DEFAULT 'None'::text NOT NULL,
  "issued_by" text NOT NULL,
  "issued_by_role" text NOT NULL,
  "issued_at" timestamp(6) with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "expires_at" date,
  "confidential_notes" text,
  "created_at" timestamp(6) with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE public."discount_codes" (
  "id" text DEFAULT (gen_random_uuid())::text NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "type" text NOT NULL,
  "value" numeric NOT NULL,
  "min_purchase_amount" numeric DEFAULT 0,
  "max_discount_amount" numeric,
  "valid_from" timestamp(6) with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "valid_until" timestamp(6) with time zone NOT NULL,
  "usage_limit" integer,
  "usage_count" integer DEFAULT 0 NOT NULL,
  "per_customer_limit" integer,
  "status" text DEFAULT 'Active'::text NOT NULL,
  "applicable_sites" text[],
  "description" text,
  "created_by" text,
  "created_at" timestamp(6) with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp(6) with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "country_code" text DEFAULT 'ET'::text NOT NULL,
  "currency" text DEFAULT 'ETB'::text
);
CREATE TABLE public."discrepancy_claims" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "resolution_id" uuid,
  "claim_type" text,
  "claim_number" text,
  "claim_status" text DEFAULT 'submitted'::text,
  "claim_amount" numeric(10,2) NOT NULL,
  "approved_amount" numeric(10,2),
  "submitted_at" timestamp(6) with time zone DEFAULT now(),
  "reviewed_at" timestamp(6) with time zone,
  "paid_at" timestamp(6) with time zone,
  "carrier_name" text,
  "tracking_number" text,
  "documents" jsonb,
  "notes" text
);
CREATE TABLE public."discrepancy_resolutions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "transfer_id" text NOT NULL,
  "line_item_index" integer NOT NULL,
  "product_id" uuid,
  "expected_qty" integer NOT NULL,
  "received_qty" integer NOT NULL,
  "variance" integer GENERATED ALWAYS AS ((received_qty - expected_qty)) STORED,
  "discrepancy_type" text,
  "resolution_type" text,
  "resolution_status" text DEFAULT 'pending'::text,
  "resolution_notes" text,
  "reason_code" text,
  "estimated_value" numeric(10,2),
  "claim_amount" numeric(10,2),
  "photo_urls" text[],
  "reported_by" text,
  "resolved_by" text,
  "approved_by" text,
  "created_at" timestamp(6) with time zone DEFAULT now(),
  "resolved_at" timestamp(6) with time zone,
  "site_id" uuid,
  "resolve_qty" integer,
  "replacement_job_id" text
);
CREATE TABLE public."drivers" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "vehicle_type" text,
  "plate_number" text,
  "verification_status" text DEFAULT 'pending'::text NOT NULL,
  "reliability_score" numeric(4,2) DEFAULT 5.0,
  "accepts_cash" boolean DEFAULT false,
  "accepts_delivery" boolean DEFAULT false,
  "created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
  "full_name" text,
  "phone" text,
  "current_lat" double precision,
  "current_lng" double precision,
  "is_online" boolean DEFAULT true,
  "region_code" text
);
CREATE TABLE public."employee_change_requests" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "employee_id" uuid NOT NULL,
  "employee_name" text NOT NULL,
  "country_code" character varying(10) DEFAULT 'ET'::character varying NOT NULL,
  "site_id" text,
  "requested_by" text NOT NULL,
  "requested_by_role" text DEFAULT 'hr'::text NOT NULL,
  "requested_at" timestamp(6) with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "governance_category" text DEFAULT 'composite'::text NOT NULL,
  "required_approvers" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "diffs" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "full_proposed_employee" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "reason" text NOT NULL,
  "approved_by" text,
  "approved_by_role" text,
  "approved_at" timestamp(6) with time zone,
  "rejection_reason" text,
  "rejected_by" text,
  "rejected_at" timestamp(6) with time zone,
  "created_at" timestamp(6) with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp(6) with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE public."employee_documents" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "country_code" character varying(10) DEFAULT 'ET'::character varying NOT NULL,
  "employee_id" uuid NOT NULL,
  "name" text NOT NULL,
  "doc_type" text NOT NULL,
  "file_url" text NOT NULL,
  "file_size" integer,
  "mime_type" text,
  "expiry_date" date,
  "verified" boolean DEFAULT false NOT NULL,
  "verified_by" text,
  "verified_at" timestamp(6) with time zone,
  "uploaded_by" text NOT NULL,
  "created_at" timestamp(6) with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE public."employee_tasks" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "assigned_to" text NOT NULL,
  "status" text DEFAULT 'Pending'::text NOT NULL,
  "priority" text DEFAULT 'Medium'::text NOT NULL,
  "due_date" date NOT NULL,
  "site_id" text,
  "created_by" text,
  "created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
  "region_code" text,
  "task_type" text DEFAULT 'GENERAL'::text
);
CREATE TABLE public."employees" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "site_id" uuid,
  "name" character varying(200) NOT NULL,
  "role" character varying(50) NOT NULL,
  "email" character varying(200) NOT NULL,
  "phone" character varying(20),
  "status" character varying(20) DEFAULT 'Active'::character varying,
  "join_date" date NOT NULL,
  "department" character varying(100),
  "avatar" text,
  "performance_score" integer,
  "specialization" character varying(200),
  "salary" numeric(10,2),
  "badges" jsonb,
  "attendance_rate" numeric(5,2),
  "created_at" timestamp(6) with time zone DEFAULT now(),
  "updated_at" timestamp(6) with time zone DEFAULT now(),
  "code" text,
  "last_login_gps" text,
  "last_login_at" timestamp(6) with time zone,
  "last_login_device" text,
  "login_history" jsonb DEFAULT '[]'::jsonb,
  "age" integer,
  "date_of_birth" date,
  "region_code" text,
  "scope_level" text DEFAULT 'HQ'::text NOT NULL,
  "emergency_contact" text,
  "address" text,
  "national_id_number" text,
  "home_site_id" text,
  "is_loaned" boolean DEFAULT false,
  "loaned_at" timestamp(6) with time zone,
  "quota_approved_by" text,
  "onboarding_tier" text DEFAULT 'FRONTLINE_FAST_TRACK'::text,
  "quota_status" text DEFAULT 'WITHIN_QUOTA'::text,
  "credentials_handed_over_at" timestamp(6) with time zone,
  "credentials_handed_over_by" text,
  "job_title" text NOT NULL
);
CREATE TABLE public."expenses" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "site_id" uuid,
  "expense_date" date NOT NULL,
  "category" character varying(50) NOT NULL,
  "description" text NOT NULL,
  "amount" numeric(10,2) NOT NULL,
  "status" character varying(20) DEFAULT 'Pending'::character varying,
  "approved_by" character varying(200),
  "created_at" timestamp(6) with time zone DEFAULT now(),
  "updated_at" timestamp(6) with time zone DEFAULT now(),
  "created_by_id" uuid,
  "created_by_name" text,
  "approved_by_id" uuid,
  "approved_at" timestamp(6) with time zone,
  "void_reason" text,
  "voided_by_id" uuid,
  "voided_by_name" text,
  "voided_at" timestamp(6) with time zone,
  "payment_ref" text,
  "country_code" character varying(2) DEFAULT 'ET'::character varying,
  "escalated_to_ceo" boolean DEFAULT false,
  "escalation_reason" text,
  "region_code" text,
  "requires_hq_approval" boolean DEFAULT false,
  "hq_approved_by" text,
  "hq_approved_at" timestamp(6) with time zone
);
CREATE TABLE public."facility_headcount_quotas" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "site_id" text NOT NULL,
  "role" text NOT NULL,
  "approved_quota" integer DEFAULT 5 NOT NULL,
  "standard_grade" text DEFAULT 'L4-GRADE-1'::text NOT NULL,
  "max_monthly_salary" numeric(12,2) DEFAULT 35000.00,
  "country_code" character varying(2) DEFAULT 'ET'::character varying NOT NULL,
  "created_at" timestamp(6) with time zone DEFAULT now(),
  "updated_at" timestamp(6) with time zone DEFAULT now()
);
CREATE TABLE public."farmer_programs" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "country_code" character varying(10) DEFAULT 'ET'::character varying NOT NULL,
  "program_name" character varying(200) NOT NULL,
  "cooperative_name" character varying(200) NOT NULL,
  "region" character varying(100) NOT NULL,
  "primary_crops" text[] DEFAULT '{}'::text[],
  "member_count" integer DEFAULT 0,
  "lead_contact" character varying(200),
  "phone" character varying(50),
  "fair_trade_certified" boolean DEFAULT true,
  "organic_certified" boolean DEFAULT false,
  "status" character varying(50) DEFAULT 'Active'::character varying NOT NULL,
  "manager_name" character varying(200),
  "created_at" timestamp(6) with time zone DEFAULT now()
);
RESET search_path;
