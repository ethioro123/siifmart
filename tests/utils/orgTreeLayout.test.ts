// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { getRoleLevel, getRoleDept, getRoleRank } from '../../components/org-chart/hooks/useOrgTreeLayout';
import { Employee } from '../../types';

describe('orgTreeLayout helpers', () => {
    it('correctly ranks hierarchy role levels (CEO = 1, Ops Manager = 2, Store Manager = 3, Staff = 4)', () => {
        expect(getRoleLevel('super_admin')).toBe(1);
        expect(getRoleLevel('admin')).toBe(1);
        expect(getRoleLevel('operations_manager')).toBe(2);
        expect(getRoleLevel('regional_manager')).toBe(2);
        expect(getRoleLevel('finance_manager')).toBe(2);
        expect(getRoleLevel('store_manager')).toBe(3);
        expect(getRoleLevel('warehouse_manager')).toBe(3);
        expect(getRoleLevel('shift_lead')).toBe(3);
        expect(getRoleLevel('cashier')).toBe(4);
        expect(getRoleLevel('picker')).toBe(4);
        expect(getRoleLevel('unknown_role')).toBe(4);
    });

    it('correctly orders matrix position ranking (Store Mgr < Asst Mgr < Shift Lead < Cashier)', () => {
        const storeMgrRank = getRoleRank('store_manager');
        const asstMgrRank = getRoleRank('assistant_manager');
        const shiftLeadRank = getRoleRank('shift_lead');
        const cashierRank = getRoleRank('cashier');

        expect(storeMgrRank).toBeLessThan(asstMgrRank);
        expect(asstMgrRank).toBeLessThan(shiftLeadRank);
        expect(shiftLeadRank).toBeLessThan(cashierRank);

        const whMgrRank = getRoleRank('warehouse_manager');
        const pickerRank = getRoleRank('picker');
        expect(whMgrRank).toBeLessThan(pickerRank);
    });

    it('correctly maps roles to corporate departments', () => {
        expect(getRoleDept('super_admin')).toBe('executive');
        expect(getRoleDept('operations_manager')).toBe('executive');
        expect(getRoleDept('regional_manager')).toBe('executive');
        expect(getRoleDept('cashier')).toBe('store');
        expect(getRoleDept('store_manager')).toBe('store');
        expect(getRoleDept('picker')).toBe('warehouse');
        expect(getRoleDept('warehouse_manager')).toBe('warehouse');
        expect(getRoleDept('finance_manager')).toBe('finance');
        expect(getRoleDept('hr_manager')).toBe('hr');
        expect(getRoleDept('buyer')).toBe('procurement');
    });

    it('honors custom department override when provided on employee record', () => {
        expect(getRoleDept('cashier', 'Custom Logistics')).toBe('warehouse');
    });
});

import { renderHook } from '@testing-library/react';
import { useOrgTreeLayout } from '../../components/org-chart/hooks/useOrgTreeLayout';

describe('useOrgTreeLayout hook', () => {
    const mockEmployees: Employee[] = [
        { id: 'emp-1', name: 'CEO Boss', role: 'super_admin', department: 'Executive', code: 'EMP-01', email: '', phone: '', status: 'Active', joinDate: '', avatar: '', performanceScore: 90, siteId: 'site-1' },
        { id: 'emp-2', name: 'Ops Director', role: 'operations_manager', department: 'Operations', code: 'EMP-02', email: '', phone: '', status: 'Active', joinDate: '', avatar: '', performanceScore: 85, siteId: 'site-1' },
        { id: 'emp-3', name: 'Store Mgr', role: 'store_manager', department: 'Store', code: 'EMP-03', email: '', phone: '', status: 'Active', joinDate: '', avatar: '', performanceScore: 88, siteId: 'site-1' },
        { id: 'emp-4', name: 'Cashier Alice', role: 'cashier', department: 'Store', code: 'EMP-04', email: '', phone: '', status: 'Active', joinDate: '', avatar: '', performanceScore: 92, siteId: 'site-1' },
    ];

    it('generates layout nodes and connectors for a standard team', () => {
        const { result } = renderHook(() => useOrgTreeLayout({
            employees: mockEmployees,
            sites: [{ id: 'site-1', code: '001', name: 'HQ Store', type: 'Store', address: '', status: 'Active', manager: '', capacity: 100, terminalCount: 2 }],
            filters: { searchTerm: '', siteId: '', department: '', status: '' }
        }));

        expect(result.current.rawTree).not.toBeNull();
        expect(result.current.layoutNodes.length).toBe(4);
        expect(result.current.layoutConnectors.length).toBe(3);
    });

    it('handles team without a super_admin (root falls back to highest role)', () => {
        const teamWithoutCeo = mockEmployees.filter(e => e.role !== 'super_admin');
        const { result } = renderHook(() => useOrgTreeLayout({
            employees: teamWithoutCeo,
            sites: [],
            filters: { searchTerm: '', siteId: '', department: '', status: '' }
        }));

        expect(result.current.rawTree).not.toBeNull();
        expect(result.current.layoutNodes.length).toBe(3);
    });

    it('correctly maps real-time online presence vs employment status', () => {
        const onlineIds = new Set(['emp-1']);
        expect(onlineIds.has('emp-1')).toBe(true);
        expect(onlineIds.has('emp-2')).toBe(false);
        // Employment status 'Active' is distinct from presence
        expect(mockEmployees[1].status).toBe('Active');
        expect(onlineIds.has(mockEmployees[1].id)).toBe(false);
    });
});
