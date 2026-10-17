import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '../../contexts/CentralStore';
import { useData } from '../../contexts/DataContext';
import { useEmployeeWizard } from '../../hooks/useEmployeeWizard';
import AddEmployeeWizard from './modals/AddEmployeeWizard';
import ImageEditorModal from '../ImageEditorModal';
import { isManagerialRole } from '../../utils/roles';

interface OnboardTalentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

/**
 * OnboardTalentModal
 * Self-contained delegated talent onboarding modal.
 * Embeddable directly into POS Command Center and WMS Dashboard.
 * Strictly restricted to Managers (Level 1, 2, 3). Level 4 staff are forbidden.
 * Enforces facility domain locking, hierarchical role filters (< manager level),
 * and creates staff in 'Pending Approval' for 4-eyes HR & Finance sign-off.
 */
export function OnboardTalentModal({ isOpen, onClose, onSuccess }: OnboardTalentModalProps) {
    const { user } = useStore();
    const { employees, sites, activeSite, addEmployee, addNotification } = useData();

    // Zero-Trust gate: Level 4 staff (cashiers, pickers, drivers) are forbidden
    const isManager = isManagerialRole(user?.role);

    const wizard = useEmployeeWizard({
        user,
        employees,
        sites,
        activeSite,
        addEmployee,
        addNotification
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [pendingOnboardingImageSrc, setPendingOnboardingImageSrc] = useState<string | null>(null);
    const [isOnboardingEditorOpen, setIsOnboardingEditorOpen] = useState(false);

    const wasOpenRef = useRef(false);

    // Sync open state and initialize wizard with manager's permissible roles & facility
    useEffect(() => {
        if (isOpen && !wasOpenRef.current && isManager) {
            wizard.handleOpenWizard();
        }
        wasOpenRef.current = isOpen;
    }, [isOpen, isManager]);

    const handlePhotoClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setPendingOnboardingImageSrc(reader.result as string);
            setIsOnboardingEditorOpen(true);
        };
        reader.readAsDataURL(file);
    };

    const handleSaveOnboardingPhoto = (croppedResult: string) => {
        wizard.setNewEmpData(prev => ({ ...prev, avatar: croppedResult }));
        setPendingOnboardingImageSrc(null);
        setIsOnboardingEditorOpen(false);
        addNotification('success', 'Profile photo adjusted for new recruit');
    };

    const handleModalClose = () => {
        wizard.resetWizard();
        onClose();
    };

    const handleFinalSubmitWithCallback = async () => {
        const rawPwd = wizard.newEmpData.password;
        const empNameUnder = `${wizard.newEmpData.firstName}_${wizard.newEmpData.lastName}`.toLowerCase();
        const empNameSpace = `${wizard.newEmpData.firstName} ${wizard.newEmpData.lastName}`.toLowerCase();
        const error = await wizard.handleFinalSubmit();
        if (!error) {
            if (rawPwd && typeof window !== 'undefined') {
                try {
                    localStorage.setItem(`siifmart_temp_pwd_by_name_${empNameUnder}`, rawPwd);
                    localStorage.setItem(`siifmart_temp_pwd_by_name_${empNameSpace}`, rawPwd);
                } catch {
                    // ignore
                }
            }
            onSuccess?.();
            onClose();
        }
    };

    if (!isOpen || !isManager) return null;

    return (
        <>
            {/* Hidden Photo File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* Photo Cropper Modal */}
            {isOnboardingEditorOpen && pendingOnboardingImageSrc && (
                <ImageEditorModal
                    isOpen={isOnboardingEditorOpen}
                    imageSrc={pendingOnboardingImageSrc}
                    onClose={() => {
                        setIsOnboardingEditorOpen(false);
                        setPendingOnboardingImageSrc(null);
                    }}
                    onSave={handleSaveOnboardingPhoto}
                />
            )}

            {/* Wizard Modal */}
            <AddEmployeeWizard
                isOpen={isOpen}
                onClose={handleModalClose}
                addStep={wizard.addStep}
                newEmpData={wizard.newEmpData}
                setNewEmpData={wizard.setNewEmpData}
                handlePhotoClick={handlePhotoClick}
                fileInputRef={fileInputRef}
                handleFileChange={handleFileChange}
                user={user}
                sites={sites}
                availableRoles={wizard.availableRoles}
                handleRoleChange={wizard.handleRoleChange}
                availableDepartments={wizard.availableDepartments}
                handleWizardBack={wizard.handleWizardBack}
                handleWizardNext={wizard.handleWizardNext}
                handleFinalSubmit={handleFinalSubmitWithCallback}
                isSubmitting={wizard.isSubmitting}
                resetWizard={handleModalClose}
                canAdjustPayroll={wizard.canAdjustPayroll}
                handleSaveDraft={wizard.handleSaveDraft}
                quotaResult={wizard.quotaResult}
            />
        </>
    );
}

export default OnboardTalentModal;
