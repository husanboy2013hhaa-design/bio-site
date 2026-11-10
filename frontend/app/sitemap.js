const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://website-two-rose.vercel.app";

function apiBase() {
  const raw = process.env.NEXT_PUBLIC_API_URL || "";
  if (/^https?:\/\//.test(raw)) return raw.replace(/\/$/, "");
  return `${SITE_URL}/api/v1`;
}

export default async function sitemap() {
  try {
    const res = await fetch(`${apiBase()}/public/sitemap/`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.profiles || []).map((p) => ({
      url: `${SITE_URL}/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {
    return [];
  }
}
