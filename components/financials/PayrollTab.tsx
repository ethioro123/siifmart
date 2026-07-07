import React from 'react';
import { Search, Loader2, CheckCircle, Briefcase } from 'lucide-react';
import { useFinance } from './FinanceContext';
import { CURRENCY_SYMBOL } from '../../constants';

export const PayrollTab: React.FC = () => {
    const {
        employees,
        payrollSearch,
        setPayrollSearch,
        payrollRoleFilter,
        setPayrollRoleFilter,
        payrollSort,
        setPayrollSort,
        payrollSortDir,
        setPayrollSortDir,
        payrollPage,
        setPayrollPage,
        payrollPerPage,
        setPayrollPerPage,
        filteredEmployees,
        payrollTotalPages,
        payrollStartIndex,
        payrollEndIndex,
        paginatedEmployees,
        getPayrollPageNumbers,
        uniqueRoles,
        totalSalaries,
        totalBonuses,
        calculateEmployeeBonus,
        handleProcessPayroll,
        handleDownloadBankFile,
        isSubmitting
    } = useFinance();

    const PAYROLL_PER_PAGE_OPTIONS = [10, 25, 50, 100];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
            <div className="lg:col-span-2 bg-cyber-gray border border-white/5 rounded-2xl overflow-x-auto">
                <div className="p-6 border-b border-white/5">
                    <h3 className="font-bold text-white">Payroll Registry</h3>
                    <p className="text-xs text-gray-400 mt-1">Monthly compensation breakdown based on active employees.</p>
                </div>

                {/* Registry Controls */}
                <div className="px-6 py-4 border-b border-white/5 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={payrollSearch}
                            onChange={(e) => setPayrollSearch(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-cyber-primary outline-none"
                            aria-label="Search employees"
                        />
                    </div>
                    <select
                        value={payrollRoleFilter}
                        onChange={(e) => setPayrollRoleFilter(e.target.value)}
                        className="bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-cyber-primary"
                        aria-label="Filter by role"
                    >
                        {uniqueRoles.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-black/20 border-b border-white/5">
                        <tr>
                            <th
                                className="p-4 text-xs text-gray-500 uppercase cursor-pointer hover:text-white transition-colors"
                                onClick={() => { setPayrollSort('name'); setPayrollSortDir(payrollSortDir === 'asc' ? 'desc' : 'asc'); }}
                            >
                                Employee {payrollSort === 'name' && (payrollSortDir === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="p-4 text-xs text-gray-500 uppercase">Role</th>
                            <th
                                className="p-4 text-xs text-gray-500 uppercase cursor-pointer hover:text-white transition-colors"
                                onClick={() => { setPayrollSort('department'); setPayrollSortDir(payrollSortDir === 'asc' ? 'desc' : 'asc'); }}
                            >
                                Department {payrollSort === 'department' && (payrollSortDir === 'asc' ? '↑' : '↓')}
                            </th>
                            <th
                                className="p-4 text-xs text-gray-500 uppercase text-right cursor-pointer hover:text-white transition-colors"
                                onClick={() => { setPayrollSort('salary'); setPayrollSortDir(payrollSortDir === 'asc' ? 'desc' : 'asc'); }}
                            >
                                Salary {payrollSort === 'salary' && (payrollSortDir === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="p-4 text-xs text-gray-500 uppercase text-right">Bonus</th>
                            <th className="p-4 text-xs text-gray-500 uppercase text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {paginatedEmployees.map(emp => (
                            <tr key={emp.id} className="hover:bg-white/5 group transition-colors">
                                <td className="p-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-black/50 border border-white/10 overflow-hidden flex-shrink-0">
                                        {emp.avatar ? (
                                            <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-cyber-primary/10 text-cyber-primary text-[10px] font-bold">
                                                {emp.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-sm text-white font-bold truncate">{emp.name}</span>
                                </td>
                                <td className="p-4">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-white/5 bg-white/5 text-gray-400 tracking-tighter">
                                        {emp.role}
                                    </span>
                                </td>
                                <td className="p-4 text-[11px] text-gray-500 font-medium">{emp.department}</td>
                                <td className="p-4 text-sm font-mono text-white text-right font-bold">
                                    {CURRENCY_SYMBOL} {(emp.salary || 0).toLocaleString()}
                                </td>
                                <td className="p-4 text-sm font-mono text-right">
                                    {calculateEmployeeBonus(emp) > 0 ? (
                                        <span className="text-green-400 font-bold">+{CURRENCY_SYMBOL} {calculateEmployeeBonus(emp).toLocaleString()}</span>
                                    ) : (
                                        <span className="text-gray-500">—</span>
                                    )}
                                </td>
                                <td className="p-4 text-sm font-mono text-cyber-primary text-right font-bold">
                                    {CURRENCY_SYMBOL} {((emp.salary || 0) + calculateEmployeeBonus(emp)).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Payroll Pagination Controls */}
                {filteredEmployees.length > 0 && (
                    <div className="p-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Info */}
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-gray-400">
                                Showing <span className="text-white font-bold">{payrollStartIndex + 1}</span> to <span className="text-white font-bold">{Math.min(payrollEndIndex, filteredEmployees.length)}</span> of <span className="text-cyber-primary font-bold">{filteredEmployees.length}</span> employees
                            </span>
                            <select
                                value={payrollPerPage}
                                onChange={(e) => {
                                    setPayrollPerPage(Number(e.target.value));
                                    setPayrollPage(1);
                                }}
                                className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-cyber-primary/50 cursor-pointer"
                                aria-label="Items per page"
                            >
                                {PAYROLL_PER_PAGE_OPTIONS.map(n => (
                                    <option key={n} value={n}>{n} / page</option>
                                ))}
                            </select>
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPayrollPage(1)}
                                disabled={payrollPage === 1}
                                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                                    payrollPage === 1
                                        ? 'text-gray-600 cursor-not-allowed'
                                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                «
                            </button>
                            <button
                                onClick={() => setPayrollPage(Math.max(1, payrollPage - 1))}
                                disabled={payrollPage === 1}
                                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                                    payrollPage === 1
                                        ? 'text-gray-600 cursor-not-allowed'
                                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                Prev
                            </button>

                            <div className="flex items-center gap-1 mx-2">
                                {getPayrollPageNumbers().map((page, idx) => (
                                    typeof page === 'number' ? (
                                        <button
                                            key={idx}
                                            onClick={() => setPayrollPage(page)}
                                            className={`w-6 h-6 rounded text-xs font-bold transition-all ${
                                                payrollPage === page
                                                    ? 'bg-cyber-primary text-black'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ) : (
                                        <span key={idx} className="text-gray-500 px-1 text-xs">...</span>
                                    )
                                ))}
                            </div>

                            <button
                                onClick={() => setPayrollPage(Math.min(payrollTotalPages, payrollPage + 1))}
                                disabled={payrollPage === payrollTotalPages}
                                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                                    payrollPage === payrollTotalPages
                                        ? 'text-gray-600 cursor-not-allowed'
                                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                Next
                            </button>
                            <button
                                onClick={() => setPayrollPage(payrollTotalPages)}
                                disabled={payrollPage === payrollTotalPages}
                                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                                    payrollPage === payrollTotalPages
                                        ? 'text-gray-600 cursor-not-allowed'
                                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                »
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6 h-fit">
                <h3 className="font-bold text-white mb-6">Payroll Summary</h3>
                <div className="space-y-4 mb-6">
                    <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                        <p className="text-gray-400 text-xs uppercase font-bold mb-1">Base Salaries</p>
                        <p className="text-2xl font-mono font-bold text-white">{CURRENCY_SYMBOL} {totalSalaries.toLocaleString()}</p>
                    </div>
                    {totalBonuses > 0 && (
                        <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                            <p className="text-green-400 text-xs uppercase font-bold mb-1">Performance Bonuses</p>
                            <p className="text-2xl font-mono font-bold text-green-400">+{CURRENCY_SYMBOL} {totalBonuses.toLocaleString()}</p>
                            <p className="text-[10px] text-green-400/60 mt-1">Based on store performance & role distribution</p>
                        </div>
                    )}
                    <div className="p-4 bg-cyber-primary/10 rounded-xl border border-cyber-primary/20">
                        <p className="text-cyber-primary text-xs uppercase font-bold mb-1">Total Monthly Payout</p>
                        <p className="text-3xl font-mono font-bold text-cyber-primary">{CURRENCY_SYMBOL} {(totalSalaries + totalBonuses).toLocaleString()}</p>
                        <p className="text-[10px] text-gray-500 mt-2">{employees.length} Active Employees</p>
                    </div>
                </div>
                <button
                    onClick={handleProcessPayroll}
                    className="w-full py-4 bg-cyber-primary text-black font-bold rounded-xl mb-3 hover:bg-cyber-accent transition-colors flex items-center justify-center gap-2"
                >
                    <CheckCircle size={18} /> Process Run
                </button>
                <button onClick={handleDownloadBankFile} disabled={isSubmitting} className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-sm border border-white/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null} {isSubmitting ? 'Downloading...' : 'Download Bank File'}
                </button>
            </div>
        </div>
    );
};
export default PayrollTab;
