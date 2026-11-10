"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, fieldErrors, saveTokens } from "@/lib/api";
import Mesh from "@/components/Mesh";
import Logo from "@/components/Logo";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const preset = new URLSearchParams(window.location.search).get("username");
    if (preset) {
      setForm((f) => ({ ...f, username: preset.slice(0, 30) }));
    }
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const data = await api("/auth/register/", { method: "POST", body: form, auth: false });
      saveTokens(data);
      router.push("/kind");
    } catch (err) {
      setErrors({ ...fieldErrors(err), detail: err.message });
    } finally {
      setLoading(false);
    }
  }

  const username = form.username.trim();

  return (
    <div className="auth-wrap">
      <Mesh />
      <div className="auth-box">
        <Logo />
        <h1>Create your ilm.bio</h1>
        <p className="muted">
          Your page goes live at{" "}
          <strong style={{ color: "var(--accent)" }}>
            /{username || "yourname"}
          </strong>
        </p>

        <form onSubmit={onSubmit}>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="input"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          {errors.email && (
            <p className="error" role="alert">
              {errors.email}
            </p>
          )}

          <label className="label" htmlFor="username">
            Username (public handle)
          </label>
          <input
            id="username"
            className="input"
            required
            maxLength={30}
            autoComplete="username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          {errors.username && (
            <p className="error" role="alert">
              {errors.username}
            </p>
          )}

          <label className="label" htmlFor="new-password">
            Password
          </label>
          <input
            id="new-password"
            className="input"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {errors.password && (
            <p className="error" role="alert">
              {errors.password}
            </p>
          )}

          <button className="btn lg pulse" disabled={loading}>
            {loading ? "Creating…" : "Claim my page"}
          </button>
        </form>

        <p className="auth-foot">
          Already registered? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
