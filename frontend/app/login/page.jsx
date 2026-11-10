"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, fieldErrors, saveTokens } from "@/lib/api";
import Mesh from "@/components/Mesh";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api("/auth/login/", { method: "POST", body: form, auth: false });
      saveTokens(data);
      router.push("/dashboard");
    } catch (err) {
      const fields = fieldErrors(err);
      setError(fields.detail || fields.non_field_errors || err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <Mesh />
      <div className="auth-box">
        <Logo />
        <h1>Welcome back</h1>
        <p className="muted">Sign in to manage your links.</p>

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
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="input"
            type="password"
            required
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="btn lg pulse" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="auth-foot">
          No account? <Link href="/register">Create one free</Link>
        </p>
      </div>
    </div>
  );
}
