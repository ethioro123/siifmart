import React from 'react';
import { Group, Rect, Text, Circle } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { AvatarImage } from './AvatarImage';
import { ROLE_LABELS, CARD_SIZES, ROLE_COLORS, OrgNode } from './types';

interface OrgCardProps {
    node: OrgNode;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onDragMove: (e: KonvaEventObject<DragEvent>, id: string) => void;
    onDragEnd: (e: KonvaEventObject<DragEvent>, id: string) => void;
    onConnectStart: (nodeId: string, handle: string) => void;
    onConnectEnd: (nodeId: string, handle: string) => void;
    isDark: boolean;
    isEditing: boolean;
}

export const OrgCard: React.FC<OrgCardProps> = ({
    node,
    isSelected,
    onSelect,
    onDragMove,
    onDragEnd,
    onConnectStart,
    onConnectEnd,
    isDark,
    isEditing
}) => {
    const bgColor = isSelected ? (isDark ? '#3730a3' : '#e0e7ff') : (isDark ? '#1e293b' : '#ffffff');
    const strokeColor = isSelected ? '#6366f1' : (isDark ? '#334155' : '#e2e8f0');
    const textColor = isDark ? '#f8fafc' : '#1e293b';
    const subTextColor = isDark ? '#cbd5e1' : '#64748b';
    const headerColor = ROLE_COLORS[node.role] || ROLE_COLORS.default;

    const sizeConfig = CARD_SIZES[node.role] || CARD_SIZES.default;
    const { width, height, level } = sizeConfig;

    const avatarSizes = { 1: 88, 2: 72, 3: 65, 4: 58 };
    const fontSizes = {
        1: { role: 16, name: 12 },
        2: { role: 15, name: 11 },
        3: { role: 14, name: 10 },
        4: { role: 13, name: 9 }
    };

    const avatarSize = avatarSizes[level as keyof typeof avatarSizes] || 58;
    const avatarY = height * 0.35;
    const textStartY = avatarY + avatarSize / 2 + 10;
    const roleFontSize = fontSizes[level as keyof typeof fontSizes]?.role || 13;
    const nameFontSize = fontSizes[level as keyof typeof fontSizes]?.name || 9;

    const handles = [
        { id: 'top', x: width / 2, y: 0 },
        { id: 'bottom', x: width / 2, y: height },
        { id: 'left', x: 0, y: height / 2 },
        { id: 'right', x: width, y: height / 2 },
    ];

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
export default OrgCard;
