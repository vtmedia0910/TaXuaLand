import Link from "next/link";
import { notFound } from "next/navigation";
import { publicPlace } from "@land/api/public-places";
import { AppError } from "@land/api/errors";
import { PlaceDetail } from "../../../components/place-detail";
export const dynamic = "force-dynamic";
export default async function PlacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const place = await publicPlace(slug).catch((error) => {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  });
  return (
    <main className="public-place-page">
      <Link href="/map">TÀ XÙA LAND · Bản đồ</Link>
      <PlaceDetail place={place} />
      <Link href={`/map?place=${place.slug}`}>Xem vị trí trên bản đồ 3D</Link>
    </main>
  );
}
