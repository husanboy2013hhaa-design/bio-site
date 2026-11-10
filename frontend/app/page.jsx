"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Mesh from "@/components/Mesh";
import Reveal from "@/components/Reveal";
import Counter from "@/components/Counter";

const TILES = [
  {
    icon: "link",
    title: "Unlimited links",
    text: "Add, reorder and toggle links in seconds. Drag them into the perfect order and publish instantly.",
    wide: false,
  },
  {
    icon: "palette",
    title: "Themes that fit your brand",
    text: "Background, text and button colors, three button shapes and four fonts — with a live preview while you edit.",
    wide: false,
  },
  {
    icon: "chart",
    title: "Privacy-first analytics",
    text: "Clicks, profile views, top links and 30-day daily rollups. IPs are salted-hashed — raw IPs are never stored.",
    wide: false,
  },
  {
    icon: "phone",
    title: "Perfect on every screen",
    text: "Your page is mobile-first and loads fast anywhere your audience finds you — Instagram bio, TikTok, email signature.",
    wide: true,
  },
  {
    icon: "zap",
    title: "Developer-ready API",
    text: "Every feature is a documented REST endpoint with JWT auth, throttling and Swagger UI out of the box. Self-host it, extend it, sell it.",
    wide: true,
  },
];

const ICONS = {
  link: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 17H7A5 5 0 0 1 7 7h2" />
      <path d="M15 7h2a5 5 0 0 1 0 10h-2" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  palette: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0 0 20c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.6 1.6-1.6H16a6 6 0 0 0 6-6C22 6.5 17.5 2 12 2z" />
      <circle cx="7.6" cy="10.6" r="1.3" style={{ fill: "currentColor", stroke: "none" }} />
      <circle cx="12" cy="7.2" r="1.3" style={{ fill: "currentColor", stroke: "none" }} />
      <circle cx="16.4" cy="10.6" r="1.3" style={{ fill: "currentColor", stroke: "none" }} />
      <circle cx="7.6" cy="15.2" r="1.3" style={{ fill: "currentColor", stroke: "none" }} />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="M7 16v-5" />
      <path d="M12 16V8" />
      <path d="M17 16v-3" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="2" width="12" height="20" rx="2.5" />
      <line x1="11" y1="18" x2="13" y2="18" />
    </svg>
  ),
  zap: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  ),
};

const STEPS = [
  {
    title: "Claim your handle",
    text: "Pick your unique URL — ilm.bio/yourname. No credit card, no setup call.",
  },
  {
    title: "Add your links",
    text: "Drop in your videos, shops, playlists and socials. Reorder with one click.",
  },
  {
    title: "Share one URL",
    text: "Put it in every bio. Watch clicks and views roll in from your dashboard.",
  },
];

const FAQS = [
  {
    q: "What is ilm.bio?",
    a: "A link-in-bio platform: one public page (yoursite.com/yourname) that collects every link you want people to open — with themes, analytics and a full REST API.",
  },
  {
    q: "Is it free to start?",
    a: "Yes. The whole core — unlimited links, themes, analytics and the API — runs free on your own server. It's open under the MIT license, so you can self-host or rebrand it.",
  },
  {
    q: "Is the analytics GDPR-safe?",
    a: "Yes. Click events store a salted hash of the IP instead of the raw address, and you control what is collected. No third-party tracking cookies are set.",
  },
  {
    q: "Can I use my own domain?",
    a: "The self-hosted version runs on any domain you point at it. Custom per-user domains are on the premium roadmap.",
  },
];

const PLATFORMS = ["Instagram", "YouTube", "TikTok", "Twitch", "Spotify", "GitHub", "X / Twitter", "Shopify"];

function ClaimField({ id }) {
  const [name, setName] = useState("");

  function submit(e) {
    e.preventDefault();
    const clean = name.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
    if (clean) window.location.href = `/register?username=${encodeURIComponent(clean)}`;
  }

  return (
    <form className="claim" onSubmit={submit}>
      <span className="prefix">ilm.bio/</span>
      <input
        id={id}
        aria-label="Choose your username"
        placeholder="yourname"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={30}
      />
      <button className="btn" type="submit">
        Claim your link
      </button>
    </form>
  );
}

function Tile({ icon, title, text, wide, delay }) {
  function track(e) {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  return (
    <Reveal className={`tile ${wide ? "wide" : ""}`} delay={delay} onMouseMove={track}>
      <span className="ico">{ICONS[icon] ?? icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </Reveal>
  );
}

export default function HomePage() {
  return (
    <>
      <Navbar />

      {/* ============================= HERO ============================= */}
      <header className="hero">
        <Mesh />
        <div className="hero-inner">
          <div>
            <span className="eyebrow">
              <span className="badge-dot" />
              Link-in-bio, done right
            </span>
            <h1>
              Everything you are.
              <br />
              <span className="gradient-text">In one simple link.</span>
            </h1>
            <p className="lead">
              ilm.bio gives you a beautiful page for all your links, content and
              products — with themes, privacy-safe analytics and a full API.
              Free to start, live in minutes.
            </p>
            <ClaimField id="hero-claim" />
            <p className="hero-note">
              No credit card · Open source (MIT) · Self-hostable
            </p>
          </div>

          <div style={{ position: "relative" }}>
            <div className="phone">
              <div className="float-chip c1">🖱️ 12,480 clicks today</div>
              <div className="float-chip c2">✅ Link published</div>
              <div className="phone-screen">
                <div className="p-avatar">A</div>
                <div className="p-name">@yourname</div>
                <div className="p-bio">Creator · designer · coffee addict</div>
                <span className="p-link">Latest video</span>
                <span className="p-link alt">My portfolio</span>
                <span className="p-link">Shop the drop</span>
                <span className="p-link alt">Newsletter</span>
                <span className="p-link">Book a call</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ============================= SOCIAL STRIP ============================= */}
      <section className="section" style={{ paddingTop: 30, paddingBottom: 30 }}>
        <Reveal className="section-head" style={{ marginBottom: 26 }}>
          <p className="muted">Drop your ilm.bio into any bio — it fits everywhere</p>
        </Reveal>
        <Reveal className="strip" delay={80}>
          {PLATFORMS.map((p) => (
            <span className="pill" key={p}>
              {p}
            </span>
          ))}
        </Reveal>
      </section>

      {/* ============================= FEATURES (BENTO) ============================= */}
      <section className="section" id="features">
        <Reveal className="section-head">
          <span className="kicker">Features</span>
          <h2>Everything a link page should be</h2>
          <p>
            Built as a proper product: clean API, ownership checks, rate limits
            and a design your audience will actually enjoy tapping.
          </p>
        </Reveal>

        <div className="bento">
          {TILES.map((t, i) => (
            <Tile key={t.title} {...t} delay={i * 70} />
          ))}
        </div>
      </section>

      {/* ============================= STATS ============================= */}
      <section className="section" style={{ paddingTop: 20 }}>
        <Reveal className="stats-band">
          <div className="stat-tile">
            <div className="value">
              <Counter to={3} />
            </div>
            <div className="key">steps to launch</div>
          </div>
          <div className="stat-tile">
            <div className="value">
              <Counter to={5} suffix=" min" />
            </div>
            <div className="key">average setup time</div>
          </div>
          <div className="stat-tile">
            <div className="value">
              <Counter to={100} suffix="+" />
            </div>
            <div className="key">color combinations</div>
          </div>
          <div className="stat-tile">
            <div className="value">
              <Counter to={0} />
            </div>
            <div className="key">tracking cookies</div>
          </div>
        </Reveal>
      </section>

      {/* ============================= HOW IT WORKS ============================= */}
      <section className="section" id="how">
        <Reveal className="section-head">
          <span className="kicker">How it works</span>
          <h2>Live before your coffee cools</h2>
        </Reveal>
        <div className="steps">
          {STEPS.map((s, i) => (
            <Reveal className="step" key={s.title} delay={i * 120}>
              <div className="num">{i + 1}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============================= FAQ ============================= */}
      <section className="section" id="faq">
        <Reveal className="section-head">
          <span className="kicker">FAQ</span>
          <h2>Good questions</h2>
        </Reveal>
        <div className="faq">
          {FAQS.map((f, i) => (
            <Reveal delay={i * 80} key={f.q}>
              <details>
                <summary>
                  <span className="q-text">{f.q}</span>
                  <span className="chev">+</span>
                </summary>
                <div className="answer">{f.a}</div>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============================= FINAL CTA ============================= */}
      <section className="section" style={{ paddingBottom: 70 }}>
        <Reveal className="cta-band">
          <h2>
            Your handle is waiting.{" "}
            <span className="gradient-text">Grab it.</span>
          </h2>
          <p>
            Join the creators who send their audience to one link instead of
            ten.
          </p>
          <ClaimField id="cta-claim" />
        </Reveal>
      </section>

      <Footer />
    </>
  );
}
