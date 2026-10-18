
import React from 'react';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import StaffProfileView from '../components/StaffProfileView';
import { User } from 'lucide-react';

export default function Profile() {
    const { user } = useStore();
    const { employees } = useData();

    // Find the employee record associated with the current user
    const employee = employees.find(e => e.id === user?.id || e.email === user?.email);

    if (!user) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center px-4 py-8">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-[var(--theme-bg-subtle)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--theme-border)]">
                        <User className="text-[var(--theme-text-muted)]" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-[var(--theme-text-primary)]">Authentication Required</h2>
                    <p className="text-[var(--theme-text-secondary)]">Please log in to view your profile.</p>
                </div>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center px-4 py-8">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-[var(--theme-bg-subtle)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--theme-border)]">
                        <User className="text-[var(--theme-text-muted)]" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-[var(--theme-text-primary)]">Profile Not Found</h2>
                    <p className="text-[var(--theme-text-secondary)] max-w-md mx-auto">
                        Your employee record could not be found in the current site database.
                        Please contact your administrator or HR department to ensure your record is properly linked.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500 px-0 sm:px-2">
            <header className="mb-4 sm:mb-6 flex flex-col md:flex-row md:items-end justify-between gap-2 sm:gap-4 px-1 sm:px-0">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[var(--theme-text-primary)] tracking-tight flex items-center gap-2">
                        My Profile
                    </h1>
                    <p className="text-sm text-[var(--theme-text-secondary)] mt-1">Manage your work details, tasks, and documents.</p>
                </div>
            </header>

            <div className="bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 shadow-[var(--shadow-sm)]">
                <StaffProfileView
                    employee={employee}
                    isOwnProfile={true}
                />
            </div>
        </div>
    );
}

