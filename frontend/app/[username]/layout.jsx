const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://website-two-rose.vercel.app";

function apiBase() {
  const raw = process.env.NEXT_PUBLIC_API_URL || "";
  if (/^https?:\/\//.test(raw)) return raw.replace(/\/$/, "");
  return `${SITE_URL}/api/v1`;
}

export async function generateMetadata({ params }) {
  const { username } = await params;
  const fallback = {
    title: `@${username} · ilm.bio`,
    description: "An educational link-in-bio page on ilm.bio.",
  };
  try {
    const res = await fetch(`${apiBase()}/public/${username}/`, { cache: "no-store" });
    if (!res.ok) {
      return { ...fallback, robots: { index: false, follow: false } };
    }
    const profile = await res.json();
    const name = profile.display_name || profile.slug;
    const description =
      profile.bio || `${name}'s links, books and courses on ilm.bio.`;
    return {
      title: `${name} (@${profile.slug}) · ilm.bio`,
      description,
      alternates: { canonical: `${SITE_URL}/${profile.slug}` },
      robots: profile.indexable
        ? { index: true, follow: true }
        : { index: false, follow: false },
      openGraph: {
        title: `${name} · ilm.bio`,
        description,
        url: `${SITE_URL}/${profile.slug}`,
        siteName: "ilm.bio",
        type: "profile",
      },
      twitter: {
        card: "summary_large_image",
        title: `${name} · ilm.bio`,
        description,
      },
    };
  } catch {
    return fallback;
  }
}

export default function ProfileLayout({ children }) {
  return children;
}
