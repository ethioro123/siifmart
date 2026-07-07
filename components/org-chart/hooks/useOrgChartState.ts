import { useState, useRef, useEffect, useCallback } from 'react';
import { KonvaEventObject } from 'konva/lib/Node';
import type { Employee, UserRole } from '../../../types';
import {
    OrgNode, Connection, CARD_SIZES, ROLE_LABELS
} from '../types';
import { getHandleCoords } from '../routing';

const SNAP_THRESHOLD = 20;
const WORKSPACE_WIDTH = 3000;
const WORKSPACE_HEIGHT = 2000;

interface UseOrgChartStateProps {
    employees: Employee[];
    stageRef: React.RefObject<any>;
    connectionStartRef: React.MutableRefObject<{ nodeId: string; handle: string } | null>;
}

export const useOrgChartState = ({
    employees,
    stageRef,
    connectionStartRef
}: UseOrgChartStateProps) => {
    const [nodes, setNodes] = useState<OrgNode[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [showHierarchy, setShowHierarchy] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
    const [guideLines, setGuideLines] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });
    const [isEditing, setIsEditing] = useState(false);

    // Add Card Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addModalTab, setAddModalTab] = useState<'empty' | 'existing'>('empty');
    const [newCardRole, setNewCardRole] = useState<UserRole>('pos');
    const [newCardLabel, setNewCardLabel] = useState('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

    // Connection State
    const [isConnecting, setIsConnecting] = useState(false);
    const [tempConnection, setTempConnection] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);

    // Initial Load
    useEffect(() => {
        const saved = localStorage.getItem('konva-org-chart');
        if (saved) {
            const data = JSON.parse(saved);
            setNodes(data.nodes || []);
            setConnections(data.connections || []);
        } else if (employees.length > 0) {
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

            const xPoints = [
                { line: other.x, mySnap: other.x },
                { line: other.x + ow, mySnap: other.x + ow - w },
                { line: other.x + ow / 2, mySnap: other.x + ow / 2 - w / 2 },
            ];

            for (const pt of xPoints) {
                const dist = Math.abs(x - pt.mySnap);
                if (dist < SNAP_THRESHOLD && (!bestSnapX || dist < bestSnapX.dist)) {
                    bestSnapX = { val: pt.mySnap, line: pt.line, dist };
                }
            }

            const yPoints = [
                { line: other.y, mySnap: other.y },
                { line: other.y + oh, mySnap: other.y + oh - h },
                { line: other.y + oh / 2, mySnap: other.y + oh / 2 - h / 2 },
                { line: other.y + oh + 60, mySnap: other.y + oh + 60 },
            ];

            for (const pt of yPoints) {
                const dist = Math.abs(y - pt.mySnap);
                if (dist < SNAP_THRESHOLD && (!bestSnapY || dist < bestSnapY.dist)) {
                    bestSnapY = { val: pt.mySnap, line: pt.line, dist };
                }
            }
        }

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

    const handleConnectStart = (nodeId: string, handle: string) => {
        const coords = getHandleCoords(nodeId, handle, nodes);
        setIsConnecting(true);
        setTempConnection({ startX: coords.x, startY: coords.y, endX: coords.x, endY: coords.y });
        connectionStartRef.current = { nodeId, handle };
    };

    const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
        const stage = stageRef.current;
        if (!stage) return;

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

            const isAtXBoundary = (e.evt.deltaX > 0 && oldPos.x <= minX) || (e.evt.deltaX < 0 && oldPos.x >= maxX);
            const isAtYBoundary = (e.evt.deltaY > 0 && oldPos.y <= minY) || (e.evt.deltaY < 0 && oldPos.y >= maxY);

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
            const transform = stage.getAbsoluteTransform().copy();
            transform.invert();
            const pos = transform.point(point);

            setTempConnection(prev => prev ? { ...prev, endX: pos.x, endY: pos.y } : null);
        }
    };

    const handleConnectEnd = (nodeId: string, handle: string) => {
        if (!isConnecting || !connectionStartRef.current) return;

        if (connectionStartRef.current.nodeId !== nodeId) {
            const exists = connections.some(c =>
                (c.from === connectionStartRef.current!.nodeId && c.to === nodeId) ||
                (c.from === nodeId && c.to === connectionStartRef.current!.nodeId)
            );

            if (!exists) {
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

    const handleAddCardClick = () => {
        setIsAddModalOpen(true);
        setNewCardLabel('');
        setSelectedEmployeeId('');
    };

    const confirmAddCard = () => {
        let newNode: OrgNode;
        const centerX = -1 * (stageRef.current?.x() || 0) + window.innerWidth / 2;
        const centerY = -1 * (stageRef.current?.y() || 0) + 400;

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
    };

    const handleDeleteNode = useCallback((nodeId: string) => {
        setNodes(nds => nds.filter(n => n.id !== nodeId));
        setConnections(conns => conns.filter(c => c.from !== nodeId && c.to !== nodeId));
        setSelectedId(null);
    }, []);

    const handleDeleteConnection = useCallback((connId: string) => {
        setConnections(conns => conns.filter(c => c.id !== connId));
        setSelectedConnectionId(null);
    }, []);

    return {
        nodes,
        setNodes,
        connections,
        setConnections,
        showHierarchy,
        setShowHierarchy,
        selectedId,
        setSelectedId,
        selectedConnectionId,
        setSelectedConnectionId,
        guideLines,
        setGuideLines,
        isEditing,
        setIsEditing,
        isAddModalOpen,
        setIsAddModalOpen,
        addModalTab,
        setAddModalTab,
        newCardRole,
        setNewCardRole,
        newCardLabel,
        setNewCardLabel,
        selectedEmployeeId,
        setSelectedEmployeeId,
        isConnecting,
        setIsConnecting,
        tempConnection,
        setTempConnection,
        handleDragMove,
        handleDragEnd,
        handleConnectStart,
        handleConnectEnd,
        handleWheel,
        handleMouseMove,
        handleStageMouseUp,
        handleAddCardClick,
        confirmAddCard,
        handleZoomIn,
        handleZoomOut,
        handleZoomFit,
        clearCanvas,
        handleDeleteNode,
        handleDeleteConnection
    };
};
export default useOrgChartState;
