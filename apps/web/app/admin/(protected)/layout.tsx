import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { randomUUID } from "node:crypto";
import {
  SESSION_COOKIE,
  sessionActor,
  requirePermission,
} from "@land/api/auth";
import { AppError } from "@land/api/errors";
import { LogoutButton } from "../../../components/logout-button";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let actor;
  try {
    actor = await sessionActor(
      (await cookies()).get(SESSION_COOKIE)?.value,
      randomUUID(),
    );
    requirePermission(actor, "read");
  } catch (error) {
    if (error instanceof AppError && error.status === 401)
      redirect("/admin/login");
    throw error;
  }
  return (
    <div className="admin-shell">
      <aside>
        <Link href="/">TÀ XÙA LAND</Link>
        <p>Không gian quản trị</p>
        <nav>
          <Link href="/admin">Tổng quan</Link>
          <Link href="/admin/sources">Nguồn dữ liệu</Link>
          <Link href="/admin/datasets">Dataset &amp; release</Link>
          <Link href="/admin/diagnostics">Chẩn đoán</Link>
        </nav>
        <p>{actor.email}</p>
        <LogoutButton />
      </aside>
      <main>{children}</main>
    </div>
  );
}
