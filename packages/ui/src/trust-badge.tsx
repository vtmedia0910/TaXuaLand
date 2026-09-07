export function TrustBadge({ value }: { value: string }) {
  const tone =
    value === "VERIFIED" || value === "ALLOWED" || value === "CONFIGURED"
      ? "positive"
      : value === "DENIED" || value === "EXPIRED"
        ? "negative"
        : "neutral";
  return <span className={`badge ${tone}`}>{value}</span>;
}
