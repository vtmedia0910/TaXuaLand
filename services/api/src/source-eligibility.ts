const available = (source: string, record: string) =>
  `${source}.status='ACTIVE' AND ${source}.archived_at IS NULL AND ${record}.archived_at IS NULL AND (${source}.provider_id IS NULL OR EXISTS(SELECT 1 FROM integration_providers provider WHERE provider.id=${source}.provider_id AND provider.enabled AND NOT provider.kill_switch))`;

export const strictSourceAllowed = (source: string, record: string) =>
  `${available(source, record)} AND ${source}.public_display='ALLOWED'`;

export const geometrySourceAllowed = (source: string, record: string) =>
  `${available(source, record)} AND ${source}.source_acceptance IS DISTINCT FROM 'REJECTED' AND ${source}.provider_rights_status<>'RESTRICTED' AND (${source}.public_display='ALLOWED' OR (${source}.source_acceptance IN ('OWNER_APPROVED','SOURCE_APPROVED') AND ${source}.provider_rights_status IN ('ALLOWED','REVIEW_REQUIRED','UNKNOWN')))`;
