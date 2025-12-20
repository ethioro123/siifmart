
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
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                        <User className="text-gray-500" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-white">Authentication Required</h2>
                    <p className="text-gray-400">Please log in to view your profile.</p>
                </div>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                        <User className="text-gray-500" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-white">Profile Not Found</h2>
                    <p className="text-gray-400 max-w-md mx-auto">
                        Your employee record could not be found in the current site database.
                        Please contact your administrator or HR department to ensure your record is properly linked.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        MY <span className="text-cyber-primary">PROFILE</span>
                    </h1>
                    <p className="text-gray-400 font-medium mt-1">Manage your professional identity, tasks, and documents.</p>
                </div>
            </header>

            <div className="bg-cyber-gray border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <StaffProfileView
                    employee={employee}
                    isOwnProfile={true}
                />
            </div>
        </div>
    );
}

