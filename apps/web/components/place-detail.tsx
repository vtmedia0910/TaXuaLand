import type { PublicPlaceDetailDTO, PublicTrust } from "@land/contracts";
import { z } from "zod";
type Trust = z.infer<typeof PublicTrust>;
const labels = {
  UNKNOWN: "Chưa rõ",
  DECLARED: "Được khai báo",
  VERIFIED: "Đã xác minh",
  EXPIRED: "Hết hạn xác minh",
};
export function TrustSummary({ trust }: { trust: Trust }) {
  return (
    <div className="trust-summary">
      <span className="badge">
        {labels[trust.verificationStatus]} ({trust.verificationStatus})
      </span>
      <p>
        Nguồn: {trust.sourceName} · {trust.sourceAuthority}
      </p>
      <p>
        Độ mới: {trust.freshness}
        {trust.observedAt &&
          ` · Ghi nhận ${new Date(trust.observedAt).toLocaleDateString("vi-VN", { timeZone: "Asia/Bangkok" })}`}
        {trust.verifiedAt &&
          ` · Xác minh ${new Date(trust.verifiedAt).toLocaleDateString("vi-VN", { timeZone: "Asia/Bangkok" })}`}
        {trust.expiresAt &&
          ` · Hết hạn ${new Date(trust.expiresAt).toLocaleDateString("vi-VN", { timeZone: "Asia/Bangkok" })}`}
      </p>
    </div>
  );
}
export function PlaceDetail({ place }: { place: PublicPlaceDetailDTO }) {
  return (
    <article className="place-detail">
      <h2>{place.name}</h2>
      <p>
        {place.categories.map((c) => c.name).join(" · ")}
        {place.areaName && ` / ${place.areaName}`}
      </p>
      <p>{place.shortDescription}</p>
      <p className="preserve-text">{place.description}</p>
      <h3>Nguồn nội dung</h3>
      <TrustSummary trust={place.trust} />
      <h3>Vị trí</h3>
      <p>
        Vĩ độ {place.location.latitude} · Kinh độ {place.location.longitude}
      </p>
      <p>
        Vai trò: {place.location.locationRole} · Độ chính xác ngang:{" "}
        {place.location.horizontalAccuracyMeters === null
          ? "UNKNOWN"
          : `${place.location.horizontalAccuracyMeters} m`}
      </p>
      <TrustSummary trust={place.location.trust} />
      {place.visitContext && (
        <section>
          <h3>Thông tin tham quan</h3>
          <dl>
            {Object.entries({
              "Mùa phù hợp": place.visitContext.bestSeasonText,
              "Thời gian": place.visitContext.recommendedTimeText,
              "Độ khó": place.visitContext.difficulty,
              "Đối tượng": place.visitContext.audienceText,
              "Hướng dẫn viên": place.visitContext.guideRequirement,
            }).map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{value || "Chưa có thông tin (UNKNOWN)"}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      {place.accessContext && (
        <section>
          <h3>Thông tin tiếp cận</h3>
          <p>
            {place.accessContext.accessMethodText ||
              "Chưa có thông tin (UNKNOWN)"}
          </p>
          <p>{place.accessContext.roadConditionText}</p>
          <p>{place.accessContext.routeNote}</p>
          <TrustSummary trust={place.accessContext.trust} />
        </section>
      )}
      {place.safetyNotes.length > 0 && (
        <section>
          <h3>Ghi chú an toàn</h3>
          {place.safetyNotes.map((note, index) => (
            <div key={index}>
              <p>{note.note}</p>
              <TrustSummary trust={note.trust} />
            </div>
          ))}
        </section>
      )}
      {place.media.length > 0 && (
        <section>
          <h3>Hình ảnh và tư liệu</h3>
          {place.media.map((m) => (
            <figure key={m.id}>
              {["IMAGE", "DRONE_IMAGE"].includes(m.mediaType) && (
                // External source URLs are already validated and display-authorized. Avoid server-side proxy fetching.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.sourceUrl}
                  alt={m.altText}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
              )}
              <figcaption>
                <a href={m.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {m.title || m.mediaType}
                </a>
              </figcaption>
            </figure>
          ))}
        </section>
      )}
      {place.externalReferences.length > 0 && (
        <section>
          <h3>Liên kết tham khảo</h3>
          {place.externalReferences.map((e, i) => (
            <p key={i}>
              <a href={e.externalUrl} target="_blank" rel="noopener noreferrer">
                {e.provider}
              </a>
            </p>
          ))}
        </section>
      )}
    </article>
  );
}
