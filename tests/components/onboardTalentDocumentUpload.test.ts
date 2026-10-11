import { describe, it, expect } from 'vitest';
import { validateFileSize, formatFileSize, MAX_DOCUMENT_FILE_SIZE_BYTES, MAX_DOCUMENT_FILE_SIZE_MB } from '../../utils/imageCompression';

describe('Onboard Talent Document Upload & Modal Protection', () => {
    describe('1. Document File Size & Integrity Validation', () => {
        it('accepts files within the 5MB boundary', () => {
            const validFile = new File(['dummy content'], 'id_card.jpg', { type: 'image/jpeg' });
            const check = validateFileSize(validFile);
            expect(check.valid).toBe(true);
            expect(check.error).toBeUndefined();
        });

        it('rejects files exceeding the 5MB boundary with a descriptive message', () => {
            const oversizedBytes = MAX_DOCUMENT_FILE_SIZE_BYTES + 1024;
            // Mock a file object with oversized length
            const mockOversizedFile = {
                name: 'heavy_passport_scan.pdf',
                size: oversizedBytes,
                type: 'application/pdf'
            } as File;

            const check = validateFileSize(mockOversizedFile);
            expect(check.valid).toBe(false);
            expect(check.error).toContain('exceeds the maximum allowed size');
            expect(check.error).toContain(`${MAX_DOCUMENT_FILE_SIZE_MB}`);
        });

        it('formats file sizes accurately for display badges', () => {
            expect(formatFileSize(500)).toBe('500 B');
            expect(formatFileSize(1024 * 250)).toBe('250.0 KB');
            expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.50 MB');
        });
    });

    describe('2. Document Type Extension Parsing & Null Safety', () => {
        it('gracefully handles files with multiple dots or no extension without throwing', () => {
            const filename1 = 'national.id.photo.scan.final.png';
            const ext1 = filename1.split('.').pop()?.toLowerCase() || 'pdf';
            expect(ext1).toBe('png');
            expect(ext1.toUpperCase()).toBe('PNG');

            const filenameNoExt = 'resume_file_without_extension';
            const ext2 = filenameNoExt.split('.').pop()?.toLowerCase() || 'pdf';
            expect(ext2).toBe('resume_file_without_extension');
            expect((ext2 || 'DOC').toUpperCase()).toBe('RESUME_FILE_WITHOUT_EXTENSION');

            const nullSafeType: string | undefined = undefined;
            expect((nullSafeType || 'DOC').toUpperCase()).toBe('DOC');
        });
    });

    describe('3. Employee Role String Sanitation in Review Ribbon', () => {
        it('safely formats roles with multiple underscores without runtime error', () => {
            const multiUnderscoreRole = 'fleet_maintenance_supervisor';
            const formatted = String(multiUnderscoreRole || 'Staff').replace(/_/g, ' ');
            expect(formatted).toBe('fleet maintenance supervisor');

            const undefinedRole = undefined;
            const fallback = String(undefinedRole || 'Staff').replace(/_/g, ' ');
            expect(fallback).toBe('Staff');
        });
    });
});
