import React, { useMemo } from 'react';
import { Employee } from '../types';
import { useWeeklyShiftPlanner } from '../hooks/useWeeklyShiftPlanner';
import { ShiftPlannerHeader } from './shift-planner/ShiftPlannerHeader';
import { ShiftPlannerTable } from './shift-planner/ShiftPlannerTable';
import { ShiftCoverageBar } from './shift-planner/ShiftCoverageBar';
import { ShiftDetailModal } from './shift-planner/ShiftDetailModal';
import { ShiftConfirmModals } from './shift-planner/ShiftConfirmModals';

interface ShiftPlannerProps {
    employees: Employee[];
    canEdit?: boolean;
    initialSiteFilter?: string;
}

const ShiftPlanner: React.FC<ShiftPlannerProps> = ({
    employees,
    canEdit = false,
    initialSiteFilter = 'All'
}) => {
    const planner = useWeeklyShiftPlanner({
        employees,
        canEdit,
        initialSiteFilter
    });

    // Unique departments from current employee list
    const departments = useMemo(() => {
        const set = new Set<string>();
        employees.forEach(e => {
            if (e.department) set.add(e.department);
        });
        return Array.from(set).sort();
    }, [employees]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            {/* Header: Week Nav, Filters, Action Buttons */}
            <ShiftPlannerHeader
                weekLabel={planner.weekLabel}
                onNavigateWeek={planner.navigateWeek}
                onGoToCurrentWeek={planner.goToCurrentWeek}
                canEdit={canEdit}
                isDirty={planner.isDirty}
                isSaving={planner.isSaving}
                onSave={planner.saveSchedule}
                onOpenCopyModal={() => planner.setIsCopyModalOpen(true)}
                onOpenPublishModal={() => planner.setIsPublishModalOpen(true)}
                onOpenClearModal={() => planner.setIsClearModalOpen(true)}
                filterSite={planner.filterSite}
                onFilterSiteChange={planner.setFilterSite}
                sites={planner.sites}
                filterDepartment={planner.filterDepartment}
                onFilterDepartmentChange={planner.setFilterDepartment}
                departments={departments}
                searchQuery={planner.searchQuery}
                onSearchQueryChange={planner.setSearchQuery}
                onPrint={handlePrint}
            />

            {/* Coverage Ribbon: Headcount and Hours Summary */}
            <ShiftCoverageBar
                weekDays={planner.weekDays}
                dailyCoverage={planner.dailyCoverage}
                totalWeekHours={planner.totalWeekHours}
                employeeWeeklyHours={planner.employeeWeeklyHours}
            />

            {/* Matrix Table */}
            <ShiftPlannerTable
                employees={planner.filteredEmployees}
                weekDays={planner.weekDays}
                scheduleMap={planner.scheduleMap}
                canEdit={canEdit}
                isLoading={planner.isLoading}
                employeeWeeklyHours={planner.employeeWeeklyHours}
                onCycleShift={planner.cycleShift}
                onEditShift={(employee, date, schedule) => {
                    planner.setEditingCell({ employee, date, schedule });
                }}
            />

            {/* Custom Shift Detail Modal */}
            {planner.editingCell && (
                <ShiftDetailModal
                    isOpen={Boolean(planner.editingCell)}
                    onClose={() => planner.setEditingCell(null)}
                    employee={planner.editingCell.employee}
                    date={planner.editingCell.date}
                    schedule={planner.editingCell.schedule}
                    onSave={planner.setCustomShift}
                />
            )}

            {/* Confirmation Modals for Copy, Publish, Clear */}
            <ShiftConfirmModals
                isCopyModalOpen={planner.isCopyModalOpen}
                onCloseCopyModal={() => planner.setIsCopyModalOpen(false)}
                onConfirmCopy={planner.copyPreviousWeek}
                isCopying={planner.isCopying}
                isPublishModalOpen={planner.isPublishModalOpen}
                onClosePublishModal={() => planner.setIsPublishModalOpen(false)}
                onConfirmPublish={planner.publishRoster}
                isPublishing={planner.isPublishing}
                isClearModalOpen={planner.isClearModalOpen}
                onCloseClearModal={() => planner.setIsClearModalOpen(false)}
                onConfirmClear={planner.clearWeek}
                weekLabel={planner.weekLabel}
            />
        </div>
    );
};

export default ShiftPlanner;
