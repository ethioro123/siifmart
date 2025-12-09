import React from 'react';
import { AuditLogViewer } from '../components/AuditLogViewer';

const AuditLogs: React.FC = () => {
    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">System Audit Logs</h1>
                <p className="text-gray-600">
                    View and export security, financial, and operational logs.
                </p>
            </div>
            <AuditLogViewer />
        </div>
    );
};

export default AuditLogs;
