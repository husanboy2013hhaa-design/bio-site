import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://website-two-rose.vercel.app";

function apiBase() {
  const raw = process.env.NEXT_PUBLIC_API_URL || "";
  if (/^https?:\/\//.test(raw)) return raw.replace(/\/$/, "");
  return `${SITE_URL}/api/v1`;
}

export default async function Image({ params }) {
  const { username } = await params;
  let profile = { slug: username, display_name: username, bio: "" };
  try {
    const res = await fetch(`${apiBase()}/public/${username}/`, { cache: "no-store" });
    if (res.ok) profile = await res.json();
  } catch {
    /* fall back to defaults */
  }

  const name = profile.display_name || profile.slug;
  const initial = String(name).trim().charAt(0).toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #07070d 0%, #101a2e 55%, #0b2a1c 100%)",
          color: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 34 }}>
          <span style={{ color: "#4ade80", fontWeight: 700 }}>ilm.bio</span>
          <span style={{ color: "#64748b" }}>·</span>
          <span style={{ color: "#94a3b8" }}>@{profile.slug}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <div
            style={{
              width: 150,
              height: 150,
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 72,
              fontWeight: 700,
              background: "rgba(74, 222, 128, 0.14)",
              border: "3px solid rgba(74, 222, 128, 0.55)",
              color: "#4ade80",
            }}
          >
            {initial}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 820 }}>
            <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.05 }}>{name}</div>
            {profile.bio && (
              <div style={{ fontSize: 30, color: "#cbd5e1", lineHeight: 1.35 }}>{profile.bio}</div>
            )}
            <div style={{ display: "flex", gap: 12, fontSize: 24, color: "#94a3b8" }}>
              {profile.kind && <span>{profile.kind}</span>}
              {profile.verified_teacher && <span style={{ color: "#4ade80" }}>✓ verified teacher</span>}
              {profile.city && <span>· {profile.city}</span>}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 26, color: "#64748b" }}>
          Links · Books · Courses — one educational page
        </div>
      </div>
    ),
    size
  );
}
