import Link from "next/link";
import { currentAdmin } from "../../../../../lib/admin-actor";
import { importReview } from "@land/api/import-review";
import { publicLayers } from "@land/api/layers";
import { listCategories } from "@land/api/categories";
import { ImportMapping } from "../../../../../components/import-mapping";
import { ImportReview } from "../../../../../components/import-review";
export default async function ImportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await currentAdmin(),
    [review, config, categories] = await Promise.all([
      importReview(actor, (await params).id),
      publicLayers(),
      listCategories(actor),
    ]);
  return (
    <>
      <Link href="/admin/imports">← Các lô import</Link>
      <h1>{review.batch.file_name}</h1>
      <p>
        {review.batch.status} · Phiên bản {review.batch.version} · Hết hạn{" "}
        {new Date(review.batch.expires_at).toLocaleString("vi-VN", {
          timeZone: "Asia/Bangkok",
        })}
      </p>
      {review.batch.status === "UPLOADED" ? (
        <ImportMapping
          inspection={review}
          canImport={actor.permissions.has("import")}
        />
      ) : (
        <ImportReview
          review={review}
          config={config}
          categories={categories}
          canImport={actor.permissions.has("import")}
        />
      )}
    </>
  );
}
