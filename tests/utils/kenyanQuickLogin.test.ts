import { describe, it, expect } from 'vitest';
import {
  checkIsLocalhost,
  KENYAN_QUICK_SITES,
  type KenyanSiteGroup
} from '../../components/login/KenyanQuickLogin';

describe('KenyanQuickLogin - Localhost Gating & Multi-Country Isolation', () => {
  describe('checkIsLocalhost security guard', () => {
    it('allows standard localhost hostnames in DEV mode', () => {
      expect(checkIsLocalhost('localhost', true)).toBe(true);
      expect(checkIsLocalhost('127.0.0.1', true)).toBe(true);
      expect(checkIsLocalhost('::1', true)).toBe(true);
      expect(checkIsLocalhost('app.localhost', true)).toBe(true);
    });

    it('strictly blocks when not in DEV mode (production builds)', () => {
      expect(checkIsLocalhost('localhost', false)).toBe(false);
      expect(checkIsLocalhost('127.0.0.1', false)).toBe(false);
      expect(checkIsLocalhost('::1', false)).toBe(false);
      expect(checkIsLocalhost('app.localhost', false)).toBe(false);
    });

    it('strictly blocks live production and cloud deployment hostnames even in DEV mode', () => {
      expect(checkIsLocalhost('siifmart.com', true)).toBe(false);
      expect(checkIsLocalhost('app.siifmart.com', true)).toBe(false);
      expect(checkIsLocalhost('siifmart-preview.vercel.app', true)).toBe(false);
      expect(checkIsLocalhost('siifmart.netlify.app', true)).toBe(false);
      expect(checkIsLocalhost('ethioro123.github.io', true)).toBe(false);
      expect(checkIsLocalhost('siifmart.onrender.com', true)).toBe(false);
    });

    it('blocks empty or missing hostnames', () => {
      expect(checkIsLocalhost('', true)).toBe(false);
    });
  });

  describe('KENYAN_QUICK_SITES tenant purity', () => {
    it('contains only Kenyan sites (KE- prefixed codes)', () => {
      KENYAN_QUICK_SITES.forEach((site: KenyanSiteGroup) => {
        expect(site.siteCode).toMatch(/^KE-\d+$/);
      });
    });

    it('contains all 3 verified Kenyan operating facilities', () => {
      const siteCodes = KENYAN_QUICK_SITES.map(s => s.siteCode);
      expect(siteCodes).toContain('KE-01'); // Kenya Central Operations
      expect(siteCodes).toContain('KE-02'); // Eastleigh 01
      expect(siteCodes).toContain('KE-03'); // Kileleshwa
    });

    it('contains exactly the 6 authenticated Kenyan workers with kenya123 password', () => {
      const allAccounts = KENYAN_QUICK_SITES.flatMap(s => s.accounts);
      expect(allAccounts).toHaveLength(6);

      allAccounts.forEach(account => {
        expect(account.code).toMatch(/^KE-SIIF\d{4}$/);
        expect(account.email).toMatch(/^ke-siif\d{4}@siifmart\.com$/);
        expect(account.password).toBe('kenya123');
        expect(account.name.trim().length).toBeGreaterThan(0);
        expect(account.role.trim().length).toBeGreaterThan(0);
      });
    });

    it('verifies exact worker profile mappings against Supabase credentials', () => {
      const allAccounts = KENYAN_QUICK_SITES.flatMap(s => s.accounts);

      const kamau = allAccounts.find(a => a.code === 'KE-SIIF0040');
      expect(kamau).toBeDefined();
      expect(kamau?.name).toBe('Kamau Ndenga');
      expect(kamau?.role).toBe('Regional Manager');
      expect(kamau?.email).toBe('ke-siif0040@siifmart.com');
      expect(kamau?.password).toBe('kenya123');

      const omondi = allAccounts.find(a => a.code === 'KE-SIIF0041');
      expect(omondi).toBeDefined();
      expect(omondi?.name).toBe('Omondi Samuel');
      expect(omondi?.role).toBe('Operations Manager');
      expect(omondi?.email).toBe('ke-siif0041@siifmart.com');
      expect(omondi?.password).toBe('kenya123');

      const makena = allAccounts.find(a => a.code === 'KE-SIIF0042');
      expect(makena).toBeDefined();
      expect(makena?.name).toBe('Makena Benson');
      expect(makena?.role).toBe('Store Manager');
      expect(makena?.email).toBe('ke-siif0042@siifmart.com');
      expect(makena?.password).toBe('kenya123');

      const musyoka = allAccounts.find(a => a.code === 'KE-SIIF0043');
      expect(musyoka).toBeDefined();
      expect(musyoka?.name).toBe('Musyoka Kioko');
      expect(musyoka?.role).toBe('HR Manager');
      expect(musyoka?.email).toBe('ke-siif0043@siifmart.com');
      expect(musyoka?.password).toBe('kenya123');

      const kennedy = allAccounts.find(a => a.code === 'KE-SIIF0044');
      expect(kennedy).toBeDefined();
      expect(kennedy?.name).toBe('Kennedy Odhiambo Odhiambo');
      expect(kennedy?.role).toBe('Warehouse Manager');
      expect(kennedy?.email).toBe('ke-siif0044@siifmart.com');
      expect(kennedy?.password).toBe('kenya123');

      const oscar = allAccounts.find(a => a.code === 'KE-SIIF0045');
      expect(oscar).toBeDefined();
      expect(oscar?.name).toBe('Oscar Kennedy');
      expect(oscar?.role).toBe('Procurement Manager');
      expect(oscar?.email).toBe('ke-siif0045@siifmart.com');
      expect(oscar?.password).toBe('kenya123');
    });

    it('strictly isolates Kenya: zero Ethiopian or other foreign accounts present', () => {
      const allAccounts = KENYAN_QUICK_SITES.flatMap(s => s.accounts);
      const foreignLeaked = allAccounts.filter(a => !a.code.startsWith('KE-'));
      expect(foreignLeaked).toHaveLength(0);
    });
  });
});
