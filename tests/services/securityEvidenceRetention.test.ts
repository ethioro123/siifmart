import { beforeEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ from: vi.fn(), storageFrom: vi.fn(), upload: vi.fn(), remove: vi.fn(), publicUrl: vi.fn(), single: vi.fn() }));
vi.mock('../../lib/supabase', () => ({ supabase: { from: mock.from, storage: { from: mock.storageFrom } } }));
import { uploadProfilePhoto, deleteProfilePhoto, deleteAllEmployeePhotos } from '../../services/imageStorage.service';
import { cascadeDeleteProduct } from '../../services/products/products-cleanup';
import { employeeDocumentsService } from '../../services/employee-documents.service';
const employeeId = '00000000-0000-4000-8000-000000000001';
beforeEach(() => {
  vi.clearAllMocks();
  mock.storageFrom.mockReturnValue({ upload: mock.upload, remove: mock.remove, getPublicUrl: mock.publicUrl });
  mock.upload.mockImplementation(async (path: string) => ({ data: { path }, error: null }));
  mock.publicUrl.mockImplementation((path: string) => ({ data: { publicUrl: `https://example.test/storage/v1/object/public/avatars/${path}` } }));
  const query = { delete: vi.fn(), eq: vi.fn(), select: vi.fn(), single: mock.single };
  query.delete.mockReturnValue(query); query.eq.mockReturnValue(query); query.select.mockReturnValue(query);
  mock.from.mockReturnValue(query); mock.single.mockResolvedValue({ data: { id: employeeId }, error: null });
});
describe('retained identity and operational evidence', () => {
  it('retains the old image while uploading a uniquely named replacement', async () => {
    const saved = await uploadProfilePhoto(employeeId, 'data:image/jpeg;base64,cGhvdG8=', 'https://example.test/storage/v1/object/public/avatars/old.jpg');
    expect(saved.success).toBe(true);
    expect(mock.remove).not.toHaveBeenCalled();
    expect(mock.upload).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`^profile-photos/${employeeId}/`)), expect.any(Blob), expect.objectContaining({ upsert: false }));
  });
  it('does not delete the old image when uploading its replacement fails', async () => {
    mock.upload.mockResolvedValue({ data: null, error: { message: 'Upload rejected' } });
    expect((await uploadProfilePhoto(employeeId, 'data:image/jpeg;base64,cGhvdG8=', 'old-photo')).success).toBe(false);
    expect(mock.remove).not.toHaveBeenCalled();
  });
  it('rejects image types outside the server bucket allowlist', async () => {
    expect((await uploadProfilePhoto(employeeId, 'data:image/svg+xml;base64,cGhvdG8=')).success).toBe(false);
    expect(mock.upload).not.toHaveBeenCalled();
  });
  it('rejects invalid employee paths before invoking Storage', async () => {
    expect((await uploadProfilePhoto('../another-employee', 'data:image/jpeg;base64,cGhvdG8=')).success).toBe(false);
    expect(mock.storageFrom).not.toHaveBeenCalled();
  });
  it('refuses individual and bulk photo destruction without calling Storage', async () => {
    expect((await deleteProfilePhoto('old-photo')).success).toBe(false);
    expect((await deleteAllEmployeePhotos(employeeId)).success).toBe(false);
    expect(mock.storageFrom).not.toHaveBeenCalled();
  });
  it('refuses personnel-document deletion without reporting success or writing a deletion log', async () => {
    await expect(employeeDocumentsService.deleteDocument(employeeId, employeeId, 'HR reviewer')).rejects.toThrow('retained employment evidence');
    expect(mock.from).not.toHaveBeenCalled();
  });
  it('uses the guarded product deletion and never unlinks evidence first', async () => {
    await cascadeDeleteProduct(employeeId);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledWith('products');
  });
  it('propagates a server evidence denial', async () => {
    mock.single.mockResolvedValue({ data: null, error: new Error('Retain product history') });
    await expect(cascadeDeleteProduct(employeeId)).rejects.toThrow('Retain product history');
  });
  it('does not claim deletion when no row was confirmed', async () => {
    mock.single.mockResolvedValue({ data: null, error: null });
    await expect(cascadeDeleteProduct(employeeId)).rejects.toThrow('was not confirmed');
  });
});
