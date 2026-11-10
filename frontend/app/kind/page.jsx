"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getTokens } from "@/lib/api";
import Mesh from "@/components/Mesh";
import Logo from "@/components/Logo";

const KINDS = [
  {
    key: "teacher",
    title: "Ustoz",
    text: "Darslar, kitoblar va kurslaringizni bitta sahifada jamlang.",
  },
  {
    key: "student",
    title: "O'quvchi",
    text: "O'qiyotgan kitoblaringiz, natijalar va foydali havolalar. Sahifa standart bo'yicha yopiq.",
  },
  {
    key: "both",
    title: "Ustoz va o'quvchi",
    text: "Dars bering va o'zingiz ham o'qing — ikkala blok ham ko'rinadi.",
  },
];

export default function KindPage() {
  const router = useRouter();
  const [kind, setKind] = useState("teacher");
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getTokens().access) {
      router.replace("/login");
      return;
    }
    api("/profile/me/")
      .then((p) => {
        setProfile(p);
        setKind(p.kind || "teacher");
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  async function onContinue() {
    setSaving(true);
    setError("");
    try {
      const patch = { kind };
      if (kind === "student") {
        patch.is_public = false;
        patch.privacy = { ...(profile?.privacy || {}), indexable: false };
      }
      const updated = await api("/profile/me/", { method: "PATCH", body: patch });
      setProfile(updated);
      router.push("/claim");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="auth-wrap">
      <Mesh />
      <div className="auth-box wide">
        <Logo />
        <p className="step-count">Step 1 of 3</p>
        <h1>What kind of page is this?</h1>
        <p className="muted">You can change this later in settings.</p>

        <div className="kind-grid">
          {KINDS.map((k) => (
            <button
              key={k.key}
              type="button"
              className={`kind-card ${kind === k.key ? "on" : ""}`}
              onClick={() => setKind(k.key)}
            >
              <strong>{k.title}</strong>
              <span>{k.text}</span>
            </button>
          ))}
        </div>

        {error && <p className="error">{error}</p>}
        <button className="btn lg" onClick={onContinue} disabled={saving}>
          {saving ? "Saving…" : "Continue"}
        </button>
      </div>
    </div>
  );
}
