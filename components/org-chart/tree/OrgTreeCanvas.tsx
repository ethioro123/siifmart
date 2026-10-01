import React, { useRef, useState, useEffect, useCallback } from 'react';
import { OrgLayoutNode, OrgConnectorPath } from '../types';
import { OrgTreeNodeCard } from './OrgTreeNodeCard';
import { OrgTreePath } from './OrgTreePath';
import { Users, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface OrgTreeCanvasProps {
    layoutNodes: OrgLayoutNode[];
    layoutConnectors: OrgConnectorPath[];
    bounds: { width: number; height: number; minX: number; minY: number };
    isDark: boolean;
    onlineIds?: Set<string>;
    onSelectNode: (layoutNode: OrgLayoutNode) => void;
    onToggleCollapse: (nodeId: string) => void;
    onResetFilters?: () => void;
}

export const OrgTreeCanvas: React.FC<OrgTreeCanvasProps> = ({
    layoutNodes,
    layoutConnectors,
    bounds,
    isDark,
    onlineIds,
    onSelectNode,
    onToggleCollapse,
    onResetFilters
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 40 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

    // Auto-fit to viewport on initial mount or when bounds change dramatically
    const fitToScreen = useCallback(() => {
        if (!containerRef.current || bounds.width <= 0 || bounds.height <= 0) return;
        const containerWidth = containerRef.current.clientWidth || 1000;
        const containerHeight = containerRef.current.clientHeight || 650;

        const padding = 60;
        const availableW = Math.max(containerWidth - padding, 200);
        const availableH = Math.max(containerHeight - padding, 200);

        const scaleX = availableW / bounds.width;
        const scaleY = availableH / bounds.height;
        const targetScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.35), 1.05);

        // Center on root node or tree center
        const rootNode = layoutNodes[0];
        let targetX: number;
        if (rootNode) {
            targetX = containerWidth / 2 - (rootNode.x + rootNode.width / 2) * targetScale;
        } else {
            const treeCenterX = bounds.minX + bounds.width / 2;
            targetX = containerWidth / 2 - treeCenterX * targetScale;
        }

        // Clamp so tree is never lost far to the left
        if (rootNode && (targetX + rootNode.x * targetScale < 20)) {
            targetX = 20 - rootNode.x * targetScale;
        }

        const targetY = 36;

        setScale(targetScale);
        setPan({ x: targetX, y: targetY });
    }, [bounds, layoutNodes]);

    useEffect(() => {
        fitToScreen();
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => {
            fitToScreen();
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [fitToScreen]);

    // Mouse drag pan
    const handleMouseDown = (e: React.MouseEvent) => {
        // Only initiate pan if clicking on canvas background
        if ((e.target as HTMLElement).closest('.group')) return;
        setIsDragging(true);
        dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            panX: pan.x,
            panY: pan.y
        };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        setPan({
            x: dragStartRef.current.panX + dx,
            y: dragStartRef.current.panY + dy
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Zoom on wheel with meta/ctrl key or trackpad pinch (passive: false to allow e.preventDefault())
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const zoomFactor = 1.08;
            if (e.ctrlKey || e.metaKey) {
                // Zoom at pointer
                const rect = container.getBoundingClientRect();
                const pointerX = rect ? e.clientX - rect.left : 400;
                const pointerY = rect ? e.clientY - rect.top : 300;

                setScale(currentScale => {
                    const newScale = e.deltaY < 0
                        ? Math.min(currentScale * zoomFactor, 2.5)
                        : Math.max(currentScale / zoomFactor, 0.25);

                    const scaleRatio = newScale / currentScale;
                    setPan(currentPan => ({
                        x: pointerX - (pointerX - currentPan.x) * scaleRatio,
                        y: pointerY - (pointerY - currentPan.y) * scaleRatio
                    }));

                    return newScale;
                });
            } else {
                // Normal 2D pan
                setPan(prev => ({
                    x: prev.x - e.deltaX,
                    y: prev.y - e.deltaY
                }));
            }
        };

        container.addEventListener('wheel', onWheel, { passive: false });
        return () => {
            container.removeEventListener('wheel', onWheel);
        };
    }, []);

    const handleZoomIn = () => setScale(s => Math.min(s * 1.2, 2.5));
    const handleZoomOut = () => setScale(s => Math.max(s / 1.2, 0.25));

    return (
        <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`w-full h-[680px] min-h-[600px] relative overflow-hidden select-none cursor-grab active:cursor-grabbing rounded-xl border ${
                isDark ? 'bg-[#121814] border-[#2C4D35]' : 'bg-[#FAF8F5] border-[#E2DCCE]'
            }`}
        >
            {/* Subtle background grid pattern */}
            <div
                className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10"
                style={{
                    backgroundImage: `radial-gradient(${isDark ? '#A9CBA2' : '#2C5E3B'} 1px, transparent 1px)`,
                    backgroundSize: '24px 24px'
                }}
            />

            {/* Floating Zoom Controls overlay */}
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 p-1.5 rounded-xl shadow-lg border bg-white/90 dark:bg-[#1E2822]/90 border-[#E2DCCE] dark:border-[#2C4D35] backdrop-blur-sm">
                <button
                    type="button"
                    onClick={handleZoomOut}
                    className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-white/10 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
                    title="Zoom Out"
                >
                    <ZoomOut size={16} />
                </button>
                <span className="text-xs font-mono font-bold px-1.5 text-stone-500 dark:text-stone-400">
                    {Math.round(scale * 100)}%
                </span>
                <button
                    type="button"
                    onClick={handleZoomIn}
                    className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-white/10 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
                    title="Zoom In"
                >
                    <ZoomIn size={16} />
                </button>
                <div className="w-px h-4 bg-stone-300 dark:bg-stone-700 mx-0.5" />
                <button
                    type="button"
                    onClick={fitToScreen}
                    className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-white/10 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
                    title="Fit to Screen"
                >
                    <Maximize2 size={16} />
                </button>
            </div>

            {/* Main Interactive Scalable & Pannable Graph */}
            {layoutNodes.length > 0 ? (
                <div
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                        transformOrigin: '0 0',
                        width: `${bounds.width + 400}px`,
                        height: `${bounds.height + 400}px`
                    }}
                    className="absolute top-0 left-0 transition-transform duration-75 pointer-events-auto"
                >
                    {/* SVG Connector Layer */}
                    <svg
                        className="absolute top-0 left-0 w-full h-full pointer-events-none"
                        style={{ overflow: 'visible' }}
                    >
                        {layoutConnectors.map(conn => (
                            <OrgTreePath
                                key={conn.id}
                                connector={conn}
                                isDark={isDark}
                            />
                        ))}
                    </svg>

                    {/* Nodes Layer */}
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        {layoutNodes.map(node => (
                            <div key={node.id} className="pointer-events-auto">
                                <OrgTreeNodeCard
                                    layoutNode={node}
                                    isDark={isDark}
                                    onlineIds={onlineIds}
                                    onSelect={onSelectNode}
                                    onToggleCollapse={onToggleCollapse}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 flex items-center justify-center text-[#2C5E3B] dark:text-[#A9CBA2] mb-3">
                        <Users size={28} />
                    </div>
                    <h4 className="text-base font-bold text-[#1E3F27] dark:text-[#EAE5D9]">
                        No matching employees in hierarchy
                    </h4>
                    <p className="text-xs text-[#4D6E56] dark:text-stone-400 mt-1 max-w-sm">
                        Adjust your search query or site/department filters to view the tree.
                    </p>
                    {onResetFilters && (
                        <button
                            type="button"
                            onClick={onResetFilters}
                            className="mt-4 px-4 py-2 text-xs font-bold rounded-lg bg-[#2C5E3B] text-white hover:bg-[#1E3F27] transition-colors cursor-pointer"
                        >
                            Reset Filters
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default OrgTreeCanvas;
