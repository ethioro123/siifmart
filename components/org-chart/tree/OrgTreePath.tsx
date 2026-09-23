import React from 'react';
import { OrgConnectorPath } from '../types';

interface OrgTreePathProps {
    connector: OrgConnectorPath;
    isDark: boolean;
}

export const OrgTreePath: React.FC<OrgTreePathProps> = ({ connector, isDark }) => {
    const strokeColor = isDark ? '#4D6E56' : '#A9CBA2';
    const activeColor = isDark ? '#A9CBA2' : '#2C5E3B';

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
