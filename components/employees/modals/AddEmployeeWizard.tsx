import React from 'react';
import { 
    CheckCircle, Upload, MapPin, Briefcase, AlertTriangle, User, DollarSign, Key, 
    ArrowLeft, ArrowRight, Loader2, Eye, EyeOff 
} from 'lucide-react';
import Modal from '../../Modal';
import { Employee, UserRole } from '../../../types';
import { CURRENCY_SYMBOL } from '../../../constants';
import { useData } from '../../../contexts/DataContext';
import { authService } from '../../../services/auth.service';

interface AddEmployeeWizardProps {
    isOpen: boolean;
    onClose: () => void;
    addStep: number;
    newEmpData: any;
    setNewEmpData: (data: any) => void;
    handlePhotoClick: () => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    user: any;
    sites: any[];
    availableRoles: any[];
    handleRoleChange: (role: UserRole) => void;
    availableDepartments: string[];
    handleWizardBack: () => void;
    handleWizardNext: () => void;
    handleFinalSubmit: () => void;
    isSubmitting: boolean;
    resetWizard: () => void;
    canAdjustPayroll: boolean;
}

export default function AddEmployeeWizard({
    isOpen,
    onClose,
    addStep,
    newEmpData,
    setNewEmpData,
    handlePhotoClick,
    fileInputRef,
    handleFileChange,
    user,
    sites,
    availableRoles,
    handleRoleChange,
    availableDepartments,
    handleWizardBack,
    handleWizardNext,
    handleFinalSubmit,
    isSubmitting,
    resetWizard,
    canAdjustPayroll
}: AddEmployeeWizardProps) {
    const { settings, activeSite } = useData();
    const currencySymbol = (activeSite as any)?.currency || settings?.currency || CURRENCY_SYMBOL;
    const [showPassword, setShowPassword] = React.useState(false);
    return (
        <Modal isOpen={isOpen} onClose={resetWizard} title="Onboard Talent" size="lg">
            <div className="flex flex-col h-[500px]">
                {/* Stepper */}
                <div className="flex justify-between items-center mb-8 px-4">
                    {[1, 2, 3, 4].map(step => (
                        <div key={step} className="flex flex-col items-center relative z-10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step === addStep ? 'bg-cyber-primary text-black scale-110 shadow-[0_0_15px_rgba(0,255,157,0.5)]' :
                                step < addStep ? 'bg-green-500 text-black' : 'bg-white/10 text-gray-500'
                                }`}>
                                {step < addStep ? <CheckCircle size={16} /> : step}
                            </div>
                            <span className={`text-[10px] mt-2 uppercase font-bold ${step === addStep ? 'text-cyber-primary' : 'text-gray-500'}`}>
                                {['Identity', 'Role', 'Details', 'Review'][step - 1]}
                            </span>
                        </div>
                    ))}
                    <div className="absolute top-[88px] left-12 right-12 h-0.5 bg-white/10 -z-0">
                        <div 
                            className="h-full bg-cyber-primary transition-all duration-500" 
                            ref={(el) => { if (el) el.style.width = `${((addStep - 1) / 3) * 100}%`; }}
                        ></div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto px-4 py-2">
                    {/* STEP 1: IDENTITY */}
                    {addStep === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="flex gap-6">
                                <div
                                    onClick={handlePhotoClick}
                                    className="w-32 h-32 bg-black/30 border border-white/10 rounded-2xl flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-cyber-primary cursor-pointer transition-all group overflow-hidden relative"
                                >
                                    {newEmpData.avatar ? (
                                        <img src={newEmpData.avatar} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <Upload size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                                            <span className="text-xs text-center px-2">Upload Photo</span>
                                        </>
                                    )}
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">First Name <span className="text-red-500">*</span></label>
                                            <input
                                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-cyber-primary outline-none"
                                                value={newEmpData.firstName}
                                                onChange={e => setNewEmpData({ ...newEmpData, firstName: e.target.value })}
                                                aria-label="First Name"
                                                title="First Name"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Last Name</label>
                                            <input
                                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-cyber-primary outline-none"
                                                value={newEmpData.lastName}
                                                onChange={e => setNewEmpData({ ...newEmpData, lastName: e.target.value })}
                                                aria-label="Last Name"
                                                title="Last Name"
                                            />
                                        </div>
                                    </div>
                                    <div className="bg-white/5 rounded-lg px-3 py-2.5 border border-white/10">
                                        <span className="text-xs text-gray-400 uppercase font-bold">Email Address</span>
                                        <p className="text-xs text-cyan-400 mt-1">📧 Auto-generated after employee ID is assigned</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Password (For Login) <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 pr-10 text-white focus:border-cyber-primary outline-none"
                                                value={newEmpData.password}
                                                onChange={e => setNewEmpData({ ...newEmpData, password: e.target.value })}
                                                placeholder="••••••••"
                                                aria-label="Password"
                                                title="Password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'hr') && (
                                <div>
                                    <label className="text-xs text-cyber-primary uppercase font-bold mb-2 block flex items-center gap-2"><MapPin size={14} /> Assign Workplace</label>
                                    <select
                                        className="w-full bg-cyber-primary/10 border border-cyber-primary/30 text-white rounded-lg px-3 py-3 outline-none"
                                        value={newEmpData.siteId}
                                        onChange={e => setNewEmpData({ ...newEmpData, siteId: e.target.value })}
                                        aria-label="Assign Workplace"
                                        title="Assign Workplace"
                                    >
                                        {sites.map(s => (
                                            <option key={s.id} value={s.id} className="text-black">{s.name} ({s.type})</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-gray-500 mt-1">Employee will only see data for this location.</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Phone Number</label>
                                    <input
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-cyber-primary outline-none"
                                        value={newEmpData.phone}
                                        placeholder="e.g. +251 911..."
                                        onChange={e => setNewEmpData({ ...newEmpData, phone: e.target.value })}
                                        aria-label="Phone Number"
                                        title="Phone Number"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Address</label>
                                    <input
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-cyber-primary outline-none"
                                        value={newEmpData.address}
                                        onChange={e => setNewEmpData({ ...newEmpData, address: e.target.value })}
                                        aria-label="Address"
                                        title="Address"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: ROLE */}
                    {addStep === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <p className="text-sm text-gray-400 mb-2">Select System Access Level (Filtered by your permissions)</p>
                            <div className="grid grid-cols-2 gap-3">
                                {availableRoles.map(roleObj => {
                                    const violations = authService.validateSeparationOfDuties(roleObj.id);
                                    const hasViolations = violations.length > 0;

                                    return (
                                        <div
                                            key={roleObj.id}
                                            onClick={() => handleRoleChange(roleObj.id)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 relative ${newEmpData.role === roleObj.id
                                                ? `bg-white/10 ${roleObj.styles.text} ${roleObj.styles.border} shadow-[0_0_15px_rgba(255,255,255,0.1)]`
                                                : 'bg-black/20 border-white/5 hover:border-white/20'
                                                }`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${newEmpData.role === roleObj.id ? 'border-white' : 'border-gray-500'
                                                }`}>
                                                {newEmpData.role === roleObj.id && <div className="w-2 h-2 bg-white rounded-full" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-white font-bold uppercase text-sm">{roleObj.label}</p>
                                                    {hasViolations && (
                                                        <div className="group/sod relative">
                                                            <AlertTriangle size={14} className="text-yellow-500" />
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black border border-yellow-500/50 rounded text-[10px] text-yellow-200 opacity-0 group-hover/sod:opacity-100 pointer-events-none transition-opacity z-50">
                                                                Warning: This role has inherent Separation of Duties conflicts: {violations.join(', ')}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-gray-400">{roleObj.desc}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: DETAILS */}
                    {addStep === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">Department (Filtered)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {availableDepartments.map(dept => (
                                        <button
                                            key={dept}
                                            onClick={() => setNewEmpData({ ...newEmpData, department: dept })}
                                            className={`px-3 py-2 rounded-lg text-xs font-bold text-left transition-colors ${newEmpData.department === dept ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                }`}
                                        >
                                            {dept}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                                        Monthly Salary ({currencySymbol}) 
                                        {!canAdjustPayroll && <span className="text-[10px] text-amber-500 ml-2">(HR/Admin Only)</span>}
                                    </label>
                                    <input
                                        type="number"
                                        disabled={!canAdjustPayroll}
                                        className={`w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-cyber-primary outline-none font-mono ${!canAdjustPayroll ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        value={newEmpData.salary}
                                        onChange={e => setNewEmpData({ ...newEmpData, salary: e.target.value })}
                                        aria-label="Monthly Salary"
                                        title="Monthly Salary"
                                        placeholder={!canAdjustPayroll ? "Restricted" : "0"}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Specialization</label>
                                    <input
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-cyber-primary outline-none"
                                        placeholder="e.g. Cold Storage"
                                        value={newEmpData.specialization}
                                        onChange={e => setNewEmpData({ ...newEmpData, specialization: e.target.value })}
                                        aria-label="Specialization"
                                        title="Specialization"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Start Date</label>
                                <input
                                    type="date"
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-cyber-primary outline-none"
                                    value={newEmpData.joinDate}
                                    onChange={e => setNewEmpData({ ...newEmpData, joinDate: e.target.value })}
                                    aria-label="Start Date"
                                    title="Start Date"
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 4: REVIEW */}
                    {addStep === 4 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <p className="text-sm text-gray-400 mb-4">Review and confirm all details before creating the employee profile.</p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <h4 className="text-xs text-gray-400 uppercase font-bold mb-3 flex items-center gap-2">
                                        <User size={14} /> Personal Information
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Full Name:</span>
                                            <span className="text-white font-medium">{newEmpData.firstName} {newEmpData.lastName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Email:</span>
                                            <span className="text-cyan-400 font-mono text-xs italic">Auto-assigned with ID</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Phone:</span>
                                            <span className="text-white">{newEmpData.phone || 'Not provided'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Join Date:</span>
                                            <span className="text-white">{newEmpData.joinDate || new Date().toISOString().split('T')[0]}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <h4 className="text-xs text-gray-400 uppercase font-bold mb-3 flex items-center gap-2">
                                        <Briefcase size={14} /> Role & Location
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Role:</span>
                                            <span className="text-cyber-primary font-bold uppercase text-xs">{newEmpData.role.replace('_', ' ')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Department:</span>
                                            <span className="text-white">{newEmpData.department}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Location:</span>
                                            <span className="text-white font-medium">{sites.find(s => s.id === newEmpData.siteId)?.name || 'Central Operations'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Site Type:</span>
                                            <span className="text-white">{sites.find(s => s.id === newEmpData.siteId)?.type || 'Administration'}</span>
                                        </div>
                                    </div>
                                </div>

                                {newEmpData.salary && (
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <h4 className="text-xs text-gray-400 uppercase font-bold mb-3 flex items-center gap-2">
                                            <DollarSign size={14} /> Compensation
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Base Salary:</span>
                                                <span className="text-green-400 font-bold">{currencySymbol} {parseFloat(newEmpData.salary).toLocaleString()}/mo</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Specialization:</span>
                                                <span className="text-white">{newEmpData.specialization || 'Generalist'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {newEmpData.password && (
                                    <div className="bg-cyber-primary/10 rounded-xl p-4 border border-cyber-primary/30">
                                        <h4 className="text-xs text-cyber-primary uppercase font-bold mb-3 flex items-center gap-2">
                                            <Key size={14} /> Login Credentials
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Email:</span>
                                                <span className="text-cyan-400 font-mono text-xs italic">Auto-generated with employee ID</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400">Password:</span>
                                                <span className="text-white font-mono text-xs">
                                                    {['super_admin', 'hr'].includes(user?.role || '')
                                                        ? newEmpData.password
                                                        : '•'.repeat(newEmpData.password.length)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-cyan-400 mt-2">✓ Login account will be created with auto-generated email</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-xl p-4 border border-white/20">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={newEmpData.avatar || `https://ui-avatars.com/api/?name=${newEmpData.firstName}+${newEmpData.lastName}&background=random`}
                                        alt=""
                                        className="w-16 h-16 rounded-xl object-cover border-2 border-cyber-primary"
                                    />
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-white">{newEmpData.firstName} {newEmpData.lastName}</h3>
                                        <p className="text-cyber-primary text-sm font-bold uppercase">{newEmpData.role.replace('_', ' ')}</p>
                                        <p className="text-gray-400 text-xs">{newEmpData.department} • {sites.find(s => s.id === newEmpData.siteId)?.name || 'Central Operations'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400">Employee ID</p>
                                        <p className="text-cyan-400 font-mono font-bold">Will be assigned</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Footer */}
                <div className="pt-4 border-t border-white/10 flex justify-between mt-auto">
                    <button
                        onClick={handleWizardBack}
                        disabled={addStep === 1}
                        className="px-6 py-3 rounded-xl text-gray-400 font-bold hover:text-white disabled:opacity-30 transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft size={16} /> Back
                    </button>

                    {addStep < 4 ? (
                        <button
                            onClick={handleWizardNext}
                            className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                            Next Step <ArrowRight size={16} />
                        </button>
                    ) : (
                        <button
                            onClick={handleFinalSubmit}
                            disabled={isSubmitting}
                            className={`px-8 py-3 bg-cyber-primary text-black font-bold rounded-xl hover:bg-cyber-accent transition-colors shadow-[0_0_20px_rgba(0,255,157,0.3)] flex items-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                            {isSubmitting ? 'Creating...' : 'Confirm & Create'}
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
}
