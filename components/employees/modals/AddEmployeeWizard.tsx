import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import Modal from '../../Modal';
import { UserRole } from '../../../types';
import { CURRENCY_SYMBOL } from '../../../constants';
import { useData } from '../../../contexts/DataContext';

import WizardStepper from '../wizard/WizardStepper';
import StepIdentity from '../wizard/StepIdentity';
import StepRole from '../wizard/StepRole';
import StepDetails from '../wizard/StepDetails';
import StepDocuments from '../wizard/StepDocuments';
import StepReview from '../wizard/StepReview';

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

const WIZARD_STEPS = ['Identity', 'Role', 'Details', 'Documents', 'Review'];

export default function AddEmployeeWizard({
    isOpen,
    addStep,
    newEmpData,
    setNewEmpData,
    handlePhotoClick,
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
    const { settings, activeSite, addNotification } = useData();
    const currencySymbol = (activeSite as any)?.currency || settings?.currency || CURRENCY_SYMBOL;

    return (
        <Modal
            isOpen={isOpen}
            onClose={resetWizard}
            title="Onboard Talent"
            size="xl"
            closeOnClickOutside={false}
            closeOnEscape={false}
        >
            <div className="flex flex-col min-h-[480px]">
                {/* 5-Step Stepper */}
                <WizardStepper currentStep={addStep} steps={WIZARD_STEPS} />

                {/* Step Content */}
                <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-2 custom-scrollbar">
                    {addStep === 1 && (
                        <StepIdentity
                            newEmpData={newEmpData}
                            setNewEmpData={setNewEmpData}
                            handlePhotoClick={handlePhotoClick}
                            user={user}
                            sites={sites}
                            activeSite={activeSite}
                        />
                    )}

                    {addStep === 2 && (
                        <StepRole
                            newEmpData={newEmpData}
                            availableRoles={availableRoles}
                            handleRoleChange={handleRoleChange}
                        />
                    )}

                    {addStep === 3 && (
                        <StepDetails
                            newEmpData={newEmpData}
                            setNewEmpData={setNewEmpData}
                            availableDepartments={availableDepartments}
                            canAdjustPayroll={canAdjustPayroll}
                            currencySymbol={currencySymbol}
                        />
                    )}

                    {addStep === 4 && (
                        <StepDocuments
                            newEmpData={newEmpData}
                            setNewEmpData={setNewEmpData}
                            addNotification={addNotification}
                        />
                    )}

                    {addStep === 5 && (
                        <StepReview
                            newEmpData={newEmpData}
                            sites={sites}
                            currencySymbol={currencySymbol}
                            user={user}
                        />
                    )}
                </div>

                {/* Footer Navigation */}
                <div className="pt-4 mt-6 border-t border-[#E2DCCE] dark:border-white/10 flex justify-between items-center">
                    <button
                        type="button"
                        onClick={handleWizardBack}
                        disabled={addStep === 1}
                        className="px-5 py-2.5 rounded-xl text-stone-600 dark:text-stone-300 font-bold text-xs hover:bg-stone-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <ArrowLeft size={15} /> Back
                    </button>

                    <div className="flex items-center gap-2">
                        {addStep < 5 ? (
                            <button
                                type="button"
                                onClick={handleWizardNext}
                                className="px-6 py-2.5 bg-[#2C5E3B] hover:bg-[#234b2f] text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                            >
                                Continue <ArrowRight size={15} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleFinalSubmit}
                                disabled={isSubmitting}
                                className={`px-7 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer ${
                                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle size={15} />}
                                {isSubmitting ? 'Creating Employee...' : 'Confirm & Onboard Talent'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}
