import Link from "next/link";
import Logo from "@/components/Logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how" },
      { label: "FAQ", href: "#faq" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "API docs (Swagger)", href: "http://localhost:8000/api/docs/" },
      { label: "Database schema", href: "https://github.com/" },
      { label: "Self-hosting", href: "https://github.com/" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Create account", href: "/register" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <Logo />
          <p className="muted" style={{ marginTop: 14, maxWidth: 280, lineHeight: 1.6 }}>
            One link for everything you are. Beautiful link-in-bio pages with
            themes, analytics and an open API.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4>{col.title}</h4>
            <ul>
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} ilm.bio — MIT licensed.</span>
        <span>Built with Django + Next.js.</span>
      </div>
    </footer>
  );
}
