import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Line, Arrow, Path, Group } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { Employee, UserRole, Site } from '../types';
import {
    HierarchyNode, ROLE_LABELS, CARD_SIZES, OrgNode, Connection
} from './org-chart/types';
import { HierarchyModal } from './org-chart/HierarchyModal';
import { OrgCard } from './org-chart/OrgCard';
import { getConnectionPath, pointsToSVG, getHandleCoords } from './org-chart/routing';

const SNAP_THRESHOLD = 20;
const WORKSPACE_WIDTH = 3000;
const WORKSPACE_HEIGHT = 2000;

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

interface OrgChartProps {
    employees: Employee[];
    sites?: Site[];
}

export const OrgChart: React.FC<OrgChartProps> = ({ employees, sites }) => {
    const isDark = useTheme();
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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'Delete' || e.key === 'Backspace')) {
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
            {showHierarchy && (
                <HierarchyModal onClose={() => setShowHierarchy(false)} isDark={isDark} />
            )}
            
            <div className={`flex items-center justify-between px-4 py-3 border-b z-10 shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-4">
                    <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        Org Chart Editor <span className="text-xs font-normal text-gray-500 ml-2">(Konva)</span>
                    </h3>
                    <div className={`hidden lg:block text-[10px] uppercase tracking-wider font-semibold opacity-50 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        Scroll to Pan • Cmd + Scroll to Zoom • Drag Nodes to Snap
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowHierarchy(true)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded border transition-colors ${
                            isDark
                                ? 'bg-violet-900/30 border-violet-700 text-violet-300 hover:bg-violet-900/50'
                                : 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100'
                        }`}
                        title="View full reporting hierarchy"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h12M3 17h6" />
                        </svg>
                        Hierarchy
                    </button>
                    
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

            <div className={`flex-1 overflow-hidden relative ${isConnecting ? 'cursor-crosshair' : 'cursor-grab'}`}>
                <Stage
                    width={window.innerWidth}
                    height={800}
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
                    ref={(stage) => {
                        if (stage) {
                            stage.container().style.background = 'transparent';
                            stageRef.current = stage;
                        } else {
                            stageRef.current = null;
                        }
                    }}
                >
                    <Layer>
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

                        {connections.map(conn => {
                            const pathPoints = getConnectionPath(conn.from, conn.fromHandle, conn.to, conn.toHandle, nodes);
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
                                    <Path
                                        data={pathData}
                                        stroke="transparent"
                                        strokeWidth={20}
                                    />
                                </Group>
                            );
                        })}

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

            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsAddModalOpen(false)}>
                    <div className={`w-full max-w-md rounded-lg shadow-xl p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Add New Card</h3>

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
