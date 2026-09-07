import type {
  ViewerConfig,
  ViewerPoint,
  ViewerDiagnostics,
} from "../../../../packages/spatial-types/src/viewer";
import type { Wgs84Position } from "../../../../packages/spatial-types/src/index";
export interface SpatialViewerProps {
  config: ViewerConfig;
  points?: ViewerPoint[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onCandidate?: (position: Wgs84Position) => void;
  onDiagnostics?: (value: ViewerDiagnostics) => void;
  picker?: boolean;
  focusRequest?: number;
  forceFallback?: boolean;
}
