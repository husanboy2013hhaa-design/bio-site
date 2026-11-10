"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, clearTokens, fieldErrors, getTokens } from "@/lib/api";
import Logo from "@/components/Logo";

const PRIVACY_LABELS = [
  ["show_full_name", "Show my full name on the page"],
  ["show_city", "Show my city"],
  ["show_scores", "Show scores / results"],
  ["indexable", "Allow search engines to index my page"],
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

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [slug, setSlug] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getTokens().access) {
      router.replace("/login");
      return;
    }
    api("/profile/me/")
      .then((p) => {
        setProfile(p);
        setSlug(p.slug);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  async function patch(body, message) {
    setError("");
    try {
      const p = await api("/profile/me/", { method: "PATCH", body });
      setProfile(p);
      setSlug(p.slug);
      if (message) {
        setNotice(message);
        setTimeout(() => setNotice(""), 2200);
      }
    } catch (err) {
      setError(fieldErrors(err).slug || err.message);
    }
  }

  async function logout() {
    try {
      await api("/auth/logout/", {
        method: "POST",
        body: { refresh: localStorage.getItem("refresh") },
      });
    } catch {
      /* ignore */
    }
    clearTokens();
    router.replace("/login");
  }

  if (!profile) return <p className="container muted">Loading…</p>;

  return (
    <>
      <nav className="site-nav" style={{ margin: "12px auto 0" }}>
        <Logo />
        <div className="row">
          <Link className="btn secondary" href="/dashboard">
            Dashboard
          </Link>
          <button className="btn danger" onClick={logout}>
            Log out
          </button>
        </div>
      </nav>

      <main className="container narrow" style={{ paddingTop: 24 }}>
        <h1 className="page-title">Settings</h1>
        {notice && <p className="notice">{notice}</p>}
        {error && <p className="error">{error}</p>}

        <div className="card">
          <h3>Account type</h3>
          <select
            className="select"
            value={profile.kind}
            onChange={(e) => patch({ kind: e.target.value }, "Account type updated.")}
          >
            <option value="teacher">Ustoz</option>
            <option value="student">O'quvchi</option>
            <option value="both">Ustoz va o'quvchi</option>
            <option value="institution">Muassasa</option>
          </select>
          <label className="label">Birth year (optional)</label>
          <input
            className="input"
            type="number"
            min={1900}
            max={new Date().getFullYear()}
            defaultValue={profile.birth_year || ""}
            onBlur={(e) => patch({ birth_year: e.target.value ? Number(e.target.value) : null })}
          />
          {profile.is_minor && (
            <label className="toggle-row" style={{ marginTop: 12 }}>
              <span>Parent / guardian consent to publish</span>
              <span
                className={`switch ${profile.parent_consent ? "on" : ""}`}
                onClick={() =>
                  patch(
                    {
                      parent_consent: !profile.parent_consent,
                      is_public: !profile.parent_consent ? true : false,
                    },
                    "Consent updated."
                  )
                }
              />
            </label>
          )}
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h3>Handle</h3>
          <div className="slug-field">
            <span>ilm.bio/</span>
            <input
              className="input"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            />
          </div>
          <p className="muted">
            {profile.username_changes_left} change(s) left in the last 14 days.
          </p>
          <button
            className="btn"
            disabled={slug === profile.slug || profile.username_changes_left === 0}
            onClick={() => patch({ slug }, "Handle updated.")}
          >
            Save handle
          </button>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h3>Privacy</h3>
          <label className="toggle-row">
            <span>Page is public</span>
            <span
              className={`switch ${profile.is_public ? "on" : ""}`}
              onClick={() => patch({ is_public: !profile.is_public }, "Visibility updated.")}
            />
          </label>
          {PRIVACY_LABELS.map(([key, label]) => (
            <label className="toggle-row" key={key}>
              <span>{label}</span>
              <span
                className={`switch ${privacyOn(profile, key) ? "on" : ""}`}
                onClick={() =>
                  patch(
                    { privacy: { ...profile.privacy, [key]: !privacyOn(profile, key) } },
                    "Privacy updated."
                  )
                }
              />
            </label>
          ))}
        </div>
      </main>
    </>
  );
}
