/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import EmployeeModals from '../../components/employees/EmployeeModals';
import StaffProfileHeader from '../../components/staff-profile/StaffProfileHeader';
import type { Employee } from '../../types';

afterEach(cleanup);

vi.mock('../../contexts/CentralStore', () => ({
    useStore: () => ({
        user: { id: 'u1', name: 'Admin', role: 'group_ceo' },
        onlineIds: new Set(['e1']),
        updateUserAvatar: vi.fn(),
    })
}));

vi.mock('../../contexts/DataContext', () => ({
    useData: () => ({
        tasks: [],
        setTasks: vi.fn(),
        sites: [{ id: 's1', name: 'Addis Ababa DC', code: 'ADD-DC-01', country: 'ET' }],
        addNotification: vi.fn(),
        updateEmployee: vi.fn(),
        settings: { currency: 'ETB' },
        getStorePoints: vi.fn(),
    })
}));

vi.mock('../../contexts/GamificationContext', () => ({
    useGamification: () => ({
        getWorkerPoints: vi.fn(),
    })
}));

vi.mock('../../contexts/RosterContext', () => ({
    useRoster: () => ({
        schedules: [],
        shifts: [],
        roster: [],
    })
}));

const mockEmployee: Employee = {
    id: 'e1',
    code: 'EMP-001',
    name: 'Abebe Bikila',
    role: 'warehouse_manager',
    department: 'Warehouse Operations',
    status: 'Active',
    siteId: 's1',
    email: 'abebe@siifmart.com',
    phone: '+251911223344',
    joinDate: '2024-01-15',
    performanceScore: 98,
    attendanceRate: 100,
    avatar: '',
};

describe('Employee Details Modal & Staff Profile Design Compliance', () => {
    it('renders EmployeeModals with accessible employee name in dialog title and mobileFullScreen', () => {
        render(
            <EmployeeModals
                selectedEmployee={mockEmployee}
                setSelectedEmployee={vi.fn()}
                idCardEmployee={null}
                setIdCardEmployee={vi.fn()}
                isAddModalOpen={false}
                sites={[{ id: 's1', name: 'Addis Ababa DC', code: 'ADD-DC-01', country: 'ET' }]}
                employees={[mockEmployee]}
                wizardProps={{ newEmpData: { role: 'cashier' } }}
                terminateProps={{}}
                deleteProps={{}}
                approveProps={{}}
                validationProps={{}}
                cropperProps={{}}
                isProcessingImage={false}
                processingStatus=""
                user={{ id: 'u1', name: 'Admin', role: 'group_ceo' }}
                isOnboardingEditorOpen={false}
                setIsOnboardingEditorOpen={vi.fn()}
                pendingOnboardingImageSrc={null}
                setPendingOnboardingImageSrc={vi.fn()}
                handleSaveOnboardingPhoto={vi.fn()}
            />
        );

        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeTruthy();
        expect(screen.getByText('Abebe Bikila · Staff Profile')).toBeTruthy();
    });

    it('renders StaffProfileHeader with semantic status tokens and active presence', () => {
        render(
            <StaffProfileHeader
                employee={mockEmployee}
                sites={[{ id: 's1', name: 'Addis Ababa DC', code: 'ADD-DC-01' }]}
                isOwnProfile={false}
                canManageEmployees={true}
                canResetPassword={true}
                canTerminate={false}
                canDelete={false}
                isOnline={true}
                onPhotoRequest={vi.fn()}
                onIdCard={vi.fn()}
                onMessage={vi.fn()}
                onResetPassword={vi.fn()}
                onTerminate={vi.fn()}
                onDelete={vi.fn()}
                photoInputRef={{ current: null }}
                handleProfilePhotoSelect={vi.fn()}
            />
        );

        expect(screen.getByText('Abebe Bikila')).toBeTruthy();
        expect(screen.getByText('Online')).toBeTruthy();
        expect(screen.getByText('Active')).toBeTruthy();
        expect(screen.getByText('ID Card')).toBeTruthy();
        expect(screen.getByText('Message')).toBeTruthy();
    });
});
