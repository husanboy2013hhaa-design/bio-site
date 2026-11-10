"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getTokens } from "@/lib/api";
import { THEME_PRESETS } from "@/lib/themes";
import Mesh from "@/components/Mesh";
import Logo from "@/components/Logo";

export default function ThemePickPage() {
  const router = useRouter();
  const [selected, setSelected] = useState("doska");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getTokens().access) router.replace("/login");
  }, [router]);

  async function onContinue() {
    setSaving(true);
    setError("");
    const preset = THEME_PRESETS.find((p) => p.key === selected) || THEME_PRESETS[0];
    try {
      await api("/theme/", {
        method: "PATCH",
        body: {
          preset: preset.key,
          background: preset.background,
          text_color: preset.text_color,
          button_color: preset.button_color,
          button_text_color: preset.button_text_color,
          button_style: preset.button_style,
          font: preset.font,
        },
      });
      router.push("/dashboard");
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
        <p className="step-count">Step 3 of 3</p>
        <h1>Pick a theme</h1>
        <p className="muted">10 themes inspired by classrooms, libraries and labs.</p>

        <div className="preset-grid">
          {THEME_PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`preset-card ${selected === p.key ? "on" : ""}`}
              style={{ background: p.background, color: p.text_color }}
              onClick={() => setSelected(p.key)}
            >
              <span className="preset-dot" style={{ background: p.button_color }} />
              <strong>{p.name}</strong>
              <small>{p.hint}</small>
            </button>
          ))}
        </div>

        {error && <p className="error">{error}</p>}
        <button className="btn lg" onClick={onContinue} disabled={saving}>
          {saving ? "Saving…" : "Go to my dashboard"}
        </button>
      </div>
    </div>
  );
}
