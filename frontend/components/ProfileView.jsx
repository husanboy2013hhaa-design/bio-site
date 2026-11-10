"use client";

const FONT_STACKS = {
  Inter: "var(--font-inter), Inter, sans-serif",
  system: "system-ui, -apple-system, sans-serif",
  serif: 'Georgia, "Times New Roman", serif',
  mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const KIND_LABEL = {
  teacher: "Ustoz",
  student: "O'quvchi",
  both: "Ustoz · O'quvchi",
  institution: "Muassasa",
};

const BOOK_GROUPS = [
  ["reading", "Hozir o'qiyapman"],
  ["read", "O'qiganman"],
  ["want", "O'qimoqchiman"],
  ["wishlist", "Wishlist"],
];

function rgba(hex, a) {
  const h = (hex || "").replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (full.length !== 6 || Number.isNaN(n)) return `rgba(128,128,128,${a})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function buttonStyle(style, b, t) {
  switch (style) {
    case "square":
      return { background: b, color: t, borderRadius: 0, border: "1px solid transparent" };
    case "rounded":
      return { background: b, color: t, borderRadius: 14, border: "1px solid transparent" };
    case "pill":
      return {
        background: `linear-gradient(135deg, ${b}, ${b}dd)`,
        color: t,
        borderRadius: 999,
        border: "1px solid transparent",
      };
    case "soft":
      return {
        background: rgba(b, 0.14),
        color: b,
        borderRadius: 16,
        border: `1px solid ${rgba(b, 0.45)}`,
        boxShadow: `0 12px 30px ${rgba(b, 0.22)}`,
      };
    case "outline":
      return {
        background: "transparent",
        color: b,
        borderRadius: 999,
        border: `2px solid ${b}`,
      };
    case "neon":
      return {
        background: rgba(b, 0.08),
        color: b,
        borderRadius: 14,
        border: `1px solid ${b}`,
        boxShadow: `0 0 18px ${rgba(b, 0.45)}, inset 0 0 14px ${rgba(b, 0.12)}`,
      };
    default:
      return { background: b, color: t, borderRadius: 999, border: "1px solid transparent" };
  }
}

function Stars({ value }) {
  if (!value) return null;
  return (
    <span className="pv-stars" aria-label={`${value} out of 5`}>
      {"★".repeat(value)}
      <span className="pv-stars-dim">{"★".repeat(5 - value)}</span>
    </span>
  );
}

function Books({ books }) {
  if (!books || books.length === 0) return null;
  return (
    <div className="pv-books">
      {BOOK_GROUPS.map(([status, label]) => {
        const group = books.filter((b) => b.status === status);
        if (group.length === 0) return null;
        return (
          <div className="pv-book-group" key={status}>
            <div className="pv-book-label">{label}</div>
            <ul>
              {group.map((book) => (
                <li key={book.id}>
                  <span className="pv-book-title">{book.title}</span>
                  {book.author && <span className="pv-book-author"> — {book.author}</span>}
                  <Stars value={book.rating} />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export default function ProfileView({
  profile,
  onLinkClick,
  onReport,
  showBadge = false,
  showCTA = false,
}) {
  const theme = profile.theme || {};
  const links = profile.links || [];
  const books = profile.books || [];
  const blocks = profile.blocks || {};
  const btnColor = theme.button_color || "#22c55e";
  const btnText = theme.button_text_color || "#052e16";
  const textColor = theme.text_color || "#f8fafc";
  const avatar = profile.avatar_url || profile.avatar;
  const initial = (profile.display_name || profile.slug || "?").trim().charAt(0).toUpperCase();
  const showLinks = blocks.links?.visible !== false;
  const showBooks = blocks.books?.visible !== false;
  const showFullName = profile.show_full_name !== false;
  const showCity = profile.show_city !== false && profile.city;
  const tags = profile.specialty_tags || [];
  const languages = profile.languages || [];

  return (
    <div
      className={`pv-card pv-preset-${theme.preset || "none"}`}
      style={{
        "--pv-bg": rgba(theme.background || "#0f172a", 0.82),
        "--pv-text": textColor,
        "--pv-btn": btnColor,
        color: textColor,
        fontFamily: FONT_STACKS[theme.font] || undefined,
      }}
    >
      <div className="pv-avatar-wrap">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt={profile.display_name || profile.slug} />
        ) : (
          <span className="pv-initials">{initial}</span>
        )}
      </div>

      <span className="pv-handle">
        <span className="pv-dot" />
        @{profile.slug}
      </span>

      <h2 className="pv-name">
        {showFullName ? profile.display_name || profile.slug : (profile.display_name || profile.slug).split(" ")[0]}
        {profile.verified_teacher && (
          <span className="pv-verified" title="Verified teacher via ilmlan">
            ✓
          </span>
        )}
      </h2>

      <div className="pv-meta">
        {profile.kind && <span className="pv-kind">{KIND_LABEL[profile.kind] || profile.kind}</span>}
        {profile.verified_teacher && <span className="pv-badge">Verified teacher</span>}
      </div>

      {profile.bio && <p className="pv-bio">{profile.bio}</p>}

      {(showCity || languages.length > 0 || profile.institution_name) && (
        <div className="pv-facts">
          {showCity && <span>📍 {profile.city}</span>}
          {profile.institution_name && <span>🏛 {profile.institution_name}</span>}
          {languages.length > 0 && <span>🗣 {languages.join(", ")}</span>}
        </div>
      )}

      {tags.length > 0 && (
        <div className="pv-tags">
          {tags.map((tag) => (
            <span key={tag} className="pv-tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      {profile.cta_label && profile.cta_url && (
        <a
          className="pv-cta"
          href={profile.cta_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {profile.cta_label} →
        </a>
      )}

      {showLinks && (
        <div className="pv-links">
          {links.length === 0 && (
            <p className="pv-empty">No links yet — check back soon.</p>
          )}
          {links.map((link, i) => (
            <button
              key={link.id}
              className="pv-link"
              style={{
                ...buttonStyle(theme.button_style, btnColor, btnText),
                animationDelay: `${0.2 + i * 0.08}s`,
              }}
              onClick={() =>
                onLinkClick ? onLinkClick(link) : window.open(link.url, "_blank")
              }
            >
              <span className="pv-link-label">{link.title}</span>
              <span className="pv-arrow" aria-hidden="true">
                ↗
              </span>
            </button>
          ))}
        </div>
      )}

      {showBooks && <Books books={books} />}

      {onReport && (
        <button type="button" className="pv-report" onClick={onReport}>
          Report this page
        </button>
      )}

      {showCTA && (
        <a className="pv-cta pv-cta-brand" href="/">
          Create your own ilm.bio page →
        </a>
      )}

      {showBadge && (
        <a className="pv-made" href="/">
          Made with <strong>ilm.bio</strong>
        </a>
      )}
    </div>
  );
}
