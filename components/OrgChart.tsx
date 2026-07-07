import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Arrow, Path, Group } from 'react-konva';
import { Employee, UserRole, Site } from '../types';
import {
    ROLE_LABELS, OrgNode, Connection
} from './org-chart/types';
import { HierarchyModal } from './org-chart/HierarchyModal';
import { OrgCard } from './org-chart/OrgCard';
import { getConnectionPath, pointsToSVG } from './org-chart/routing';

// Hooks
import { useOrgChartState } from './org-chart/hooks/useOrgChartState';

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
    const stageRef = useRef<any>(null);
    const connectionStartRef = useRef<{ nodeId: string; handle: string } | null>(null);

    const {
        nodes,
        connections,
        showHierarchy,
        setShowHierarchy,
        selectedId,
        setSelectedId,
        selectedConnectionId,
        setSelectedConnectionId,
        guideLines,
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
        tempConnection,
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
    } = useOrgChartState({ employees, stageRef, connectionStartRef });

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
