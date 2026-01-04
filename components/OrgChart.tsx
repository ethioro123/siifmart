
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Group, Circle, Line, Arrow, Path, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { KonvaEventObject } from 'konva/lib/Node';
import { Employee, UserRole, Site } from '../types';
import { User, Shield, Briefcase, Truck, ShoppingBag, Package } from 'lucide-react';

// === CONFIGURATION ===
const DEFAULT_CARD_WIDTH = 130;
const DEFAULT_CARD_HEIGHT = 125;
const SNAP_THRESHOLD = 20;

// Virtual Workspace Size (Fixed Bounds)
const WORKSPACE_WIDTH = 3000;
const WORKSPACE_HEIGHT = 2000;

// === ROLE LABELS & COLORS ===
const ROLE_LABELS: Record<string, string> = {
    // Level 1 - Executive
    super_admin: 'CEO',
    // Level 2 - Regional/Directors
    regional_manager: 'Regional Manager',
    operations_manager: 'Operations Manager',
    finance_manager: 'Finance Manager',
    hr_manager: 'HR Manager',
    procurement_manager: 'Procurement Manager',
    supply_chain_manager: 'Supply Chain Mgr',
    // Level 3 - Site Managers
    store_manager: 'Store Manager',
    warehouse_manager: 'Warehouse Manager',
    dispatch_manager: 'Dispatch Manager',
    assistant_manager: 'Asst. Manager',
    shift_lead: 'Shift Lead',
    // Level 4 - Staff
    cashier: 'Cashier',
    sales_associate: 'Sales Associate',
    stock_clerk: 'Stock Clerk',
    picker: 'Picker',
    packer: 'Packer',
    receiver: 'Receiver',
    driver: 'Driver',
    forklift_operator: 'Forklift Op.',
    inventory_specialist: 'Inventory Spec.',
    customer_service: 'Customer Service',
    auditor: 'Auditor',
    it_support: 'IT Support',
    // Legacy (backwards compatibility)
    admin: 'Admin',
    manager: 'Manager',
    hr: 'HR',
    pos: 'POS Staff',
};

// Hierarchical Card Sizing: Each level is exactly 10% smaller than the level above
// Level 1: CEO - Base size 200x160
// Level 2: Directors/Regional - 180x144 (90% of L1)
// Level 3: Site Managers - 162x130 (90% of L2)
// Level 4: Staff - 146x117 (90% of L3)
const CARD_SIZES: Record<string, { width: number; height: number; level: number }> = {
    // Level 1
    super_admin: { width: 200, height: 160, level: 1 },
    // Level 2
    regional_manager: { width: 180, height: 144, level: 2 },
    operations_manager: { width: 180, height: 144, level: 2 },
    finance_manager: { width: 180, height: 144, level: 2 },
    hr_manager: { width: 180, height: 144, level: 2 },
    procurement_manager: { width: 180, height: 144, level: 2 },
    supply_chain_manager: { width: 180, height: 144, level: 2 },
    // Level 3
    store_manager: { width: 162, height: 130, level: 3 },
    warehouse_manager: { width: 162, height: 130, level: 3 },
    dispatch_manager: { width: 162, height: 130, level: 3 },
    assistant_manager: { width: 162, height: 130, level: 3 },
    shift_lead: { width: 162, height: 130, level: 3 },
    // Level 4
    cashier: { width: 146, height: 117, level: 4 },
    sales_associate: { width: 146, height: 117, level: 4 },
    stock_clerk: { width: 146, height: 117, level: 4 },
    picker: { width: 146, height: 117, level: 4 },
    packer: { width: 146, height: 117, level: 4 },
    receiver: { width: 146, height: 117, level: 4 },
    driver: { width: 146, height: 117, level: 4 },
    forklift_operator: { width: 146, height: 117, level: 4 },
    inventory_specialist: { width: 146, height: 117, level: 4 },
    customer_service: { width: 146, height: 117, level: 4 },
    auditor: { width: 146, height: 117, level: 4 },
    it_support: { width: 146, height: 117, level: 4 },
    // Legacy
    admin: { width: 180, height: 144, level: 2 },
    manager: { width: 162, height: 130, level: 3 },
    hr: { width: 180, height: 144, level: 2 },
    pos: { width: 146, height: 117, level: 4 },
    default: { width: 146, height: 117, level: 4 }
};

const ROLE_COLORS: Record<string, string> = {
    // Level 1 - Executive (Purple/Indigo)
    super_admin: '#6366f1',
    // Level 2 - Directors (Blue)
    regional_manager: '#3b82f6',
    operations_manager: '#3b82f6',
    finance_manager: '#3b82f6',
    hr_manager: '#3b82f6',
    procurement_manager: '#3b82f6',
    supply_chain_manager: '#3b82f6',
    // Level 3 - Managers (Teal)
    store_manager: '#14b8a6',
    warehouse_manager: '#14b8a6',
    dispatch_manager: '#14b8a6',
    assistant_manager: '#14b8a6',
    shift_lead: '#14b8a6',
    // Level 4 - Staff (Slate)
    default: '#64748b',
    // Legacy
    admin: '#3b82f6',
    manager: '#14b8a6',
    hr: '#3b82f6',
};

// === TYPES ===
interface OrgNode {
    id: string;
    x: number;
    y: number;
    role: UserRole;
    label: string;
    employee?: Employee;
}

interface Connection {
    id: string;
    from: string;
    to: string;
    fromHandle: 'top' | 'bottom' | 'left' | 'right';
    toHandle: 'top' | 'bottom' | 'left' | 'right';
}

// === AVATAR COMPONENT ===
const AvatarImage = ({ url, fallbackUrl, x, y, size }: { url: string; fallbackUrl?: string; x: number; y: number; size: number }) => {
    // Try loading without crossOrigin first (works with most URLs)
    const [image, status] = useImage(url);
    const [fallbackImage] = useImage(fallbackUrl || '');

    // Use primary image if loaded, else try fallback
    const displayImage = (status === 'loaded' && image) ? image : fallbackImage;

    return (
        <Group x={x} y={y}>
            <Circle radius={size / 2} fill="#e2e8f0" stroke="#cbd5e1" strokeWidth={1} />
            {displayImage && (
                <Group clipFunc={(ctx) => ctx.arc(0, 0, size / 2, 0, Math.PI * 2, false)}>
                    <KonvaImage
                        image={displayImage}
                        width={size}
                        height={size}
                        x={-size / 2}
                        y={-size / 2}
                    />
                </Group>
            )}
        </Group>
    );
};

// === THEME HELPERS ===
const useTheme = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const checkTheme = () => {
            const hasDarkClass = document.documentElement.classList.contains('dark');
            setIsDark(hasDarkClass);
        };

        checkTheme();

        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

    return isDark;
};

// === CARD COMPONENT ===
const OrgCard = ({
    node,
    isSelected,
    onSelect,
    onDragMove,
    onDragEnd,
    onConnectStart,
    onConnectEnd,
    isDark,
    isEditing
}: {
    node: OrgNode;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onDragMove: (e: KonvaEventObject<DragEvent>, id: string) => void;
    onDragEnd: (e: KonvaEventObject<DragEvent>, id: string) => void;
    onConnectStart: (nodeId: string, handle: string) => void;
    onConnectEnd: (nodeId: string, handle: string) => void;
    isDark: boolean;
    isEditing: boolean;
}) => {
    const bgColor = isSelected ? (isDark ? '#3730a3' : '#e0e7ff') : (isDark ? '#1e293b' : '#ffffff');
    const strokeColor = isSelected ? '#6366f1' : (isDark ? '#334155' : '#e2e8f0');
    // Ensure text is visible on dark cards - standard slate-900 or white is fine, but check contrast
    const textColor = isDark ? '#f8fafc' : '#1e293b';
    const subTextColor = isDark ? '#cbd5e1' : '#64748b';
    const headerColor = ROLE_COLORS[node.role] || ROLE_COLORS.default;

    // Dynamic Sizing based on hierarchy level
    const sizeConfig = CARD_SIZES[node.role] || CARD_SIZES.default;
    const { width, height, level } = sizeConfig;

    // Avatar and text sizing based on hierarchy level (10% scale differences)
    const avatarSizes = { 1: 88, 2: 72, 3: 65, 4: 58 };
    const fontSizes = {
        1: { role: 16, name: 12 },
        2: { role: 15, name: 11 },
        3: { role: 14, name: 10 },
        4: { role: 13, name: 9 }
    };

    const avatarSize = avatarSizes[level as keyof typeof avatarSizes] || 58;
    const avatarY = height * 0.35; // Positioned for balance
    const textStartY = avatarY + avatarSize / 2 + 10;
    const roleFontSize = fontSizes[level as keyof typeof fontSizes]?.role || 13;
    const nameFontSize = fontSizes[level as keyof typeof fontSizes]?.name || 9;

    // Handles - Adjusted for new layout if needed, but relative calc remains safely robust
    const handles = [
        { id: 'top', x: width / 2, y: 0 },
        { id: 'bottom', x: width / 2, y: height },
        { id: 'left', x: 0, y: height / 2 },
        { id: 'right', x: width, y: height / 2 },
    ];

    // Robust Avatar URL Logic
    const primaryAvatarUrl = (node.employee?.avatar && node.employee.avatar.length > 0) ? node.employee.avatar : '';
    const fallbackAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(node.label || 'User')}&background=random&size=128`;
    const avatarUrl = primaryAvatarUrl || fallbackAvatarUrl;

    return (
        <Group
            id={node.id}
            x={node.x}
            y={node.y}
            draggable
            onDragStart={() => onSelect(node.id)}
            onDragMove={(e) => onDragMove(e, node.id)}
            onDragEnd={(e) => onDragEnd(e, node.id)}
            onClick={() => onSelect(node.id)}
            onTap={() => onSelect(node.id)}
        >
            {/* Main Card Body */}
            <Rect
                width={width}
                height={height}
                fill={bgColor}
                stroke={strokeColor}
                strokeWidth={isSelected ? 2 : 1}
                cornerRadius={12}
                shadowBlur={10}
                shadowColor="rgba(0,0,0,0.1)"
                shadowOpacity={0.2}
            />

            {/* Top Color Accent (Minimal) */}
            <Rect
                width={width}
                height={4}
                fill={headerColor}
                cornerRadius={[12, 12, 0, 0]}
            />

            {/* Avatar - Dynamic Size */}
            <AvatarImage
                url={avatarUrl}
                fallbackUrl={fallbackAvatarUrl}
                x={width / 2}
                y={avatarY}
                size={avatarSize}
            />

            {/* Text Wrapper - Centered below avatar */}
            <Group x={5} y={textStartY} width={width - 10}>
                {/* Role Label - Prominent */}
                <Text
                    text={ROLE_LABELS[node.role] || node.role}
                    fontSize={roleFontSize}
                    fontStyle="bold"
                    fill={headerColor}
                    width={width - 10}
                    align="center"
                    wrap="none"
                    ellipsis={true}
                />

                {/* Name - Smaller & Secondary */}
                <Text
                    text={node.label}
                    fontSize={nameFontSize}
                    fontStyle="normal"
                    fill={subTextColor}
                    y={roleFontSize + 4}
                    width={width - 10}
                    align="center"
                    wrap="none"
                    ellipsis={true}
                />
            </Group>

            {/* Connection Handles (Only visible in Edit Mode) */}
            {isEditing && handles.map(h => (
                <Circle
                    key={h.id}
                    x={h.x}
                    y={h.y}
                    radius={5}
                    fill="#3b82f6"
                    stroke="#ffffff"
                    strokeWidth={2}
                    opacity={0.9}
                    onMouseEnter={(e) => {
                        const stage = e.target.getStage();
                        if (stage) stage.container().style.cursor = 'crosshair';
                    }}
                    onMouseLeave={(e) => {
                        const stage = e.target.getStage();
                        if (stage) stage.container().style.cursor = 'default';
                    }}
                    onMouseDown={(e) => {
                        e.cancelBubble = true;
                        onConnectStart(node.id, h.id);
                    }}
                    onMouseUp={(e) => {
                        e.cancelBubble = true;
                        onConnectEnd(node.id, h.id);
                    }}
                />
            ))}
        </Group>
    );
};

// === MAIN COMPONENT ===
interface OrgChartProps {
    employees: Employee[];
    sites?: Site[];
}

const OrgChart: React.FC<OrgChartProps> = ({ employees, sites }) => {
    const isDark = useTheme(); // Theme Hook
    const [nodes, setNodes] = useState<OrgNode[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
    const [guideLines, setGuideLines] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });
    const [isEditing, setIsEditing] = useState(false); // Edit Mode State

    // Add Card Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addModalTab, setAddModalTab] = useState<'empty' | 'existing'>('empty');
    const [newCardRole, setNewCardRole] = useState<UserRole>('pos');
    const [newCardLabel, setNewCardLabel] = useState('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

    // Connection State
    const [isConnecting, setIsConnecting] = useState(false);
    const [tempConnection, setTempConnection] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
    const connectionStartRef = useRef<{ nodeId: string; handle: string } | null>(null);
    const stageRef = useRef<any>(null);

    // Initial Load
    useEffect(() => {
        const saved = localStorage.getItem('konva-org-chart');
        if (saved) {
            const data = JSON.parse(saved);
            setNodes(data.nodes || []);
            setConnections(data.connections || []);
        } else if (employees.length > 0) {
            // Create initial card for first employee if empty
            const emp = employees.find(e => e.role === 'super_admin') || employees[0];
            setNodes([{
                id: `node-${Date.now()}`,
                x: 100,
                y: 100,
                role: emp.role,
                label: emp.name,
                employee: emp
            }]);
        }
    }, [employees]);

    // Save on Change
    useEffect(() => {
        if (nodes.length > 0) {
            localStorage.setItem('konva-org-chart', JSON.stringify({ nodes, connections }));
        }
    }, [nodes, connections]);

    // === HANDLERS ===

    const handleDragMove = useCallback((e: KonvaEventObject<DragEvent>, id: string) => {
        const node = nodes.find(n => n.id === id);
        if (!node) return;

        const stage = e.target.getStage();
        if (!stage) return;

        const x = e.target.x();
        const y = e.target.y();

        const size = CARD_SIZES[node.role] || CARD_SIZES.default;
        const w = size.width;
        const h = size.height;

        let bestSnapX: { val: number, line: number, dist: number } | null = null;
        let bestSnapY: { val: number, line: number, dist: number } | null = null;

        for (const other of nodes) {
            if (other.id === id) continue;

            const otherSize = CARD_SIZES[other.role] || CARD_SIZES.default;
            const ow = otherSize.width;
            const oh = otherSize.height;

            // X Points (Vertical Lines)
            const xPoints = [
                { line: other.x, mySnap: other.x }, // Left
                { line: other.x + ow, mySnap: other.x + ow - w }, // Right
                { line: other.x + ow / 2, mySnap: other.x + ow / 2 - w / 2 }, // Center
            ];

            for (const pt of xPoints) {
                const dist = Math.abs(x - pt.mySnap);
                if (dist < SNAP_THRESHOLD && (!bestSnapX || dist < bestSnapX.dist)) {
                    bestSnapX = { val: pt.mySnap, line: pt.line, dist };
                }
            }

            // Y Points (Horizontal Lines)
            const yPoints = [
                { line: other.y, mySnap: other.y }, // Top
                { line: other.y + oh, mySnap: other.y + oh - h }, // Bottom
                { line: other.y + oh / 2, mySnap: other.y + oh / 2 - h / 2 }, // Middle
                { line: other.y + oh + 60, mySnap: other.y + oh + 60 }, // Standard Spacing
            ];

            for (const pt of yPoints) {
                const dist = Math.abs(y - pt.mySnap);
                if (dist < SNAP_THRESHOLD && (!bestSnapY || dist < bestSnapY.dist)) {
                    bestSnapY = { val: pt.mySnap, line: pt.line, dist };
                }
            }
        }

        // Apply Snap & Guide Lines
        if (bestSnapX) {
            e.target.x(bestSnapX.val);
            setGuideLines(prev => ({ ...prev, x: [bestSnapX!.line] }));
        } else {
            setGuideLines(prev => ({ ...prev, x: [] }));
        }

        if (bestSnapY) {
            e.target.y(bestSnapY.val);
            setGuideLines(prev => ({ ...prev, y: [bestSnapY!.line] }));
        } else {
            setGuideLines(prev => ({ ...prev, y: [] }));
        }
    }, [nodes]);

    const handleDragEnd = useCallback((e: KonvaEventObject<DragEvent>, id: string) => {
        const node = nodes.find(n => n.id === id);
        if (!node) return;

        const x = e.target.x();
        const y = e.target.y();

        const size = CARD_SIZES[node.role] || CARD_SIZES.default;
        const w = size.width;
        const h = size.height;

        let bestSnapX: number | null = null;
        let bestSnapY: number | null = null;
        let minDistX = SNAP_THRESHOLD;
        let minDistY = SNAP_THRESHOLD;

        nodes.forEach(other => {
            if (other.id === id) return;

            const otherSize = CARD_SIZES[other.role] || CARD_SIZES.default;
            const ow = otherSize.width;
            const oh = otherSize.height;

            // X Points
            const xPoints = [
                { mySnap: other.x },
                { mySnap: other.x + ow - w },
                { mySnap: other.x + ow / 2 - w / 2 },
            ];
            xPoints.forEach(pt => {
                const dist = Math.abs(x - pt.mySnap);
                if (dist < minDistX) {
                    minDistX = dist;
                    bestSnapX = pt.mySnap;
                }
            });

            // Y Points
            const yPoints = [
                { mySnap: other.y },
                { mySnap: other.y + oh - h },
                { mySnap: other.y + oh / 2 - h / 2 },
                { mySnap: other.y + oh + 60 },
            ];
            yPoints.forEach(pt => {
                const dist = Math.abs(y - pt.mySnap);
                if (dist < minDistY) {
                    minDistY = dist;
                    bestSnapY = pt.mySnap;
                }
            });
        });

        const finalX = bestSnapX !== null ? bestSnapX : x;
        const finalY = bestSnapY !== null ? bestSnapY : y;

        setNodes(nds => nds.map(n => n.id === id ? { ...n, x: finalX, y: finalY } : n));
        setGuideLines({ x: [], y: [] });
    }, [nodes]);

    // Connection Logic
    const handleConnectStart = (nodeId: string, handle: string) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        const size = CARD_SIZES[node.role] || CARD_SIZES.default;
        const { width, height } = size;

        let startX = node.x;
        let startY = node.y;

        // Calculate absolute handle position
        if (handle === 'top') { startX += width / 2; }
        else if (handle === 'bottom') { startX += width / 2; startY += height; }
        else if (handle === 'left') { startY += height / 2; }
        else if (handle === 'right') { startX += width; startY += height / 2; }

        setIsConnecting(true);
        setTempConnection({ startX, startY, endX: startX, endY: startY });
        connectionStartRef.current = { nodeId, handle };
    };

    const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
        const stage = stageRef.current;
        if (!stage) return;

        // If Ctrl or Meta key is pressed, zoom (Always prevent default for zoom)
        if (e.evt.ctrlKey || e.evt.metaKey) {
            e.evt.preventDefault();
            const oldScale = stage.scaleX();
            const pointer = stage.getPointerPosition();
            if (!pointer) return;

            const mousePointTo = {
                x: (pointer.x - stage.x()) / oldScale,
                y: (pointer.y - stage.y()) / oldScale,
            };

            const scaleBy = 1.1;
            const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
            const finalScale = Math.max(0.1, Math.min(newScale, 3));

            stage.scale({ x: finalScale, y: finalScale });

            const newPos = {
                x: pointer.x - mousePointTo.x * finalScale,
                y: pointer.y - mousePointTo.y * finalScale,
            };
            stage.position(newPos);
            stage.batchDraw();
        } else {
            // Panning: Only prevent default if we haven't hit a boundary in the scroll direction
            const oldPos = stage.position();
            const scale = stage.scaleX();
            const viewportWidth = stage.width();
            const viewportHeight = stage.height();

            const margin = 200;
            const minX = -(WORKSPACE_WIDTH * scale) + viewportWidth - margin;
            const maxX = margin;
            const minY = -(WORKSPACE_HEIGHT * scale) + viewportHeight - margin;
            const maxY = margin;

            const wouldX = oldPos.x - e.evt.deltaX;
            const wouldY = oldPos.y - e.evt.deltaY;

            const clampedX = Math.max(minX, Math.min(maxX, wouldX));
            const clampedY = Math.max(minY, Math.min(maxY, wouldY));

            // If we are actually changing position (not stuck at a border), prevent browser scroll
            const isAtXBoundary = (e.evt.deltaX > 0 && oldPos.x <= minX) || (e.evt.deltaX < 0 && oldPos.x >= maxX);
            const isAtYBoundary = (e.evt.deltaY > 0 && oldPos.y <= minY) || (e.evt.deltaY < 0 && oldPos.y >= maxY);

            // If we're not at a boundary in the primary scroll direction, consume the event
            if (!isAtYBoundary || Math.abs(e.evt.deltaX) > Math.abs(e.evt.deltaY)) {
                e.evt.preventDefault();
                stage.position({ x: clampedX, y: clampedY });
                stage.batchDraw();
            }
        }
    };

    const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
        if (!isConnecting || !tempConnection) return;

        const stage = e.target.getStage();
        if (!stage) return;

        const point = stage.getPointerPosition();
        if (point) {
            // Must account for stage transform (pan/zoom)
            const scale = stage.scaleX();
            const transform = stage.getAbsoluteTransform().copy();
            transform.invert();
            const pos = transform.point(point);

            setTempConnection(prev => prev ? { ...prev, endX: pos.x, endY: pos.y } : null);
        }
    };

    const handleConnectEnd = (nodeId: string, handle: string) => {
        if (!isConnecting || !connectionStartRef.current) return;

        if (connectionStartRef.current.nodeId !== nodeId) {
            // Check for existing connection
            const exists = connections.some(c =>
                (c.from === connectionStartRef.current!.nodeId && c.to === nodeId) ||
                (c.from === nodeId && c.to === connectionStartRef.current!.nodeId)
            );

            if (!exists) {
                // Create connection
                const newConn: Connection = {
                    id: `conn-${Date.now()}`,
                    from: connectionStartRef.current.nodeId,
                    to: nodeId,
                    fromHandle: connectionStartRef.current.handle as any,
                    toHandle: handle as any
                };
                setConnections(prev => [...prev, newConn]);
            }
        }

        setIsConnecting(false);
        setTempConnection(null);
        connectionStartRef.current = null;
    };

    const handleStageMouseUp = (e: KonvaEventObject<MouseEvent>) => {
        // If clicking on empty stage (not a shape), deselect all
        if (e.target === e.target.getStage()) {
            setSelectedId(null);
            setSelectedConnectionId(null);
        }

        if (isConnecting) {
            setIsConnecting(false);
            setTempConnection(null);
            connectionStartRef.current = null;
        }
    };

    // Helper to get handle coords (Updated for dynamic sizes)
    const getHandleCoords = (nodeId: string, handle: string) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return { x: 0, y: 0 };

        const size = CARD_SIZES[node.role] || CARD_SIZES.default;
        const { width, height } = size;

        let x = node.x;
        let y = node.y;
        if (handle === 'top') { x += width / 2; }
        else if (handle === 'bottom') { x += width / 2; y += height; }
        else if (handle === 'left') { y += height / 2; }
        else if (handle === 'right') { x += width; y += height / 2; }
        return { x, y };
    };

    // Helper to calculate SVG path data with fixed-radius rounded corners
    const pointsToSVG = (points: { x: number, y: number }[], radius: number = 10) => {
        if (points.length < 2) return "";
        let path = `M ${points[0].x} ${points[0].y}`;

        for (let i = 1; i < points.length; i++) {
            const p1 = points[i - 1];
            const p2 = points[i];
            const p3 = points[i + 1];

            if (p3) {
                // Calculate vector to p2 and p3
                const d1 = { x: p2.x - p1.x, y: p2.y - p1.y };
                const d2 = { x: p3.x - p2.x, y: p3.y - p2.y };
                const len1 = Math.sqrt(d1.x * d1.x + d1.y * d1.y);
                const len2 = Math.sqrt(d2.x * d2.x + d2.y * d2.y);

                const currentRadius = Math.min(radius, len1 / 2, len2 / 2);

                const q1 = {
                    x: p2.x - (d1.x / len1) * currentRadius,
                    y: p2.y - (d1.y / len1) * currentRadius
                };
                const q2 = {
                    x: p2.x + (d2.x / len2) * currentRadius,
                    y: p2.y + (d2.y / len2) * currentRadius
                };

                path += ` L ${q1.x} ${q1.y} Q ${p2.x} ${p2.y} ${q2.x} ${q2.y}`;
            } else {
                path += ` L ${p2.x} ${p2.y}`;
            }
        }
        return path;
    };
    // Helper to calculate curved/orthogonal path points with obstacle avoidance
    const getConnectionPath = (fromId: string, fromHandle: string, toId: string, toHandle: string) => {
        const start = getHandleCoords(fromId, fromHandle);
        const end = getHandleCoords(toId, toHandle);

        const offset = 30;
        const startOffset = { x: start.x, y: start.y };
        if (fromHandle === 'top') startOffset.y -= offset;
        else if (fromHandle === 'bottom') startOffset.y += offset;
        else if (fromHandle === 'left') startOffset.x -= offset;
        else if (fromHandle === 'right') startOffset.x += offset;

        const endOffset = { x: end.x, y: end.y };
        if (toHandle === 'top') endOffset.y -= offset;
        else if (toHandle === 'bottom') endOffset.y += offset;
        else if (toHandle === 'left') endOffset.x -= offset;
        else if (toHandle === 'right') endOffset.x += offset;

        const otherNodes = nodes.filter(n => n.id !== fromId && n.id !== toId);
        const isRectBlocked = (x1: number, y1: number, x2: number, y2: number) => {
            const minX = Math.min(x1, x2);
            const maxX = Math.max(x1, x2);
            const minY = Math.min(y1, y2);
            const maxY = Math.max(y1, y2);

            return otherNodes.some(n => {
                const s = CARD_SIZES[n.role] || CARD_SIZES.default;
                const margin = 15;
                const rx1 = n.x - margin;
                const rx2 = n.x + s.width + margin;
                const ry1 = n.y - margin;
                const ry2 = n.y + s.height + margin;

                // Check intersection
                return !(maxX < rx1 || minX > rx2 || maxY < ry1 || minY > ry2);
            });
        };

        let midX = (startOffset.x + endOffset.x) / 2;
        let midY = (startOffset.y + endOffset.y) / 2;

        // Attempt basic obstacle avoidance by shifting midpoints
        if (fromHandle === 'bottom' || fromHandle === 'top') {
            // Check if vertical segment or horizontal segment is blocked
            if (isRectBlocked(startOffset.x, startOffset.y, startOffset.x, midY) ||
                isRectBlocked(startOffset.x, midY, endOffset.x, midY)) {
                // Try shifting midY to find clearance
                const candidates = [midY, startOffset.y + 60, endOffset.y - 60, midY - 60, midY + 60];
                for (const c of candidates) {
                    if (!isRectBlocked(startOffset.x, startOffset.y, startOffset.x, c) &&
                        !isRectBlocked(startOffset.x, c, endOffset.x, c)) {
                        midY = c;
                        break;
                    }
                }
            }
            return [start, startOffset, { x: startOffset.x, y: midY }, { x: endOffset.x, y: midY }, endOffset, end];
        } else {
            if (isRectBlocked(startOffset.x, startOffset.y, midX, startOffset.y) ||
                isRectBlocked(midX, startOffset.y, midX, endOffset.y)) {
                const candidates = [midX, startOffset.x + 60, endOffset.x - 60, midX - 60, midX + 60];
                for (const c of candidates) {
                    if (!isRectBlocked(startOffset.x, startOffset.y, c, startOffset.y) &&
                        !isRectBlocked(c, startOffset.y, c, endOffset.y)) {
                        midX = c;
                        break;
                    }
                }
            }
            return [start, startOffset, { x: midX, y: startOffset.y }, { x: midX, y: endOffset.y }, endOffset, end];
        }
    };

    // Add Card Handler (Modified to open modal)
    const handleAddCardClick = () => {
        setIsAddModalOpen(true);
        setNewCardLabel('');
        setSelectedEmployeeId('');
    };

    const confirmAddCard = () => {
        let newNode: OrgNode;
        const centerX = -1 * (stageRef.current?.x() || 0) + window.innerWidth / 2;
        const centerY = -1 * (stageRef.current?.y() || 0) + 400; // Approx center

        if (addModalTab === 'empty') {
            newNode = {
                id: `node-${Date.now()}`,
                x: centerX,
                y: centerY,
                role: newCardRole,
                label: newCardLabel || ROLE_LABELS[newCardRole] || 'New Role',
            };
        } else {
            const emp = employees.find(e => e.id === selectedEmployeeId);
            if (!emp) return;

            // Check Duplicate
            if (nodes.some(n => n.employee?.id === emp.id)) {
                alert('This employee is already in the chart!');
                return;
            }

            newNode = {
                id: `node-${Date.now()}`,
                x: centerX,
                y: centerY,
                role: emp.role,
                label: emp.name,
                employee: emp
            };
        }

        setNodes(curr => [...curr, newNode]);
        setIsAddModalOpen(false);
    };

    const handleZoomIn = () => {
        const stage = stageRef.current;
        if (!stage) return;
        const oldScale = stage.scaleX();
        const newScale = Math.min(oldScale * 1.2, 3);
        stage.scale({ x: newScale, y: newScale });
        stage.batchDraw();
    };

    const handleZoomOut = () => {
        const stage = stageRef.current;
        if (!stage) return;
        const oldScale = stage.scaleX();
        const newScale = Math.max(oldScale / 1.2, 0.1);
        stage.scale({ x: newScale, y: newScale });
        stage.batchDraw();
    };

    const handleZoomFit = () => {
        const stage = stageRef.current;
        if (!stage) return;
        stage.scale({ x: 1, y: 1 });
        stage.position({ x: 0, y: 0 });
        stage.batchDraw();
    };

    const clearCanvas = () => {
        if (window.confirm("Clear all cards?")) {
            setNodes([]);
            setConnections([]);
        }
    }

    // Delete Node Handler - Instant
    const handleDeleteNode = useCallback((nodeId: string) => {
        setNodes(nds => nds.filter(n => n.id !== nodeId));
        setConnections(conns => conns.filter(c => c.from !== nodeId && c.to !== nodeId));
        setSelectedId(null);
    }, []);

    // Delete Connection Handler
    const handleDeleteConnection = useCallback((connId: string) => {
        setConnections(conns => conns.filter(c => c.id !== connId));
        setSelectedConnectionId(null);
    }, []);

    // Keyboard shortcut for delete
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'Delete' || e.key === 'Backspace')) {
                // Don't trigger if user is typing
                if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'SELECT') return;

                if (selectedId) {
                    handleDeleteNode(selectedId);
                } else if (selectedConnectionId) {
                    handleDeleteConnection(selectedConnectionId);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, selectedConnectionId, handleDeleteNode, handleDeleteConnection]);



    return (
        <div className="w-full h-full flex flex-col relative bg-transparent">
            {/* Header Toolbar */}
            <div className={`flex items-center justify-between px-4 py-3 border-b z-10 shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-4">
                    <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Org Chart Editor <span className="text-xs font-normal text-gray-500 ml-2">(Konva)</span></h3>

                    {/* Integrated Explainer Text */}
                    <div className={`hidden lg:block text-[10px] uppercase tracking-wider font-semibold opacity-50 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        Scroll to Pan • Cmd + Scroll to Zoom • Drag Nodes to Snap
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Zoom Controls */}
                    <div className={`flex items-center gap-1 px-2 py-1 rounded border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                        <button onClick={handleZoomOut} className={`p-1 rounded hover:bg-gray-200 ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'text-gray-600'}`} title="Zoom Out (-)">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                        </button>
                        <button onClick={handleZoomFit} className={`px-2 py-0.5 text-[10px] font-bold rounded hover:bg-gray-200 ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'text-gray-600'}`} title="Reset Zoom">
                            FIT
                        </button>
                        <button onClick={handleZoomIn} className={`p-1 rounded hover:bg-gray-200 ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'text-gray-600'}`} title="Zoom In (+)">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className={`px-3 py-1.5 text-sm font-medium rounded ${isEditing ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            {isEditing ? 'Done Editing' : 'Edit Mode'}
                        </button>
                        {isEditing && (
                            <>
                                {selectedId && (
                                    <button onClick={() => handleDeleteNode(selectedId)} className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-100">Delete Card</button>
                                )}
                                {selectedConnectionId && (
                                    <button onClick={() => handleDeleteConnection(selectedConnectionId)} className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-100">Delete Link</button>
                                )}
                                <button onClick={handleAddCardClick} className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-sm">+ Add Card</button>
                                <button onClick={clearCanvas} className={`px-3 py-1.5 text-sm font-medium rounded border ${isDark ? 'text-red-400 border-red-900/30 bg-red-900/10 hover:bg-red-900/20' : 'text-red-600 border-red-100 bg-red-50 hover:bg-red-100'}`}>Reset</button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Canvas Stage */}
            <div className="flex-1 overflow-hidden relative" style={{ cursor: isConnecting ? 'crosshair' : 'grab' }}>
                <Stage
                    ref={stageRef}
                    width={window.innerWidth}
                    height={800} // Reset to sensible viewport height
                    draggable
                    onWheel={handleWheel}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleStageMouseUp}
                    dragBoundFunc={(pos) => {
                        const stage = stageRef.current;
                        if (!stage) return pos;
                        const scale = stage.scaleX();
                        const viewportWidth = stage.width();
                        const viewportHeight = stage.height();
                        const margin = 200;

                        const minX = -(WORKSPACE_WIDTH * scale) + viewportWidth - margin;
                        const maxX = margin;
                        const minY = -(WORKSPACE_HEIGHT * scale) + viewportHeight - margin;
                        const maxY = margin;

                        return {
                            x: Math.max(minX, Math.min(maxX, pos.x)),
                            y: Math.max(minY, Math.min(maxY, pos.y))
                        };
                    }}
                    style={{ background: 'transparent' }}
                >
                    <Layer>
                        {/* Guide Lines */}
                        {guideLines.x.map((gx, i) => (
                            <Line
                                key={`v-${i}`}
                                points={[gx, -WORKSPACE_HEIGHT, gx, WORKSPACE_HEIGHT * 2]}
                                stroke="#3b82f6" strokeWidth={1} dash={[5, 5]}
                            />
                        ))}
                        {guideLines.y.map((gy, i) => (
                            <Line
                                key={`h-${i}`}
                                points={[-WORKSPACE_WIDTH, gy, WORKSPACE_WIDTH * 2, gy]}
                                stroke="#3b82f6" strokeWidth={1} dash={[5, 5]}
                            />
                        ))}

                        {/* Connections */}
                        {connections.map(conn => {
                            const pathPoints = getConnectionPath(conn.from, conn.fromHandle, conn.to, conn.toHandle);
                            const pathData = pointsToSVG(pathPoints, 12);
                            const isSelected = selectedConnectionId === conn.id;

                            const last = pathPoints[pathPoints.length - 1];
                            const prev = pathPoints[pathPoints.length - 2];

                            return (
                                <Group key={conn.id} onClick={(e) => {
                                    e.cancelBubble = true;
                                    setSelectedConnectionId(conn.id);
                                    setSelectedId(null);
                                }}>
                                    <Path
                                        data={pathData}
                                        stroke={isSelected ? '#3b82f6' : (isDark ? '#475569' : '#cbd5e1')}
                                        strokeWidth={isSelected ? 4 : 2}
                                    />
                                    <Arrow
                                        points={[prev.x, prev.y, last.x, last.y]}
                                        stroke={isSelected ? '#3b82f6' : (isDark ? '#475569' : '#cbd5e1')}
                                        strokeWidth={isSelected ? 4 : 2}
                                        fill={isSelected ? '#3b82f6' : (isDark ? '#475569' : '#cbd5e1')}
                                        pointerLength={10}
                                        pointerWidth={10}
                                    />
                                    {/* Invisible hit area */}
                                    <Path
                                        data={pathData}
                                        stroke="transparent"
                                        strokeWidth={20}
                                    />
                                </Group>
                            );
                        })}

                        {/* Temp Connection Line */}
                        {tempConnection && (
                            <Line
                                points={[
                                    tempConnection.startX, tempConnection.startY,
                                    (tempConnection.startX + tempConnection.endX) / 2, tempConnection.startY,
                                    (tempConnection.startX + tempConnection.endX) / 2, tempConnection.endY,
                                    tempConnection.endX, tempConnection.endY
                                ]}
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dash={[5, 5]}
                            />
                        )}

                        {/* Nodes */}
                        {nodes.map(node => (
                            <OrgCard
                                key={node.id}
                                node={node}
                                isSelected={selectedId === node.id}
                                onSelect={(id) => {
                                    if (isEditing) {
                                        setSelectedId(id);
                                        setSelectedConnectionId(null);
                                    }
                                }}
                                onDragMove={handleDragMove}
                                onDragEnd={handleDragEnd}
                                onConnectStart={handleConnectStart}
                                onConnectEnd={handleConnectEnd}
                                isDark={isDark}
                                isEditing={isEditing}
                            />
                        ))}
                    </Layer>
                </Stage>
            </div>

            {/* Add Card Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsAddModalOpen(false)}>
                    <div className={`w-full max-w-md rounded-lg shadow-xl p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Add New Card</h3>

                        {/* Tabs */}
                        <div className="flex border-b mb-4">
                            <button
                                onClick={() => setAddModalTab('empty')}
                                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${addModalTab === 'empty' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                Empty Card
                            </button>
                            <button
                                onClick={() => setAddModalTab('existing')}
                                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${addModalTab === 'existing' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                Existing Employee
                            </button>
                        </div>

                        {/* Tab Content */}
                        {addModalTab === 'empty' ? (
                            <div className="space-y-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Role/Position</label>
                                    <select
                                        value={newCardRole}
                                        onChange={(e) => setNewCardRole(e.target.value as UserRole)}
                                        title="Select a role or position"
                                        className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                    >
                                        {Object.entries(ROLE_LABELS).map(([role, label]) => (
                                            <option key={role} value={role}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Label (Optional)</label>
                                    <input
                                        type="text"
                                        value={newCardLabel}
                                        onChange={(e) => setNewCardLabel(e.target.value)}
                                        placeholder="e.g. John Doe or Leave empty for role name"
                                        className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Select Employee</label>
                                <select
                                    value={selectedEmployeeId}
                                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                    title="Select an employee"
                                    className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                >
                                    <option value="">-- Select an employee --</option>
                                    {employees
                                        .filter(emp => !nodes.some(n => n.employee?.id === emp.id))
                                        .map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.name} ({ROLE_LABELS[emp.role] || emp.role})</option>
                                        ))
                                    }
                                </select>
                                {employees.filter(emp => !nodes.some(n => n.employee?.id === emp.id)).length === 0 && (
                                    <p className="text-sm text-gray-500 mt-2">All employees are already in the chart.</p>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className={`px-4 py-2 text-sm rounded ${isDark ? 'text-gray-300 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAddCard}
                                disabled={addModalTab === 'existing' && !selectedEmployeeId}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add Card
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrgChart;
