import { currentAdmin } from "../../../../../lib/admin-actor";
import { listCategories } from "@land/api/categories";
import { listSources } from "@land/api/registry";
import { publicLayers } from "@land/api/layers";
import { getPlace } from "@land/api/places";
import { PlaceEditor } from "../../../../../components/place-editor";
export default async function EditPlacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await currentAdmin();
  const [record, categories, sources, config] = await Promise.all([
    getPlace(actor, (await params).id),
    listCategories(actor),
    listSources(actor),
    publicLayers(),
  ]);
  return (
    <PlaceEditor
      key={`${record.place.id}:${record.place.version}`}
      record={record}
      categories={categories}
      sources={sources}
      config={config}
      permissions={[...actor.permissions]}
    />
  );
}
