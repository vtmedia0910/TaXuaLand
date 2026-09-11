"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminRequest } from "./admin-request";

export function ReleasePublishButton({
  releaseId,
  version,
}: {
  releaseId: string;
  version: string;
}) {
  const [busy, setBusy] = useState(false),
    [result, setResult] = useState<{ error: boolean; message: string } | null>(
      null,
    );
  const router = useRouter();
  return (
    <>
      <button
        type="button"
        disabled={busy}
        aria-label={`Xuất bản release ${version}`}
        onClick={async () => {
          if (
            !window.confirm(
              `Xuất bản release ${version}? APPROVED sẽ chuyển thành PUBLISHED.`,
            )
          )
            return;
          setBusy(true);
          setResult(null);
          try {
            await adminRequest(
              `/api/admin/datasets/${releaseId}/publish`,
              "POST",
            );
            setResult({ error: false, message: `Đã xuất bản ${version}.` });
            router.refresh();
          } catch (error) {
            setResult({
              error: true,
              message:
                error instanceof Error
                  ? error.message
                  : `Không xuất bản được ${version}.`,
            });
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Đang xuất bản…" : "Xuất bản release"}
      </button>
      {result && (
        <p role={result.error ? "alert" : "status"}>{result.message}</p>
      )}
    </>
  );
}
