import { describe, it, expect } from 'vitest';
import { formatFileSize, validateFileSize, MAX_DOCUMENT_FILE_SIZE_BYTES } from '../../utils/imageCompression';

describe('Image and Document Compression Utilities', () => {
    describe('formatFileSize', () => {
        it('formats bytes correctly', () => {
            expect(formatFileSize(500)).toBe('500 B');
            expect(formatFileSize(1024)).toBe('1.0 KB');
            expect(formatFileSize(500 * 1024)).toBe('500.0 KB');
            expect(formatFileSize(5 * 1024 * 1024)).toBe('5.00 MB');
        });
    });

    describe('validateFileSize', () => {
        it('accepts files within 5MB limit', () => {
            const file = new File(['small content'], 'id_card.png', { type: 'image/png' });
            const result = validateFileSize(file);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('rejects files exceeding 5MB limit', () => {
            // Mock a file larger than 5MB
            const largeBlob = new Uint8Array(6 * 1024 * 1024);
            const largeFile = new File([largeBlob], 'huge_scan.pdf', { type: 'application/pdf' });
            const result = validateFileSize(largeFile);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('exceeds the maximum allowed size of 5.00 MB');
        });
    });

    describe('compressImage fallback', () => {
        it('returns file directly in non-browser environment', async () => {
            const { compressImage } = await import('../../utils/imageCompression');
            const file = new File(['mock content'], 'evidence.jpg', { type: 'image/jpeg' });
            const result = await compressImage(file, 'output.jpg');
            expect(result).toBeDefined();
            expect(result.name).toBe('output.jpg');
        });
    });

    describe('readDocumentFile', () => {
        it('rejects oversized document files', async () => {
            const { readDocumentFile } = await import('../../utils/imageCompression');
            const largeBlob = new Uint8Array(6 * 1024 * 1024);
            const largeFile = new File([largeBlob], 'resume.pdf', { type: 'application/pdf' });
            await expect(readDocumentFile(largeFile)).rejects.toThrow('exceeds the maximum allowed size');
        });
    });
});
