import { z } from "zod";
import { database, transaction } from "./db";
import { audit, requirePermission, type Actor } from "./auth";
const CategoryInput = z
  .object({
    code: z.string().regex(/^[A-Z][A-Z_0-9]{1,60}$/),
    name: z.string().min(1).max(100),
    color: z.string().regex(/^#[a-fA-F0-9]{6}$/),
  })
  .strict();
export async function listCategories(actor: Actor) {
  requirePermission(actor, "read");
  return (
    await database().query<{
      id: string;
      code: string;
      name: string;
      color: string;
    }>(
      "SELECT id,code,name,color FROM place_categories WHERE archived_at IS NULL ORDER BY name",
    )
  ).rows;
}
export async function saveCategory(
  actor: Actor,
  input: unknown,
  id: string | null = null,
) {
  requirePermission(actor, "edit");
  const data = CategoryInput.parse(input);
  return transaction(async (client) => {
    const result = id
      ? await client.query<{ id: string }>(
          "UPDATE place_categories SET code=$1,name=$2,color=$3 WHERE id=$4 RETURNING id",
          [data.code, data.name, data.color, id],
        )
      : await client.query<{ id: string }>(
          "INSERT INTO place_categories(code,name,color) VALUES($1,$2,$3) RETURNING id",
          [data.code, data.name, data.color],
        );
    await audit(
      client,
      actor,
      "CATEGORY_SAVED",
      "CATEGORY",
      result.rows[0]?.id ?? null,
    );
    return result.rows[0];
  });
}
