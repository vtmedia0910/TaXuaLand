import { z } from 'zod';
export const PublicationStatus = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export const VerificationStatus = z.enum(['VERIFIED', 'DECLARED', 'UNKNOWN', 'EXPIRED']);
export const SourceAuthority = z.enum(['OFFICIAL', 'LAND_OBSERVED', 'PARTNER', 'SELLER', 'THIRD_PARTY', 'LEGACY_IMPORT', 'UNKNOWN']);
export const LocationRole = z.enum(['DECLARED', 'OBSERVED', 'VERIFIED']);
export const PermissionStatus = z.enum(['ALLOWED', 'DENIED', 'UNKNOWN']);
export const ImportStatus = z.enum(['UPLOADED', 'VALIDATING', 'READY_FOR_REVIEW', 'REJECTED', 'COMMITTED', 'FAILED']);
export const RowAction = z.enum(['CREATE', 'UPDATE', 'SKIP', 'REVIEW_LATER']);
export const ReleaseStatus = z.enum(['DRAFT', 'VALIDATED', 'APPROVED', 'REJECTED', 'PUBLISHED', 'RETIRED']);
export const Role = z.enum(['DATA_VIEWER', 'DATA_EDITOR', 'VERIFIER', 'PUBLISHER', 'SYSTEM_ADMIN']);
export const MediaType = z.enum(['IMAGE', 'VIDEO_LINK', 'PANORAMA_360', 'DRONE_IMAGE']);
export const SafeUrl = z.string().url().max(2048).refine((value) => {
  const url = new URL(value);
  return url.protocol === 'https:' && !url.username && !url.password;
}, 'Only HTTPS URLs without credentials are allowed');
export const Slug = z.string().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export function normalizeVietnamese(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().trim().replace(/\s+/g, ' ');
}
export function makeSlug(value: string): string {
  return normalizeVietnamese(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 160).replace(/-$/, '');
}
