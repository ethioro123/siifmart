import { OrgNode, CARD_SIZES } from './types';

// Helper to calculate exact coordinates of handle on card
export const getHandleCoords = (nodeId: string, handle: string, nodes: OrgNode[]) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    const sizeConfig = CARD_SIZES[node.role] || CARD_SIZES.default;
    const { width, height } = sizeConfig;
    let x = node.x;
    let y = node.y;

    if (handle === 'top') { x += width / 2; }
    else if (handle === 'bottom') { x += width / 2; y += height; }
    else if (handle === 'left') { y += height / 2; }
    else if (handle === 'right') { x += width; y += height / 2; }
    return { x, y };
};

// Helper to calculate SVG path data with fixed-radius rounded corners
export const pointsToSVG = (points: { x: number, y: number }[], radius: number = 10) => {
    if (points.length < 2) return "";
    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
        const p1 = points[i - 1];
        const p2 = points[i];
        const p3 = points[i + 1];

        if (p3) {
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
export const getConnectionPath = (fromId: string, fromHandle: string, toId: string, toHandle: string, nodes: OrgNode[]) => {
    const start = getHandleCoords(fromId, fromHandle, nodes);
    const end = getHandleCoords(toId, toHandle, nodes);

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

            return !(maxX < rx1 || minX > rx2 || maxY < ry1 || minY > ry2);
        });
    };

    let midX = (startOffset.x + endOffset.x) / 2;
    let midY = (startOffset.y + endOffset.y) / 2;

    if (fromHandle === 'bottom' || fromHandle === 'top') {
        if (isRectBlocked(startOffset.x, startOffset.y, startOffset.x, midY) ||
            isRectBlocked(startOffset.x, midY, endOffset.x, midY)) {
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
