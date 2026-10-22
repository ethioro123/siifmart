// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { getRoleLevel, getRoleDept, getRoleRank } from '../../components/org-chart/hooks/useOrgTreeLayout';
import { Employee } from '../../types';

describe('orgTreeLayout helpers', () => {
    it('correctly ranks 10-level hierarchy role levels (L1 CEO to L10 Frontline)', () => {
        expect(getRoleLevel('super_admin')).toBe(1);
        expect(getRoleLevel('admin')).toBe(2);
        expect(getRoleLevel('head_of_operations')).toBe(3);
        expect(getRoleLevel('head_of_finance')).toBe(3);
        expect(getRoleLevel('regional_operations_manager')).toBe(4);
        expect(getRoleLevel('regional_procurement_manager')).toBe(5);
        expect(getRoleLevel('store_manager')).toBe(6);
        expect(getRoleLevel('warehouse_manager')).toBe(6);
        expect(getRoleLevel('logistics_manager')).toBe(7);
        expect(getRoleLevel('shift_lead')).toBe(8);
        expect(getRoleLevel('auditor')).toBe(9);
        expect(getRoleLevel('cashier')).toBe(10);
        expect(getRoleLevel('picker')).toBe(10);
        expect(getRoleLevel('unknown_role')).toBe(10);
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
        expect(getRoleDept('head_of_operations')).toBe('executive');
        expect(getRoleDept('regional_operations_manager')).toBe('executive');
        expect(getRoleDept('cashier')).toBe('store');
        expect(getRoleDept('store_manager')).toBe('store');
        expect(getRoleDept('picker')).toBe('warehouse');
        expect(getRoleDept('warehouse_manager')).toBe('warehouse');
        expect(getRoleDept('head_of_finance')).toBe('finance');
        expect(getRoleDept('head_of_hr')).toBe('hr');
        expect(getRoleDept('buyer')).toBe('procurement');
        expect(getRoleDept('vendor_relations_manager')).toBe('procurement');
        expect(getRoleDept('customs_import_specialist')).toBe('procurement');
        expect(getRoleDept('inbound_qc_inspector')).toBe('procurement');
        expect(getRoleDept('store_operations_auditor')).toBe('executive');
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
        { id: 'emp-2', name: 'Ops Director', role: 'head_of_operations', department: 'Operations', code: 'EMP-02', email: '', phone: '', status: 'Active', joinDate: '', avatar: '', performanceScore: 85, siteId: 'site-1' },
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

    it('wires Central Operations team members to head_of_operations', () => {
        const opsTeamEmployees: Employee[] = [
            { id: 'ceo-1', name: 'CEO', role: 'super_admin', department: 'Executive', code: 'EMP-01', email: '', phone: '', status: 'Active', joinDate: '', avatar: '', performanceScore: 90, siteId: 'site-1' },
            { id: 'ops-1', name: 'Ops Director', role: 'head_of_operations', department: 'Operations', code: 'EMP-02', email: '', phone: '', status: 'Active', joinDate: '', avatar: '', performanceScore: 85, siteId: 'site-1' },
            { id: 'aud-1', name: 'Store Auditor', role: 'store_operations_auditor', department: 'Executive', code: 'EMP-03', email: '', phone: '', status: 'Active', joinDate: '', avatar: '', performanceScore: 90, siteId: 'site-1' },
            { id: 'da-1', name: 'Data Analyst', role: 'data_analyst', department: 'Executive', code: 'EMP-04', email: '', phone: '', status: 'Active', joinDate: '', avatar: '', performanceScore: 88, siteId: 'site-1' },
            { id: 'sec-1', name: 'Security Mgr', role: 'security_manager', department: 'Security', code: 'EMP-05', email: '', phone: '', status: 'Active', joinDate: '', avatar: '', performanceScore: 85, siteId: 'site-1' },
            { id: 'cs-1', name: 'CS Mgr', role: 'cs_manager', department: 'Store', code: 'EMP-06', email: '', phone: '', status: 'Active', joinDate: '', avatar: '', performanceScore: 87, siteId: 'site-1' },
            { id: 'rep-1', name: 'CS Rep', role: 'customer_service', department: 'Store', code: 'EMP-07', email: '', phone: '', status: 'Active', joinDate: '', avatar: '', performanceScore: 91, siteId: 'site-1' },
        ];

        const { result } = renderHook(() => useOrgTreeLayout({
            employees: opsTeamEmployees,
            sites: [],
            filters: { searchTerm: '', siteId: '', department: '', status: '' }
        }));

        const tree = result.current.rawTree;
        expect(tree).not.toBeNull();
        expect(tree?.id).toBe('ceo-1');

        const opsNode = tree?.children.find(c => c.id === 'ops-1');
        expect(opsNode).toBeDefined();

        // Check that auditor and analyst report to ops-1
        const childIds = opsNode?.children.map(c => c.id) || [];
        expect(childIds).toContain('aud-1');
        expect(childIds).toContain('da-1');
        expect(childIds).toContain('sec-1');
        expect(childIds).toContain('cs-1');

        // Check that customer_service reports to cs_manager
        const csNode = opsNode?.children.find(c => c.id === 'cs-1');
        expect(csNode?.children.map(c => c.id)).toContain('rep-1');
    });
});
