"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, clearTokens, fieldErrors } from "@/lib/api";
import ProfileView from "@/components/ProfileView";
import Logo from "@/components/Logo";
import { PRESET_MAP, THEME_PRESETS } from "@/lib/themes";

const EMPTY_LINK = { title: "", url: "", description: "" };
const EMPTY_BOOK = { title: "", author: "", status: "reading", rating: 0, note: "" };

const TEMPLATES = [
  { name: "Telegram", base: "https://t.me/", match: ["t.me", "telegram.me"] },
  { name: "Instagram", base: "https://instagram.com/", match: ["instagram.com", "instagr.am"] },
  { name: "YouTube", base: "https://youtube.com/", match: ["youtube.com", "youtu.be"] },
  { name: "TikTok", base: "https://tiktok.com/", match: ["tiktok.com"] },
  { name: "X (Twitter)", base: "https://x.com/", match: ["x.com/", "twitter.com"] },
  { name: "WhatsApp", base: "https://wa.me/", match: ["wa.me", "whatsapp.com"] },
  { name: "Facebook", base: "https://facebook.com/", match: ["facebook.com", "fb.com"] },
  { name: "LinkedIn", base: "https://linkedin.com/in/", match: ["linkedin.com"] },
  { name: "GitHub", base: "https://github.com/", match: ["github.com"] },
  { name: "Spotify", base: "https://open.spotify.com/", match: ["open.spotify.com"] },
  { name: "Twitch", base: "https://twitch.tv/", match: ["twitch.tv"] },
  { name: "Discord", base: "https://discord.gg/", match: ["discord.gg", "discord.com/invite"] },
  { name: "Patreon", base: "https://patreon.com/", match: ["patreon.com"] },
  { name: "Threads", base: "https://threads.net/@", match: ["threads.net"] },
  { name: "Snapchat", base: "https://snapchat.com/add/", match: ["snapchat.com"] },
  { name: "Medium", base: "https://medium.com/", match: ["medium.com"] },
  { name: "Dribbble", base: "https://dribbble.com/", match: ["dribbble.com"] },
  { name: "Behance", base: "https://behance.net/", match: ["behance.net"] },
];

function detectTemplate(v) {
  const s = (v || "").trim().toLowerCase();
  if (!s) return null;
  return (
    TEMPLATES.find((t) =>
      t.match.some((m) => s.includes(`://${m}`) || s.includes(`://www.${m}`) || s.startsWith(`${m}/`) || s === m)
    ) || null
  );
}

function extractHandle(v) {
  const s = (v || "").trim();
  if (!s) return "";
  let path = s;
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      path = u.pathname + u.search;
    } catch {
      return "";
    }
  } else if ((/^([a-z0-9-]+\.)+[a-z]{2,}/i.test(s))) {
    try {
      const u = new URL(`https://${s}`);
      path = u.pathname + u.search;
    } catch {
      path = s;
    }
  }
  path = path.replace(/^\/+/, "").replace(/^@/, "");
  const t = detectTemplate(s);
  if (t) {
    try {
      const basePath = new URL(t.base).pathname.replace(/^\/+/, "");
      if (basePath && path.toLowerCase().startsWith(basePath.toLowerCase())) {
        path = path.slice(basePath.length);
      }
    } catch {
      /* ignore */
    }
  }
  return path.replace(/^@+/, "");
}

function normalizeUrl(raw, base) {
  let v = (raw || "").trim().replace(/\s+/g, "");
  if (!v) return v;
  if (/^https?:\/\//i.test(v)) return v;
  if ((/^([a-z0-9-]+\.)+[a-z]{2,}([/?#]|$)/i.test(v))) return `https://${v.replace(/^\/+/, "")}`;
  v = v.replace(/^@+/, "");
  if (base) return base + v;
  return v;
}

function splitList(value) {
  return (value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const BLOCK_LABELS = [
  ["links", "Links"],
  ["books", "Books"],
  ["courses", "Courses"],
  ["certificates", "Certificates"],
];

const PRIVACY_LABELS = [
  ["show_full_name", "Show full name"],
  ["show_city", "Show city"],
  ["show_scores", "Show scores / results"],
  ["indexable", "Allow search engines (Google)"],
];

const PRIVACY_DEFAULTS = {
  show_full_name: true,
  show_city: true,
  show_scores: false,
  indexable: true,
};

function privacyOn(profile, key) {
  const value = profile.privacy?.[key];
  return value === undefined ? PRIVACY_DEFAULTS[key] : value;
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [links, setLinks] = useState([]);
  const [books, setBooks] = useState([]);
  const [theme, setTheme] = useState(null);
  const [stats, setStats] = useState(null);
  const [draft, setDraft] = useState(EMPTY_LINK);
  const [bookDraft, setBookDraft] = useState(EMPTY_BOOK);
  const [tplBase, setTplBase] = useState("");
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [savingTheme, setSavingTheme] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadAll = useCallback(async () => {
    const [p, l, b, t, s] = await Promise.all([
      api("/profile/me/"),
      api("/links/"),
      api("/books/"),
      api("/theme/"),
      api("/analytics/overview/"),
    ]);
    setProfile(p);
    setLinks(l);
    setBooks(b);
    setTheme(t);
    setStats(s);
  }, []);

  useEffect(() => {
    loadAll().catch((err) => {
      if (err.status === 401) router.replace("/login");
    });
  }, [loadAll, router]);

  function flash(message) {
    setNotice(message);
    setTimeout(() => setNotice(""), 2200);
  }

  async function logout() {
    const { refresh } = { refresh: localStorage.getItem("refresh") };
    try {
      await api("/auth/logout/", { method: "POST", body: { refresh } });
    } catch {
      /* ignore */
    }
    clearTokens();
    router.replace("/login");
  }

  async function patchProfile(body, message) {
    try {
      const p = await api("/profile/me/", { method: "PATCH", body });
      setProfile(p);
      if (message) flash(message);
      return p;
    } catch (err) {
      alert(fieldErrors(err).slug || err.message);
      throw err;
    }
  }

  async function onAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("avatar", file);
      const data = await api("/profile/me/avatar/", { method: "POST", body: form });
      setProfile((p) => ({ ...p, avatar_url: data.avatar_url }));
      flash("Avatar updated!");
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function pickTemplate(t) {
    const handle = extractHandle(draft.url);
    setTplBase(t.base);
    setDraft((d) => ({
      ...d,
      url: t.base + handle,
      title: d.title.trim() ? d.title : t.name,
    }));
    document.getElementById("link-url")?.focus();
  }

  function onUrlChange(value) {
    setDraft((d) => ({ ...d, url: value }));
    const t = detectTemplate(value);
    if (t) setTplBase(t.base);
    else if (!value.trim()) setTplBase("");
  }

  function onUrlBlur() {
    const norm = normalizeUrl(draft.url, tplBase);
    const t = detectTemplate(norm);
    setDraft((d) => ({
      ...d,
      url: norm,
      title: d.title.trim() ? d.title : t ? t.name : d.title,
    }));
    if (t) setTplBase(t.base);
  }

  async function addLink(e) {
    e.preventDefault();
    setErrors({});
    const body = { ...draft, url: normalizeUrl(draft.url, tplBase) };
    setDraft(body);
    try {
      const created = await api("/links/", { method: "POST", body });
      setLinks((prev) => [...prev, created]);
      setDraft(EMPTY_LINK);
      setTplBase("");
    } catch (err) {
      setErrors(fieldErrors(err));
    }
  }

  async function patchLink(id, body) {
    const updated = await api(`/links/${id}/`, { method: "PATCH", body });
    setLinks((prev) => prev.map((l) => (l.id === id ? updated : l)));
  }

  async function removeLink(id) {
    if (!confirm("Delete this link?")) return;
    await api(`/links/${id}/`, { method: "DELETE" });
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  async function move(index, direction) {
    const next = [...links];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setLinks(next);
    const ordered = await api("/links/reorder/", {
      method: "PATCH",
      body: { ids: next.map((l) => l.id) },
    });
    setLinks(ordered);
  }

  async function saveTheme(patch) {
    setSavingTheme(true);
    const updated = await api("/theme/", { method: "PATCH", body: patch });
    setTheme(updated);
    setSavingTheme(false);
  }

  function applyPreset(key) {
    const preset = PRESET_MAP[key];
    if (!preset) {
      setTheme({ ...theme, preset: "none" });
      saveTheme({ preset: "none" });
      return;
    }
    setTheme({ ...theme, ...preset });
    saveTheme({
      preset: preset.key,
      background: preset.background,
      text_color: preset.text_color,
      button_color: preset.button_color,
      button_text_color: preset.button_text_color,
      button_style: preset.button_style,
      font: preset.font,
    });
  }

  async function addBook(e) {
    e.preventDefault();
    if (!bookDraft.title.trim()) return;
    const created = await api("/books/", {
      method: "POST",
      body: { ...bookDraft, rating: Number(bookDraft.rating) },
    });
    setBooks((prev) => [...prev, created]);
    setBookDraft(EMPTY_BOOK);
  }

  async function patchBook(id, body) {
    const updated = await api(`/books/${id}/`, { method: "PATCH", body });
    setBooks((prev) => prev.map((b) => (b.id === id ? updated : b)));
  }

  async function removeBook(id) {
    if (!confirm("Remove this book?")) return;
    await api(`/books/${id}/`, { method: "DELETE" });
    setBooks((prev) => prev.filter((b) => b.id !== id));
  }

  function toggleBlock(key) {
    const blocks = { ...(profile.blocks || {}) };
    const current = blocks[key] || { visible: true };
    blocks[key] = { ...current, visible: !current.visible };
    setProfile({ ...profile, blocks });
    patchProfile({ blocks });
  }

  function togglePrivacy(key) {
    const privacy = { ...(profile.privacy || {}) };
    privacy[key] = !privacyOn(profile, key);
    setProfile({ ...profile, privacy });
    patchProfile({ privacy });
  }

  async function copyUrl() {
    const url = `${window.location.origin}/${profile.slug}`;
    await navigator.clipboard.writeText(url);
    flash("Profile URL copied!");
  }

  if (!profile || !theme) return <p className="container muted">Loading…</p>;

  const previewProfile = {
    ...profile,
    theme,
    links: links.filter((l) => l.is_active),
    books,
    show_full_name: profile.privacy?.show_full_name !== false,
    show_city: profile.privacy?.show_city !== false,
  };

  return (
    <>
      <nav className="site-nav" style={{ margin: "12px auto 0" }}>
        <Logo />
        <div className="row">
          <Link className="btn secondary" href="/analytics">
            Analytics
          </Link>
          <Link className="btn secondary" href="/settings">
            Settings
          </Link>
          <button className="btn secondary" onClick={copyUrl}>
            Copy link
          </button>
          <button className="btn secondary" onClick={() => window.open(`/${profile.slug}`, "_blank")}>
            Open ↗
          </button>
          <button className="btn danger" onClick={logout}>
            Log out
          </button>
        </div>
      </nav>

      <main className="container dashboard-grid">
        <section>
          {notice && <p className="notice">{notice}</p>}

          {stats && (
            <div className="stats-grid">
              <div className="stat">
                <div className="value">{stats.total_links}</div>
                <div className="key">Links</div>
              </div>
              <div className="stat">
                <div className="value">{stats.total_clicks || 0}</div>
                <div className="key">Total clicks</div>
              </div>
              <div className="stat">
                <div className="value">{stats.profile_views || 0}</div>
                <div className="key">Profile views</div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="section-head">
              <h3>Profile</h3>
              {profile.verified_teacher ? (
                <span className="pv-badge">✓ Verified teacher</span>
              ) : (
                <span className="muted">Teacher badge via ilmlan</span>
              )}
            </div>

            <div className="avatar-row">
              <div className="avatar-preview">
                {profile.avatar_url || profile.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url || profile.avatar} alt="avatar" />
                ) : (
                  <span>{(profile.display_name || profile.slug || "?").charAt(0).toUpperCase()}</span>
                )}
              </div>
              <label className="btn secondary" style={{ cursor: "pointer" }}>
                {uploading ? "Uploading…" : "Upload photo"}
                <input type="file" accept="image/*" hidden onChange={onAvatar} />
              </label>
            </div>

            <label className="label">Page kind</label>
            <select
              className="select"
              value={profile.kind}
              onChange={(e) => patchProfile({ kind: e.target.value })}
            >
              <option value="teacher">Ustoz</option>
              <option value="student">O'quvchi</option>
              <option value="both">Ustoz va o'quvchi</option>
              <option value="institution">Muassasa</option>
            </select>

            <label className="label">Display name</label>
            <input
              className="input"
              defaultValue={profile.display_name}
              onBlur={(e) => patchProfile({ display_name: e.target.value })}
            />

            <label className="label">Bio (max 160)</label>
            <input
              className="input"
              maxLength={160}
              defaultValue={profile.bio}
              onBlur={(e) => patchProfile({ bio: e.target.value })}
            />

            <div className="two-col">
              <div>
                <label className="label">City</label>
                <input
                  className="input"
                  defaultValue={profile.city}
                  placeholder="Toshkent"
                  onBlur={(e) => patchProfile({ city: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Institution</label>
                <input
                  className="input"
                  defaultValue={profile.institution_name}
                  placeholder="School / university"
                  onBlur={(e) => patchProfile({ institution_name: e.target.value })}
                />
              </div>
            </div>

            <label className="label">Languages (comma separated)</label>
            <input
              className="input"
              defaultValue={(profile.languages || []).join(", ")}
              placeholder="Uzbek, English, Russian"
              onBlur={(e) => patchProfile({ languages: splitList(e.target.value) })}
            />

            <label className="label">Specialty tags (max 5, comma separated)</label>
            <input
              className="input"
              defaultValue={(profile.specialty_tags || []).join(", ")}
              placeholder="Matematika, IELTS, Fizika"
              onBlur={(e) => patchProfile({ specialty_tags: splitList(e.target.value) })}
            />

            <div className="two-col">
              <div>
                <label className="label">CTA label</label>
                <input
                  className="input"
                  defaultValue={profile.cta_label}
                  placeholder="Kurslarim"
                  onBlur={(e) => patchProfile({ cta_label: e.target.value })}
                />
              </div>
              <div>
                <label className="label">CTA link</label>
                <input
                  className="input"
                  defaultValue={profile.cta_url}
                  placeholder="https://ilmlan.uz/..."
                  onBlur={(e) => patchProfile({ cta_url: e.target.value })}
                />
              </div>
            </div>

            <label className="label">
              Handle (public URL) · {profile.username_changes_left} change(s) left this 14 days
            </label>
            <input
              className="input"
              defaultValue={profile.slug}
              onBlur={(e) => patchProfile({ slug: e.target.value.toLowerCase() })}
            />
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3>Add link</h3>
            <form onSubmit={addLink} className="stack">
              <div className="tpl-row">
                {TEMPLATES.map((t) => (
                  <button
                    type="button"
                    key={t.name}
                    className={`tpl-chip ${detectTemplate(draft.url)?.name === t.name ? "on" : ""}`}
                    onClick={() => pickTemplate(t)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
              <input
                className="input"
                placeholder="Title (e.g. YouTube)"
                required
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
              {errors.title && <p className="error">{errors.title}</p>}
              <input
                id="link-url"
                className="input"
                placeholder="yourname or instagram.com/yourname — no https:// needed"
                required
                value={draft.url}
                onChange={(e) => onUrlChange(e.target.value)}
                onBlur={onUrlBlur}
              />
              {errors.url && <p className="error">{errors.url}</p>}
              <button className="btn">Add link</button>
            </form>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3>Your links</h3>
            {links.length === 0 && <p className="muted">No links yet — add your first one.</p>}
            {links.map((link, i) => (
              <div className="link-row" key={link.id}>
                <div
                  className={`switch ${link.is_active ? "on" : ""}`}
                  onClick={() => patchLink(link.id, { is_active: !link.is_active })}
                  title={link.is_active ? "Deactivate" : "Activate"}
                />
                <div className="title">
                  <strong>{link.title}</strong>
                  <div className="url">{link.url}</div>
                </div>
                <span className="muted">{link.clicks} clicks</span>
                <button className="btn secondary" onClick={() => move(i, -1)} aria-label="Move up">
                  ↑
                </button>
                <button className="btn secondary" onClick={() => move(i, 1)} aria-label="Move down">
                  ↓
                </button>
                <button className="btn danger" onClick={() => removeLink(link.id)}>
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3>Books</h3>
            <form onSubmit={addBook} className="stack">
              <div className="two-col">
                <input
                  className="input"
                  placeholder="Book title"
                  value={bookDraft.title}
                  onChange={(e) => setBookDraft({ ...bookDraft, title: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Author"
                  value={bookDraft.author}
                  onChange={(e) => setBookDraft({ ...bookDraft, author: e.target.value })}
                />
              </div>
              <div className="two-col">
                <select
                  className="select"
                  value={bookDraft.status}
                  onChange={(e) => setBookDraft({ ...bookDraft, status: e.target.value })}
                >
                  <option value="reading">Reading now</option>
                  <option value="read">Read</option>
                  <option value="want">Want to read</option>
                  <option value="wishlist">Wishlist</option>
                </select>
                <select
                  className="select"
                  value={bookDraft.rating}
                  onChange={(e) => setBookDraft({ ...bookDraft, rating: e.target.value })}
                >
                  <option value={0}>No rating</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {"★".repeat(n)}
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn">Add book</button>
            </form>

            <div className="book-list">
              {books.map((book) => (
                <div className="book-row" key={book.id}>
                  <div className="title">
                    <strong>{book.title}</strong>
                    {book.author && <div className="url">{book.author}</div>}
                  </div>
                  <select
                    className="select slim"
                    value={book.status}
                    onChange={(e) => patchBook(book.id, { status: e.target.value })}
                  >
                    <option value="reading">Reading</option>
                    <option value="read">Read</option>
                    <option value="want">Want</option>
                    <option value="wishlist">Wishlist</option>
                  </select>
                  <button className="btn danger" onClick={() => removeBook(book.id)}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3>Theme {savingTheme && <span className="muted">saving…</span>}</h3>
            <label className="label">Preset</label>
            <select className="select" value={theme.preset} onChange={(e) => applyPreset(e.target.value)}>
              <option value="none">Custom colors</option>
              {THEME_PRESETS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.name} — {p.hint}
                </option>
              ))}
            </select>

            <div className="row" style={{ flexWrap: "wrap", marginTop: 12 }}>
              {[
                ["background", "Background"],
                ["text_color", "Text"],
                ["button_color", "Button"],
                ["button_text_color", "Button text"],
              ].map(([key, label]) => (
                <label key={key} style={{ fontSize: 12, color: "var(--muted)" }}>
                  {label}
                  <input
                    type="color"
                    value={theme[key]}
                    onChange={(e) => {
                      setTheme({ ...theme, [key]: e.target.value });
                      saveTheme({ [key]: e.target.value });
                    }}
                    style={{ display: "block", width: 64, height: 36, marginTop: 4 }}
                  />
                </label>
              ))}
              <label style={{ fontSize: 12, color: "var(--muted)" }}>
                Button shape
                <select
                  className="select"
                  value={theme.button_style}
                  onChange={(e) => {
                    setTheme({ ...theme, button_style: e.target.value });
                    saveTheme({ button_style: e.target.value });
                  }}
                  style={{ marginTop: 4 }}
                >
                  <option value="pill">Pill</option>
                  <option value="rounded">Rounded</option>
                  <option value="square">Square</option>
                  <option value="soft">Soft</option>
                  <option value="outline">Outline</option>
                  <option value="neon">Neon</option>
                </select>
              </label>
              <label style={{ fontSize: 12, color: "var(--muted)" }}>
                Font
                <select
                  className="select"
                  value={theme.font}
                  onChange={(e) => {
                    setTheme({ ...theme, font: e.target.value });
                    saveTheme({ font: e.target.value });
                  }}
                  style={{ marginTop: 4 }}
                >
                  <option value="Inter">Inter</option>
                  <option value="system">System</option>
                  <option value="serif">Serif</option>
                  <option value="mono">Mono</option>
                </select>
              </label>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3>Blocks</h3>
            <div className="toggle-grid">
              {BLOCK_LABELS.map(([key, label]) => (
                <label className="toggle-row" key={key}>
                  <span>{label}</span>
                  <span
                    className={`switch ${profile.blocks?.[key]?.visible !== false ? "on" : ""}`}
                    onClick={() => toggleBlock(key)}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3>Privacy</h3>
            <label className="toggle-row">
              <span>Page is public</span>
              <span
                className={`switch ${profile.is_public ? "on" : ""}`}
                onClick={() => patchProfile({ is_public: !profile.is_public })}
              />
            </label>
            {PRIVACY_LABELS.map(([key, label]) => (
              <label className="toggle-row" key={key}>
                <span>{label}</span>
                <span
                  className={`switch ${privacyOn(profile, key) ? "on" : ""}`}
                  onClick={() => togglePrivacy(key)}
                />
              </label>
            ))}
            {profile.is_minor && (
              <p className="muted" style={{ marginTop: 10 }}>
                Accounts under 18 start private. Ask a parent or guardian before making the page
                public.
              </p>
            )}
          </div>
        </section>

        <aside>
          <p className="muted" style={{ textAlign: "center" }}>
            Live preview — <a href={`/${profile.slug}`}>/{profile.slug}</a>
          </p>
          <div className="preview-phone" style={{ background: theme.background }}>
            <ProfileView profile={previewProfile} />
          </div>
        </aside>
      </main>
    </>
  );
}
