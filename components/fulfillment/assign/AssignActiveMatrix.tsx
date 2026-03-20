import React from 'react';
import { ClipboardCheck, Layers, ChevronRight, X } from 'lucide-react';
import { Employee, WMSJob } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useFulfillmentData } from '../FulfillmentDataProvider';

interface AssignActiveMatrixProps {
    employees: Employee[];
    jobAssignments: any[];
    filteredJobs: WMSJob[];
}

export const AssignActiveMatrix: React.FC<AssignActiveMatrixProps> = ({
    employees,
    jobAssignments,
    filteredJobs
}) => {
    const { unassignJob } = useFulfillmentData();
    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/5 blur-[80px] rounded-full pointer-events-none" />

            <h3 className="font-extrabold text-white mb-6 flex items-center gap-3 text-xl tracking-tight">
                <div className="p-2 bg-green-500/20 rounded-xl">
                    <ClipboardCheck className="text-green-400" size={24} />
                </div>
                Live Operations Matrix
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {employees
                    .filter(e => ['picker', 'packer', 'dispatcher', 'warehouse_manager'].includes(e.role) && e.status === 'Active')
                    .map(employee => {
                        const employeeAssignments = jobAssignments.filter(
                            a => a.employeeId === employee.id && ['Assigned', 'Accepted', 'In-Progress'].includes(a.status)
                        );
                        const employeeJobs = filteredJobs.filter(j =>
                            employeeAssignments.some(a => a.jobId === j.id)
                        );

                        if (employeeJobs.length === 0) return null;

                        return (
                            <div key={employee.id} className="bg-white/5 backdrop-blur-md rounded-[24px] border border-white/5 p-5 relative overflow-hidden group hover:bg-white/[0.08] transition-all duration-500">
                                {/* Status Glow */}
                                <div className="absolute -top-10 -left-10 w-24 h-24 bg-green-500/10 blur-[40px] rounded-full group-hover:bg-green-500/20 transition-colors" />

                                <div className="flex items-center gap-4 mb-5">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyber-primary/20 via-white/5 to-white/10 border border-white/10 flex items-center justify-center text-lg font-black text-cyber-primary shadow-inner">
                                            {employee.name.charAt(0)}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#0d0e12] animate-pulse" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-white tracking-tight">{employee.name}</p>
                                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">{employee.role}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {employeeJobs.map(job => (
                                        <div key={job.id} className="p-3 bg-black/20 rounded-2xl border border-white/5 hover:border-white/10 transition-all group/job">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg tracking-widest uppercase ${job.type === 'PICK' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                    job.type === 'PACK' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                        'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                                    }`}>
                                                    {job.type}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] text-gray-600 font-mono font-bold tracking-tighter">{formatJobId(job)}</span>
                                                    <button
                                                        onClick={() => unassignJob(job.id)}
                                                        className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-all text-gray-700"
                                                        title="Unassign Task"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5">
                                                    <Layers size={10} className="text-gray-600" />
                                                    {job.items} PAYLOADS
                                                </p>
                                                <ChevronRight size={12} className="text-gray-700 group-hover/job:text-white group-hover/job:translate-x-0.5 transition-all" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                    .filter(Boolean)}
                {jobAssignments.filter(a => ['Assigned', 'Accepted', 'In-Progress'].includes(a.status)).length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500 text-sm">
                        No active assignments
                    </div>
                )}
            </div>
        </div>
    );
};
