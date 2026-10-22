import { useState, useMemo, useCallback } from 'react';
import { Employee, Site } from '../../../types';
import {
    OrgTreeNode,
    OrgLayoutNode,
    OrgConnectorPath,
    OrgChartFilterState,
    ROLE_LABELS
} from '../types';

const NODE_WIDTH = 230;
const NODE_HEIGHT = 116;
const HORIZONTAL_GAP = 36;
const VERTICAL_GAP = 68;

export {
    ROLE_LEVELS,
    getRoleLevel,
    ROLE_MATRIX_RANK,
    getRoleRank,
    getRoleDept
} from './orgRoles';
import { getRoleLevel, getRoleDept } from './orgRoles';

interface UseOrgTreeLayoutProps {
    employees: Employee[];
    sites?: Site[];
    filters: OrgChartFilterState;
}

export const useOrgTreeLayout = ({ employees, sites = [], filters }: UseOrgTreeLayoutProps) => {
    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

    // Site ID to Name map
    const siteMap = useMemo(() => {
        const map = new Map<string, string>();
        sites.forEach(s => map.set(s.id, s.name));
        return map;
    }, [sites]);

    // 1. Build reporting hierarchy graph
    const rawTree = useMemo(() => {
        if (!employees || employees.length === 0) return null;

        // Create base tree nodes
        const nodeMap = new Map<string, OrgTreeNode>();
        const siteLookup = (sId?: string) => sId ? (siteMap.get(sId) || sId) : undefined;

        employees.forEach(emp => {
            const role = emp.role || 'cashier';
            const dept = getRoleDept(role, emp.department);
            const level = getRoleLevel(role);
            nodeMap.set(emp.id, {
                id: emp.id,
                employee: emp,
                role,
                label: emp.name || 'Unnamed Staff',
                department: dept,
                siteId: emp.siteId || emp.site_id,
                siteName: siteLookup(emp.siteId || emp.site_id),
                level,
                children: [],
                directReportCount: 0,
                totalSubordinateCount: 0
            });
        });

        // Identify the Group Chief Executive Officer root
        const allNodes = Array.from(nodeMap.values());
        let rootNode = allNodes.find(n => n.role === 'group_ceo' || n.role === 'country_managing_director');

        // If no group_ceo, pick the lowest level (highest hierarchy)
        if (!rootNode) {
            allNodes.sort((a, b) => a.level - b.level);
            rootNode = allNodes[0];
        }

        // Categorize managers
        const regionalMgrs = allNodes.filter(n => n.role === 'regional_operations_manager');
        const regionalMgr = regionalMgrs[0];
        const opsMgr = allNodes.find(n => n.role === 'country_operations_director');
        const financeMgr = allNodes.find(n => n.role === 'country_finance_director');
        const hrMgr = allNodes.find(n => n.role === 'country_hr_director');
        const procMgr = allNodes.find(n => n.role === 'country_commercial_director' || n.role === 'country_supply_chain_director');
        const storeMgrs = allNodes.filter(n => n.role === 'store_manager');
        const whMgrs = allNodes.filter(n => n.role === 'warehouse_manager');
        const shiftLeads = allNodes.filter(n => n.role === 'shift_supervisor' || n.role === 'assistant_store_manager');
        const dispatchMgrs = allNodes.filter(n => n.role === 'dispatch_supervisor');
        const csMgr = allNodes.find(n => n.role === 'cs_manager');
        const secMgr = allNodes.find(n => n.role === 'regional_security_manager');

        // Helper to find best manager for a given node
        const findParent = (node: OrgTreeNode): OrgTreeNode | null => {
            if (node.id === rootNode?.id) return null;

            // Levels 2-5 (Country Executive, HQ Department Heads, Regional Operations and Department Managers)
            if (node.level >= 2 && node.level <= 5) {
                // Country Operations Director reports directly to CEO
                if (node.role === 'country_operations_director') {
                    return rootNode || null;
                }
                // Regional Operations Manager reports to Country Operations Director (or CEO if no HQ operations head)
                if (node.role === 'regional_operations_manager') {
                    if (opsMgr && opsMgr.id !== node.id) return opsMgr;
                    return rootNode || null;
                }
                // Country Supply Chain Director reports to Country Operations Director (or CEO)
                if (node.role === 'country_supply_chain_director') {
                    if (opsMgr && opsMgr.id !== node.id) return opsMgr;
                    return rootNode || null;
                }
                // Regional Department Managers (Level 5) report to their Regional Operations Manager
                if (node.level === 5 && regionalMgr && regionalMgr.id !== node.id) {
                    return regionalMgr;
                }
                return rootNode || null;
            }

            // Levels 6-8 (Facility Captains, Department Managers & Shift Supervisors)
            if (node.level >= 6 && node.level <= 8) {
                if (['assistant_store_manager', 'shift_supervisor'].includes(node.role)) {
                    // Match store manager at the same site
                    const sameSiteStoreMgr = storeMgrs.find(m => m.siteId && m.siteId === node.siteId);
                    if (sameSiteStoreMgr && sameSiteStoreMgr.id !== node.id) return sameSiteStoreMgr;
                    if (storeMgrs.length > 0 && storeMgrs[0].id !== node.id) return storeMgrs[0];
                }
                if (['dispatch_supervisor', 'inventory_manager'].includes(node.role)) {
                    const sameSiteWhMgr = whMgrs.find(m => m.siteId && m.siteId === node.siteId);
                    if (sameSiteWhMgr && sameSiteWhMgr.id !== node.id) return sameSiteWhMgr;
                    if (whMgrs.length > 0 && whMgrs[0].id !== node.id) return whMgrs[0];
                }
                // Central Ops Managers (Security Manager, CS Manager) report to Country Operations Director
                if (['regional_security_manager', 'cs_manager'].includes(node.role)) {
                    if (opsMgr && opsMgr.id !== node.id) return opsMgr;
                }
                // Store/Warehouse managers report to their Regional Operations Manager in the same territory
                if (['store_manager', 'warehouse_manager'].includes(node.role)) {
                    const empObj = node.employee as any;
                    const empRegion = empObj?.regionCode || empObj?.region_code;
                    if (empRegion) {
                        const matchingRm = regionalMgrs.find(rm => {
                            const rmEmp = rm.employee as any;
                            return (rmEmp?.regionCode || rmEmp?.region_code) === empRegion;
                        });
                        if (matchingRm && matchingRm.id !== node.id) return matchingRm;
                    }
                    if (regionalMgr && regionalMgr.id !== node.id) return regionalMgr;
                    if (opsMgr && opsMgr.id !== node.id) return opsMgr;
                    return rootNode || null;
                }

                // Default Levels 6-8 fallback
                if (regionalMgr && regionalMgr.id !== node.id) return regionalMgr;
                if (opsMgr && opsMgr.id !== node.id) return opsMgr;
                return rootNode || null;
            }

            // Levels 9 & 10 (Specialists & Frontline Staff)
            // Central Operations Team members
            if (['store_operations_auditor', 'data_analyst'].includes(node.role)) {
                if (opsMgr && opsMgr.id !== node.id) return opsMgr;
            }
            if (node.role === 'customer_service') {
                if (csMgr && csMgr.id !== node.id) return csMgr;
                if (opsMgr && opsMgr.id !== node.id) return opsMgr;
            }
            if (node.role === 'loss_prevention') {
                if (secMgr && secMgr.id !== node.id) return secMgr;
                if (opsMgr && opsMgr.id !== node.id) return opsMgr;
            }

            if (node.department === 'store') {
                // Find Shift Lead or Store Manager at the same site
                const sameSiteLead = shiftLeads.find(l => l.siteId && l.siteId === node.siteId);
                if (sameSiteLead) return sameSiteLead;
                const sameSiteStoreMgr = storeMgrs.find(m => m.siteId && m.siteId === node.siteId);
                if (sameSiteStoreMgr) return sameSiteStoreMgr;
                if (storeMgrs.length > 0) return storeMgrs[0];
            } else if (node.department === 'warehouse') {
                if (node.role === 'driver' && dispatchMgrs.length > 0) {
                    const sameSiteDisp = dispatchMgrs.find(d => d.siteId && d.siteId === node.siteId);
                    return sameSiteDisp || dispatchMgrs[0];
                }
                const sameSiteWhMgr = whMgrs.find(m => m.siteId && m.siteId === node.siteId);
                if (sameSiteWhMgr) return sameSiteWhMgr;
                if (whMgrs.length > 0) return whMgrs[0];
            } else if (node.department === 'finance') {
                if (financeMgr) return financeMgr;
            } else if (node.department === 'hr') {
                if (hrMgr) return hrMgr;
            } else if (node.department === 'procurement') {
                if (procMgr) return procMgr;
            }

            // Default fallback
            if (opsMgr && opsMgr.id !== node.id) return opsMgr;
            return rootNode || null;
        };

        // Wire children
        allNodes.forEach(node => {
            if (node.id === rootNode?.id) return;
            const parent = findParent(node);
            if (parent && parent.id !== node.id) {
                node.parentId = parent.id;
                parent.children.push(node);
            } else if (rootNode && node.id !== rootNode.id) {
                node.parentId = rootNode.id;
                rootNode.children.push(node);
            }
        });

        // Ensure no cycles and no orphaned branches: attach unreached nodes directly to root
        if (rootNode) {
            const isReachableFromRoot = (node: OrgTreeNode): boolean => {
                let curr: OrgTreeNode | undefined = node;
                const visited = new Set<string>();
                while (curr && curr.parentId) {
                    if (curr.parentId === rootNode!.id) return true;
                    if (visited.has(curr.id)) return false;
                    visited.add(curr.id);
                    curr = nodeMap.get(curr.parentId);
                }
                return false;
            };

            allNodes.forEach(node => {
                if (node.id === rootNode!.id) return;
                if (!isReachableFromRoot(node)) {
                    node.parentId = rootNode!.id;
                    if (!rootNode!.children.some(c => c.id === node.id)) {
                        rootNode!.children.push(node);
                    }
                }
            });

            // Compute direct and recursive subordinate counts safely
            const seenInCounts = new Set<string>();
            const computeSubordinates = (curr: OrgTreeNode): number => {
                if (seenInCounts.has(curr.id)) return 0;
                seenInCounts.add(curr.id);
                curr.directReportCount = curr.children.length;
                let sum = curr.children.length;
                curr.children.forEach(child => {
                    sum += computeSubordinates(child);
                });
                curr.totalSubordinateCount = sum;
                return sum;
            };

            computeSubordinates(rootNode);
        }

        return rootNode;
    }, [employees, siteMap]);

    // 2. Search match calculation and auto-expansion
    const searchMatchIds = useMemo(() => {
        const matches = new Set<string>();
        const query = filters.searchTerm.trim().toLowerCase();
        if (!query || !employees) return matches;

        employees.forEach(emp => {
            const nameMatch = emp.name?.toLowerCase().includes(query);
            const roleMatch = emp.role?.toLowerCase().includes(query) || (ROLE_LABELS[emp.role] || '').toLowerCase().includes(query);
            const codeMatch = emp.code?.toLowerCase().includes(query);
            const deptMatch = emp.department?.toLowerCase().includes(query);
            if (nameMatch || roleMatch || codeMatch || deptMatch) {
                matches.add(emp.id);
            }
        });
        return matches;
    }, [employees, filters.searchTerm]);

    // Filter validation for a node with cycle guard
    const isNodeVisible = useCallback((node: OrgTreeNode): boolean => {
        if (filters.siteId && node.siteId && node.siteId !== filters.siteId) {
            const visited = new Set<string>();
            const hasMatchingDescendant = (n: OrgTreeNode): boolean => {
                if (visited.has(n.id)) return false;
                visited.add(n.id);
                if (n.siteId === filters.siteId) return true;
                return n.children.some(hasMatchingDescendant);
            };
            if (!hasMatchingDescendant(node)) return false;
        }

        if (filters.department && node.department && node.department !== filters.department) {
            const visited = new Set<string>();
            const hasMatchingDescendant = (n: OrgTreeNode): boolean => {
                if (visited.has(n.id)) return false;
                visited.add(n.id);
                if (n.department === filters.department) return true;
                return n.children.some(hasMatchingDescendant);
            };
            if (!hasMatchingDescendant(node)) return false;
        }

        if (filters.status && node.employee?.status && node.employee.status !== filters.status) {
            return false;
        }

        return true;
    }, [filters]);

    // 3. Tree Layout Engine (2D coordinates)
    const { layoutNodes, layoutConnectors, bounds } = useMemo(() => {
        if (!rawTree) {
            return { layoutNodes: [], layoutConnectors: [], bounds: { minX: 0, maxX: 800, minY: 0, maxY: 600, width: 800, height: 600 } };
        }

        const nodesList: OrgLayoutNode[] = [];
        const connectorsList: OrgConnectorPath[] = [];

        // Recursive subtree width calculation
        const getSubtreeWidth = (n: OrgTreeNode): number => {
            if (!isNodeVisible(n)) return 0;
            const isCollapsed = collapsedIds.has(n.id);
            const visibleChildren = isCollapsed ? [] : n.children.filter(isNodeVisible);

            if (visibleChildren.length === 0) {
                return NODE_WIDTH;
            }

            const childrenWidth = visibleChildren.reduce((acc, c) => acc + getSubtreeWidth(c), 0);
            const totalGaps = (visibleChildren.length - 1) * HORIZONTAL_GAP;
            return Math.max(NODE_WIDTH, childrenWidth + totalGaps);
        };

        // Recursive positioning
        const positionNode = (n: OrgTreeNode, startX: number, y: number): number => {
            if (!isNodeVisible(n)) return 0;

            const subtreeWidth = getSubtreeWidth(n);
            const isCollapsed = collapsedIds.has(n.id);
            const visibleChildren = isCollapsed ? [] : n.children.filter(isNodeVisible);

            const nodeX = startX + (subtreeWidth - NODE_WIDTH) / 2;
            const nodeY = y;

            nodesList.push({
                id: n.id,
                x: nodeX,
                y: nodeY,
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
                node: n,
                isCollapsed,
                hasChildren: n.children.length > 0,
                isSearchMatch: searchMatchIds.has(n.id)
            });

            if (!isCollapsed && visibleChildren.length > 0) {
                let currentChildX = startX;
                const nextY = nodeY + NODE_HEIGHT + VERTICAL_GAP;
                const parentBottomX = nodeX + NODE_WIDTH / 2;
                const parentBottomY = nodeY + NODE_HEIGHT;

                visibleChildren.forEach(child => {
                    const childWidth = getSubtreeWidth(child);
                    const childCenterNodeX = currentChildX + (childWidth - NODE_WIDTH) / 2;
                    const childTopX = childCenterNodeX + NODE_WIDTH / 2;
                    const childTopY = nextY;

                    // Compute smooth rounded orthogonal SVG path
                    const midY = parentBottomY + VERTICAL_GAP / 2;
                    const pathD = `M ${parentBottomX} ${parentBottomY} V ${midY} H ${childTopX} V ${childTopY}`;

                    connectorsList.push({
                        id: `conn-${n.id}-${child.id}`,
                        fromX: parentBottomX,
                        fromY: parentBottomY,
                        toX: childTopX,
                        toY: childTopY,
                        d: pathD
                    });

                    positionNode(child, currentChildX, nextY);
                    currentChildX += childWidth + HORIZONTAL_GAP;
                });
            }

            return subtreeWidth;
        };

        positionNode(rawTree, 40, 40);

        // Compute overall canvas bounds
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        nodesList.forEach(n => {
            if (n.x < minX) minX = n.x;
            if (n.x + n.width > maxX) maxX = n.x + n.width;
            if (n.y < minY) minY = n.y;
            if (n.y + n.height > maxY) maxY = n.y + n.height;
        });

        if (nodesList.length === 0) {
            minX = 0; maxX = 800; minY = 0; maxY = 600;
        }

        return {
            layoutNodes: nodesList,
            layoutConnectors: connectorsList,
            bounds: {
                minX: minX - 80,
                maxX: maxX + 80,
                minY: minY - 40,
                maxY: maxY + 80,
                width: Math.max(800, maxX - minX + 160),
                height: Math.max(600, maxY - minY + 160)
            }
        };
    }, [rawTree, collapsedIds, searchMatchIds, isNodeVisible]);

    const toggleCollapse = useCallback((nodeId: string) => {
        setCollapsedIds(prev => {
            const next = new Set(prev);
            if (next.has(nodeId)) {
                next.delete(nodeId);
            } else {
                next.add(nodeId);
            }
            return next;
        });
    }, []);

    const expandAll = useCallback(() => {
        setCollapsedIds(new Set());
    }, []);

    const collapseAll = useCallback(() => {
        if (!rawTree) return;
        const allIds = new Set<string>();
        const collect = (n: OrgTreeNode) => {
            if (n.children.length > 0) {
                allIds.add(n.id);
                n.children.forEach(collect);
            }
        };
        collect(rawTree);
        setCollapsedIds(allIds);
    }, [rawTree]);

    return {
        rawTree,
        layoutNodes,
        layoutConnectors,
        bounds,
        collapsedIds,
        toggleCollapse,
        expandAll,
        collapseAll,
        searchMatchIds
    };
};
