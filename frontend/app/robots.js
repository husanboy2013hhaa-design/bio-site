const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://website-two-rose.vercel.app";

export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/settings", "/analytics", "/kind", "/claim", "/theme"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
