import React from 'react';
import { Employee, Site } from '../types';
import { OrgChartContainer } from './org-chart/OrgChartContainer';

interface OrgChartProps {
    employees: Employee[];
    sites?: Site[];
    isLoading?: boolean;
    onlineIds?: Set<string>;
    onSelectEmployee?: (employee: Employee) => void;
    onOpenAddEmployee?: () => void;
    onOpenIdCard?: (employee: Employee) => void;
}

export const OrgChart: React.FC<OrgChartProps> = ({
    employees,
    sites,
    isLoading,
    onlineIds,
    onSelectEmployee,
    onOpenAddEmployee,
    onOpenIdCard
}) => {
    return (
        <OrgChartContainer
            employees={employees}
            sites={sites}
            isLoading={isLoading}
            onlineIds={onlineIds}
            onSelectEmployee={onSelectEmployee}
            onOpenAddEmployee={onOpenAddEmployee}
            onOpenIdCard={onOpenIdCard}
        />
    );
};

export default OrgChart;
