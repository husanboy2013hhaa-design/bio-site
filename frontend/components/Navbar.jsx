"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTokens } from "@/lib/api";
import Logo from "@/components/Logo";

const SECTIONS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(Boolean(getTokens().access));
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`site-nav ${scrolled ? "scrolled" : ""}`}>
      <Logo />

      <div className="links">
        {SECTIONS.map((s) => (
          <a key={s.href} href={s.href}>
            {s.label}
          </a>
        ))}
      </div>

      <div className="row" style={{ gap: 8 }}>
        {authed ? (
          <Link href="/dashboard" className="btn">
            Dashboard
          </Link>
        ) : (
          <>
            <Link href="/login" className="btn ghost">
              Log in
            </Link>
            <Link href="/register" className="btn">
              Get started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
