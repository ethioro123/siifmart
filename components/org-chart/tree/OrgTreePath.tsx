import React from 'react';
import { OrgConnectorPath } from '../types';

interface OrgTreePathProps {
    connector: OrgConnectorPath;
}

export const OrgTreePath: React.FC<OrgTreePathProps> = ({ connector }) => {
    const strokeColor = 'var(--theme-border-strong)';
    const activeColor = 'var(--theme-accent)';

    return (
        <g className="transition-all duration-300">
            {/* Background glow / drop shadow */}
            <path
                d={connector.d}
                fill="none"
                stroke={strokeColor}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-70 hover:opacity-100 transition-opacity"
            />
            {/* Small subtle terminal anchor point on child node top */}
            <circle
                cx={connector.toX}
                cy={connector.toY}
                r={3}
                fill={activeColor}
            />
        </g>
    );
};

export default OrgTreePath;
