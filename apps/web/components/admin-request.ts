export async function adminRequest<T>(
  url: string,
  method: string,
  input?: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: input === undefined ? {} : { "Content-Type": "application/json" },
    ...(input === undefined ? {} : { body: JSON.stringify(input) }),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error?.message ?? "Không hoàn tất được yêu cầu.");
  return data as T;
}
