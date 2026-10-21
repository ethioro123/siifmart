-- Migration: Harmonize staging password for regional merchandising leads to StagingPassword123!
UPDATE auth.users
SET encrypted_password = '$2a$06$7OQ6CgX7LREBtbhlFTz/6uxUv0ZUcpii18RH5zr/eQ/JvMalp2HXe'
WHERE email IN (
  'et.add.regionalmerchandisinglead@staging.siifmart.com',
  'ke.nrb.regionalmerchandisinglead@staging.siifmart.com'
);
