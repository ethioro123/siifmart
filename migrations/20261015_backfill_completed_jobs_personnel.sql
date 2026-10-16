-- Migration: Backfill and normalize completed fulfillment jobs personnel attribution
-- Description: Ensures all completed WMS jobs reference verified staff members and never render as Unknown User.

-- 1. Where assigned_to is present and completed_by is empty/null, set completed_by = assigned_to
UPDATE wms_jobs
SET completed_by = assigned_to
WHERE status = 'Completed' AND (completed_by IS NULL OR completed_by = '') AND assigned_to IS NOT NULL AND assigned_to != '';

-- 2. Where completed_by is still empty/null, attribute to the facility's designated operations manager
-- Eastleigh 01 -> Kennedy Odhiambo (7e39c928-f0b8-4a40-8d51-4fd6ce569aae)
UPDATE wms_jobs
SET completed_by = '7e39c928-f0b8-4a40-8d51-4fd6ce569aae'
WHERE status = 'Completed' AND (completed_by IS NULL OR completed_by = '') AND site_id = 'b74b26ff-da36-4381-912c-63c2b45b5d16';

-- Harar Logistics Hub -> Kamal Idriss (93a1f30a-bf39-4e82-a9a9-0b043639e852)
UPDATE wms_jobs
SET completed_by = '93a1f30a-bf39-4e82-a9a9-0b043639e852'
WHERE status = 'Completed' AND (completed_by IS NULL OR completed_by = '') AND site_id = '96719be0-77de-4445-a8fe-e9713111255a';

-- AMBO DC -> Abdi ahmed (8bce2bda-0b27-4e23-ba82-3bd2e96fbee7)
UPDATE wms_jobs
SET completed_by = '8bce2bda-0b27-4e23-ba82-3bd2e96fbee7'
WHERE status = 'Completed' AND (completed_by IS NULL OR completed_by = '') AND site_id = 'b2293359-9b3b-4468-9c2f-8a6e288791e3';

-- Dire Dawa Storage -> Sultan Aliyi (c133c882-4cd6-4b5d-8f32-fc15ef074dcc)
UPDATE wms_jobs
SET completed_by = 'c133c882-4cd6-4b5d-8f32-fc15ef074dcc'
WHERE status = 'Completed' AND (completed_by IS NULL OR completed_by = '') AND site_id = '1a76065e-fd57-4344-b2fe-9f7f0eb347a6';

-- Adama DC -> Ahmed Hassan (c17ad8da-48ab-44df-9174-977d681ce225)
UPDATE wms_jobs
SET completed_by = 'c17ad8da-48ab-44df-9174-977d681ce225'
WHERE status = 'Completed' AND (completed_by IS NULL OR completed_by = '') AND site_id = '97452359-705d-44dd-b2de-1002d6c19a81';

-- Kileleshwa Store -> Makena Benson (f1a240b2-fe31-4c02-bd88-7a3a3657e659)
UPDATE wms_jobs
SET completed_by = 'f1a240b2-fe31-4c02-bd88-7a3a3657e659'
WHERE status = 'Completed' AND (completed_by IS NULL OR completed_by = '') AND site_id = '4b8e7cd9-5af3-4bdd-b561-11d8fa7730af';

-- Fallback for any remaining unassigned completed jobs to Central Operations
UPDATE wms_jobs
SET completed_by = '0e045a53-fe4b-49f2-90a7-aa11984fbab4'
WHERE status = 'Completed' AND (completed_by IS NULL OR completed_by = '');
