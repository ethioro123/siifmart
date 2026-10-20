// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
    saveEmployeeDraft,
    getEmployeeDrafts,
    deleteEmployeeDraft,
    clearEmployeeDrafts
} from '../../utils/employeeDrafts';
import { DOCUMENT_CATEGORIES } from '../../components/employees/wizard/StepDocumentsCertificates';
import {
    saveEmployeeDocument,
    getEmployeeDocuments,
    addEmployeeDocument
} from '../../utils/employeeProfileData';
import { NewEmployeeFormData } from '../../hooks/useEmployeeWizard';

describe('Worker Onboarding Drafts & Document Verification', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('Candidate Onboarding Drafts (Sovereign Country Isolated)', () => {
        const mockEthiopianCandidate: NewEmployeeFormData = {
            firstName: 'Abebe',
            lastName: 'Kebede',
            email: 'abebe@siifmart.com',
            phone: '+251911223344',
            password: 'SecurePassword123',
            createAppAccount: true,
            role: 'warehouse_manager',
            jobTitle: 'Warehouse Manager',
            department: 'Logistics & Warehouse',
            salary: '25000',
            specialization: 'Warehouse Ops',
            address: 'Addis Ababa Bole Subcity',
            emergencyContact: '+251922334455',
            joinDate: '2026-10-15',
            avatar: '',
            siteId: 'ADD-WH-01',
            nationalIdNumber: 'ETH-ID-9921',
            nationalIdPhoto: 'data:image/jpeg;base64,mockIdPhoto',
            certificates: [
                {
                    id: 'cert_1',
                    name: 'Heavy_Machinery_Forklift_License.pdf',
                    size: '240 KB',
                    type: 'pdf',
                    category: "Driver's License",
                    dataUrl: 'data:application/pdf;base64,mockCert'
                }
            ]
        };

        const mockKenyanCandidate: NewEmployeeFormData = {
            firstName: 'Wanjiku',
            lastName: 'Mwangi',
            email: 'wanjiku@siifmart.com',
            phone: '+254712345678',
            password: 'SecurePassword456',
            createAppAccount: true,
            role: 'store_manager',
            jobTitle: 'Store Manager',
            department: 'Retail Operations',
            salary: '85000',
            specialization: 'Store Lead',
            address: 'Nairobi Westlands',
            emergencyContact: '+254722334455',
            joinDate: '2026-10-18',
            avatar: '',
            siteId: 'NRB-RET-01',
            certificates: [
                {
                    id: 'cert_ke_1',
                    name: 'KRA_Compliance_Certificate.pdf',
                    size: '180 KB',
                    type: 'pdf',
                    category: 'Professional Certificate',
                    dataUrl: 'data:application/pdf;base64,mockKeCert'
                }
            ]
        };

        it('saves worker draft and tracks step, title, and attached documents count', () => {
            const draft = saveEmployeeDraft(
                mockEthiopianCandidate,
                3, // Step 3
                null,
                'ET',
                'Addis Central Distribution Center'
            );

            expect(draft.id).toBeDefined();
            expect(draft.title).toBe('Abebe Kebede');
            expect(draft.step).toBe(3);
            expect(draft.role).toBe('warehouse_manager');
            expect(draft.siteName).toBe('Addis Central Distribution Center');
            expect(draft.countryCode).toBe('ET');
            // 1 national ID photo + 1 certificate = 2 docs
            expect(draft.attachedDocsCount).toBe(2);

            const storedDrafts = getEmployeeDrafts('ET');
            expect(storedDrafts).toHaveLength(1);
            expect(storedDrafts[0].title).toBe('Abebe Kebede');
            expect(storedDrafts[0].data.firstName).toBe('Abebe');
        });

        it('strictly isolates Ethiopian and Kenyan worker drafts across borders', () => {
            saveEmployeeDraft(mockEthiopianCandidate, 2, null, 'ET', 'Addis Warehouse');
            saveEmployeeDraft(mockKenyanCandidate, 4, null, 'KE', 'Nairobi Flagship');

            const etDrafts = getEmployeeDrafts('ET');
            const keDrafts = getEmployeeDrafts('KE');

            expect(etDrafts).toHaveLength(1);
            expect(etDrafts[0].title).toBe('Abebe Kebede');
            expect(etDrafts[0].countryCode).toBe('ET');

            expect(keDrafts).toHaveLength(1);
            expect(keDrafts[0].title).toBe('Wanjiku Mwangi');
            expect(keDrafts[0].countryCode).toBe('KE');

            // Cross-border verification: Ethiopia drafts must NEVER appear in Kenya
            expect(keDrafts.some(d => d.title === 'Abebe Kebede')).toBe(false);
            expect(etDrafts.some(d => d.title === 'Wanjiku Mwangi')).toBe(false);
        });

        it('updates an existing draft without duplicating it', () => {
            const firstSave = saveEmployeeDraft(mockEthiopianCandidate, 2, null, 'ET');
            expect(getEmployeeDrafts('ET')).toHaveLength(1);

            // Update with step 4
            const updatedSave = saveEmployeeDraft(
                { ...mockEthiopianCandidate, salary: '30000' },
                4,
                firstSave.id,
                'ET'
            );

            const drafts = getEmployeeDrafts('ET');
            expect(drafts).toHaveLength(1);
            expect(drafts[0].id).toBe(firstSave.id);
            expect(drafts[0].step).toBe(4);
            expect(drafts[0].data.salary).toBe('30000');
        });

        it('deletes worker draft cleanly by ID', () => {
            const draft = saveEmployeeDraft(mockEthiopianCandidate, 1, null, 'ET');
            expect(getEmployeeDrafts('ET')).toHaveLength(1);

            deleteEmployeeDraft(draft.id, 'ET');
            expect(getEmployeeDrafts('ET')).toHaveLength(0);
        });

        it('clears all drafts for a sovereign country without affecting other countries', () => {
            saveEmployeeDraft(mockEthiopianCandidate, 1, null, 'ET');
            saveEmployeeDraft(mockKenyanCandidate, 1, null, 'KE');

            clearEmployeeDrafts('ET');
            expect(getEmployeeDrafts('ET')).toHaveLength(0);
            expect(getEmployeeDrafts('KE')).toHaveLength(1);
        });
    });

    describe('Document Categories & Verification Credentials', () => {
        it('exports standardized document categories matching approval specifications', () => {
            expect(DOCUMENT_CATEGORIES).toBeDefined();
            const categoryIds = DOCUMENT_CATEGORIES.map(c => c.id);

            expect(categoryIds).toContain('Professional Certificate');
            expect(categoryIds).toContain("Driver's License");
            expect(categoryIds).toContain('Academic Degree / Diploma');
            expect(categoryIds).toContain('Certificate of Good Conduct');
            expect(categoryIds).toContain('National ID / Passport');
            expect(categoryIds).toContain('Medical Clearance Form');
            expect(categoryIds).toContain('Employment Contract / NDA');
            expect(categoryIds).toContain('Other Compliance Document');
        });

        it('preserves document category when saving and retrieving employee personnel files', () => {
            const empId = 'EMP-TEST-001';

            saveEmployeeDocument(empId, {
                name: 'Driver_License_Heavy_Class.pdf',
                size: '250 KB',
                type: 'pdf',
                category: "Driver's License",
                dataUrl: 'data:application/pdf;base64,mockLicense'
            });

            saveEmployeeDocument(empId, {
                name: 'Degree_Certificate_Economics.pdf',
                size: '410 KB',
                type: 'pdf',
                category: 'Academic Degree / Diploma',
                dataUrl: 'data:application/pdf;base64,mockDegree'
            });

            const docs = getEmployeeDocuments(empId);
            // 2 added docs + 2 default docs
            expect(docs).toHaveLength(4);

            const licenseDoc = docs.find(d => d.name === 'Driver_License_Heavy_Class.pdf');
            expect(licenseDoc).toBeDefined();
            expect(licenseDoc?.category).toBe("Driver's License");

            const degreeDoc = docs.find(d => d.name === 'Degree_Certificate_Economics.pdf');
            expect(degreeDoc).toBeDefined();
            expect(degreeDoc?.category).toBe('Academic Degree / Diploma');
        });

        it('supports optional category parameter in addEmployeeDocument', () => {
            const empId = 'EMP-TEST-002';

            addEmployeeDocument(
                empId,
                'Police_Clearance_Good_Conduct.pdf',
                '190 KB',
                undefined,
                'Certificate of Good Conduct'
            );

            const docs = getEmployeeDocuments(empId);
            // 1 added doc + 2 default docs
            expect(docs).toHaveLength(3);
            const addedDoc = docs.find(d => d.name === 'Police_Clearance_Good_Conduct.pdf');
            expect(addedDoc).toBeDefined();
            expect(addedDoc?.category).toBe('Certificate of Good Conduct');
        });
    });
});
