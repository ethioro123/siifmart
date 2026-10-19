import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, FileText, Loader2, Save } from 'lucide-react';
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
import type { EmployeeDraft } from '../../../utils/employeeDrafts';
import { EmployeeDraftsDrawer } from '../wizard/EmployeeDraftsDrawer';

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
    drafts?: EmployeeDraft[];
    activeDraftId?: string | null;
    onResumeDraft?: (draftId: string) => void;
    onDeleteDraft?: (draftId: string) => void;
    onStartNewCandidate?: () => void;
    isSavingDraft?: boolean;
    draftSaveError?: boolean;
    lastSavedAt?: string | null;
    quotaResult?: any;
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
    handleSaveDraft,
    drafts = [],
    activeDraftId = null,
    onResumeDraft,
    onDeleteDraft,
    onStartNewCandidate,
    isSavingDraft = false,
    draftSaveError = false,
    lastSavedAt,
    quotaResult
}: AddEmployeeWizardProps) {
    const { settings, activeSite, addNotification } = useData();
    const [isDraftsOpen, setIsDraftsOpen] = useState(false);
    const currencySymbol = (activeSite as any)?.currency || settings?.currency || CURRENCY_SYMBOL;
    const isDirect = isDirectOnboardingAuthorized(user?.role, newEmpData.role, Boolean(quotaResult?.canAutoActivate));

    return (
        <>
        <Modal
            isOpen={isOpen}
            onClose={resetWizard}
            title={getOnboardingModalTitle(user?.role, newEmpData.role, Boolean(quotaResult?.canAutoActivate))}
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
                        {handleSaveDraft && (
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
                                {getOnboardingSubmitLabel(user?.role, isSubmitting, newEmpData.role, Boolean(quotaResult?.canAutoActivate))}
                            </button>
                        )}
                    </div>
                </div>
            }
        >
            <div className="flex flex-col">
                <>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3 py-2">
                        <div className="text-xs text-[var(--theme-text-secondary)]" role="status" aria-live="polite">
                            {draftSaveError ? 'Could not save on this device. Check browser storage.' :
                                isSavingDraft ? 'Saving draft…' : lastSavedAt ? 'Progress saved on this device' : 'Progress saves automatically as you work'}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsDraftsOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-accent)]"
                        >
                            <FileText size={14} /> Saved drafts ({drafts.length})
                        </button>
                    </div>
                </>
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
                            quotaResult={quotaResult}
                        />
                    )}
                </div>
            </div>
        </Modal>
        {onResumeDraft && onDeleteDraft && onStartNewCandidate && (
            <EmployeeDraftsDrawer
                isOpen={isDraftsOpen}
                onClose={() => setIsDraftsOpen(false)}
                drafts={drafts}
                activeDraftId={activeDraftId}
                onResumeDraft={draftId => {
                    onResumeDraft(draftId);
                    setIsDraftsOpen(false);
                }}
                onDeleteDraft={onDeleteDraft}
                onStartNewCandidate={() => {
                    onStartNewCandidate();
                    setIsDraftsOpen(false);
                }}
            />
        )}
        </>
    );
}
