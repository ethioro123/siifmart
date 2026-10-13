import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Save } from 'lucide-react';
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
import { getOnboardingSubmitLabel, getOnboardingModalTitle, isDirectOnboardingAuthorized } from '../../../utils/employeeOnboardingGovernance';

interface AddEmployeeWizardProps {
    isOpen: boolean;
    onClose: () => void;
    addStep: number;
    setAddStep?: (step: number) => void;
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
    handleSaveDraft?: () => void;
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
    canAdjustPayroll,
    handleSaveDraft
}: AddEmployeeWizardProps) {
    const { settings, activeSite, addNotification } = useData();
    const currencySymbol = (activeSite as any)?.currency || settings?.currency || CURRENCY_SYMBOL;
    const isDirect = isDirectOnboardingAuthorized(user?.role);

    return (
        <Modal
            isOpen={isOpen}
            onClose={resetWizard}
            title={getOnboardingModalTitle(user?.role)}
            size="xl"
            closeOnClickOutside={false}
            closeOnEscape={false}
            footer={
                <div className="flex justify-between items-center w-full">
                    <button
                        type="button"
                        onClick={handleWizardBack}
                        disabled={addStep === 1}
                        className="px-5 py-2.5 rounded-xl text-[var(--theme-text-secondary)] font-semibold text-xs hover:bg-[var(--theme-bg-subtle)] disabled:opacity-30 disabled:hover:bg-transparent transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <ArrowLeft size={15} /> Back
                    </button>

                    <div className="flex items-center gap-2">
                        {handleSaveDraft && !isDirect && (
                            <button
                                type="button"
                                onClick={handleSaveDraft}
                                className="px-4 py-2.5 rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)] hover:bg-[var(--theme-bg-subtle)] font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <Save size={14} />
                                <span>Save Draft</span>
                            </button>
                        )}
                        {addStep < 5 ? (
                            <button
                                type="button"
                                onClick={handleWizardNext}
                                className="px-6 py-2.5 bg-[#2C5E3B] hover:bg-[#234b2f] text-white font-semibold rounded-xl text-xs transition-all flex items-center gap-2 shadow-sm cursor-pointer active:scale-[0.98]"
                            >
                                Continue <ArrowRight size={15} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleFinalSubmit}
                                disabled={isSubmitting}
                                className={`px-7 py-2.5 bg-[#2C5E3B] hover:bg-[#234b2f] text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-[0.98] ${
                                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle size={15} />}
                                {getOnboardingSubmitLabel(user?.role, isSubmitting)}
                            </button>
                        )}
                    </div>
                </div>
            }
        >
            <div className="flex flex-col">
                {/* 5-Step Stepper */}
                <WizardStepper currentStep={addStep} steps={WIZARD_STEPS} />

                {/* Step Content */}
                <div className="pt-2">
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
            </div>
        </Modal>
    );
}
