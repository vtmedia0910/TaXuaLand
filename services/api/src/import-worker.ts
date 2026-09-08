import { fork } from "node:child_process";
import { resolve } from "node:path";
import {
  InspectedWorkbook,
  IMPORT_LIMITS,
} from "../../../packages/contracts/src/import";
import { AppError } from "./errors";
let active = 0;
export function landWorkspace() {
  return resolve(
    process.env.LAND_WORKSPACE_ROOT ||
      (process.cwd().endsWith("web") ? "../.." : "."),
  );
}
export async function inspectWorkbookIsolated(
  bytes: Buffer,
): Promise<InspectedWorkbook> {
  if (active >= 2)
    throw new AppError(
      "IMPORT_BUSY",
      429,
      "Đang xử lý workbook khác. Thử lại sau.",
    );
  active++;
  try {
    return await new Promise((resolveResult, reject) => {
      const child = fork(
        resolve(landWorkspace(), "workers/import/src/parse-workbook.ts"),
        [],
        {
          cwd: landWorkspace(),
          execArgv: [
            "--max-old-space-size=192",
            "--permission",
            ...[
              "node_modules",
              "packages/contracts",
              "packages/import",
              "workers/import",
              "package.json",
            ].map(
              (path) => `--allow-fs-read=${resolve(landWorkspace(), path)}`,
            ),
          ],
          env: {
            NODE_ENV: "production",
            ...(process.env.SystemRoot
              ? { SystemRoot: process.env.SystemRoot }
              : {}),
          },
          serialization: "advanced",
          stdio: ["ignore", "ignore", "ignore", "ipc"],
        },
      );
      const timer = setTimeout(() => {
        child.kill();
        reject(
          new AppError(
            "IMPORT_TIMEOUT",
            422,
            "Workbook vượt thời gian xử lý cho phép.",
          ),
        );
      }, IMPORT_LIMITS.timeoutMs);
      const finish = () => clearTimeout(timer);
      child.once("error", () => {
        finish();
        reject(
          new AppError(
            "IMPORT_WORKER_FAILED",
            503,
            "Không khởi động được bộ xử lý workbook.",
          ),
        );
      });
      child.once("exit", () => {
        finish();
        reject(
          new AppError(
            "IMPORT_WORKER_LIMIT",
            422,
            "Workbook bị từ chối hoặc vượt giới hạn tài nguyên.",
          ),
        );
      });
      child.once("message", (message: unknown) => {
        finish();
        child.kill();
        if (
          !message ||
          typeof message !== "object" ||
          !("ok" in message) ||
          !message.ok ||
          !("workbook" in message)
        ) {
          reject(
            new AppError(
              "WORKBOOK_REJECTED",
              422,
              "Workbook hỏng, không hỗ trợ hoặc vượt giới hạn an toàn.",
            ),
          );
          return;
        }
        try {
          resolveResult(InspectedWorkbook.parse(message.workbook));
        } catch {
          reject(
            new AppError(
              "INVALID_WORKBOOK_RESULT",
              422,
              "Không đọc được cấu trúc workbook.",
            ),
          );
        }
      });
      child.send(bytes);
    });
  } finally {
    active--;
  }
}
