import { currentAdmin } from "../../../../../lib/admin-actor";
import { listCategories } from "@land/api/categories";
import { listSources } from "@land/api/registry";
import { publicLayers } from "@land/api/layers";
import { requirePermission } from "@land/api/auth";
import { PlaceEditor } from "../../../../../components/place-editor";
export default async function NewPlacePage() {
  const actor = await currentAdmin();
  requirePermission(actor, "edit");
  const [categories, sources, config] = await Promise.all([
    listCategories(actor),
    listSources(actor),
    publicLayers(),
  ]);
  return (
    <PlaceEditor
      record={null}
      categories={categories}
      sources={sources}
      config={config}
      permissions={[...actor.permissions]}
    />
  );
}
