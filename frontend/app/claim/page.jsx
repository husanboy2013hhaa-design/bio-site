"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, fieldErrors, getTokens } from "@/lib/api";
import Mesh from "@/components/Mesh";
import Logo from "@/components/Logo";

export default function ClaimPage() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!getTokens().access) {
      router.replace("/login");
      return;
    }
    api("/profile/me/")
      .then((p) => setSlug(p.slug))
      .catch(() => router.replace("/login"));
  }, [router]);

  async function onContinue(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/profile/me/", { method: "PATCH", body: { slug } });
      router.push("/theme");
    } catch (err) {
      setError(fieldErrors(err).slug || err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="auth-wrap">
      <Mesh />
      <div className="auth-box">
        <Logo />
        <p className="step-count">Step 2 of 3</p>
        <h1>Claim your handle</h1>
        <p className="muted">Your page will live at ilm.bio/your-handle</p>
        <form onSubmit={onContinue}>
          <div className="slug-field">
            <span>ilm.bio/</span>
            <input
              className="input"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              maxLength={40}
              required
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button className="btn lg" disabled={saving}>
            {saving ? "Checking…" : "Continue"}
          </button>
        </form>
        <p className="auth-foot">
          You can change it twice every 14 days.
        </p>
      </div>
    </div>
  );
}
