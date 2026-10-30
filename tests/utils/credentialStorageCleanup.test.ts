// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { purgeLegacyEmployeeCredentials } from '../../utils/credentialStorageCleanup';
it('removes old credential copies and local completion flags without removing unrelated preferences', () => {
    localStorage.clear();
    localStorage.setItem('siifmart_temp_pwd_employee', 'legacy');
    localStorage.setItem('siifmart_temp_pwd_by_code_staff', 'legacy');
    localStorage.setItem('siifmart_credentials_handed_over_employee', 'old');
    localStorage.setItem('theme', 'dark');
    purgeLegacyEmployeeCredentials(localStorage);
    expect(localStorage.length).toBe(1); expect(localStorage.getItem('theme')).toBe('dark');
});
