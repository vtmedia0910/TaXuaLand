import { z } from 'zod';
import { PermissionStatus, SafeUrl, SourceAuthority } from '../../domain/src/index';
export const SourceSchema = z.object({
  id: z.uuid(), name: z.string().min(1).max(200), providerId: z.string().max(100).nullable(),
  category: z.enum(['PLACES', 'TERRAIN', 'IMAGERY', 'ROADS', 'OTHER']), authorityLevel: SourceAuthority,
  licenseName: z.string().max(200).nullable(), licenseReference: SafeUrl.nullable(),
  commercialUse: PermissionStatus, publicDisplay: PermissionStatus, caching: PermissionStatus,
  derivatives: PermissionStatus, redistribution: PermissionStatus, legalReviewedAt: z.iso.datetime().nullable(),
  sourceCrs: z.string().min(1), freshnessClass: z.enum(['STATIC', 'ANNUAL', 'SEASONAL', 'VOLATILE', 'UNKNOWN']),
  status: z.enum(['ACTIVE', 'DISABLED', 'REVIEW_REQUIRED']), lastCheckedAt: z.iso.datetime().nullable(),
}).strict();
export type Source = z.infer<typeof SourceSchema>;
export const SourceRecordSchema = z.object({
  id: z.uuid(), sourceId: z.uuid(), externalRecordId: z.string().nullable(), importBatchId: z.uuid().nullable(),
  collectedAt: z.iso.datetime().nullable(), importedAt: z.iso.datetime(), rawPayloadHash: z.string().regex(/^[a-f0-9]{64}$/),
}).strict();
