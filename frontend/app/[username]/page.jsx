"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import ProfileView from "@/components/ProfileView";
import Mesh from "@/components/Mesh";

const REPORT_REASONS = [
  ["spam", "Spam or scam"],
  ["inappropriate", "Inappropriate content"],
  ["impersonation", "Impersonation"],
  ["copyright", "Copyright issue"],
  ["other", "Something else"],
];

function withUtm(raw, slug, linkId) {
  try {
    const url = new URL(raw);
    const incoming = new URLSearchParams(window.location.search);
    const source = incoming.get("utm_source") || incoming.get("ref") || "ilm.bio";
    if (!url.searchParams.has("utm_source")) url.searchParams.set("utm_source", source);
    if (!url.searchParams.has("utm_medium")) url.searchParams.set("utm_medium", "link_in_bio");
    if (!url.searchParams.has("utm_campaign")) url.searchParams.set("utm_campaign", slug);
    if (!url.searchParams.has("utm_content")) url.searchParams.set("utm_content", String(linkId));
    return url.toString();
  } catch {
    return raw;
  }
}

export default function PublicProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportForm, setReportForm] = useState({ reason: "spam", message: "" });
  const [reportNote, setReportNote] = useState("");

  useEffect(() => {
    api(`/public/${username}/`, { auth: false })
      .then(setProfile)
      .catch((err) => setError(err.status === 404 ? "This page does not exist." : err.message));
  }, [username]);

  async function onLinkClick(link) {
    try {
      await api(`/links/${link.id}/click/`, {
        method: "POST",
        auth: false,
        body: { source: "public_page", slot: link.icon || "links" },
      });
    } catch {
      /* tracking must never block navigation */
    }
    window.open(withUtm(link.url, username, link.id), "_blank", "noopener,noreferrer");
  }

  async function submitReport(e) {
    e.preventDefault();
    try {
      await api(`/public/${username}/report/`, {
        method: "POST",
        auth: false,
        body: reportForm,
      });
      setReportNote("Thanks — we will review this page.");
      setReporting(false);
    } catch (err) {
      setReportNote(err.message);
    }
  }

  if (error) {
    return (
      <div className="public-page" style={{ "--pb": "var(--bg)" }}>
        <Mesh />
        <div className="pv-card">
          <h2 className="pv-name">404</h2>
          <p className="pv-bio">{error}</p>
          <div className="pv-links">
            <Link href="/" className="btn lg" style={{ animation: "rise .5s var(--ease-out) both" }}>
              Go home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="public-page" style={{ "--pb": "var(--bg)" }}>
        <Mesh />
        <div className="pv-card">
          <div
            className="pv-avatar-wrap"
            style={{ opacity: 0.6, animation: "floaty 2s ease-in-out infinite" }}
          />
          <p className="pv-bio">Loading…</p>
        </div>
      </div>
    );
  }

  const preset = profile.theme?.preset || "none";

  return (
    <div
      className={`public-page pv-page-${preset}`}
      style={{ "--pb": profile.theme?.background || "var(--bg)" }}
    >
      <Mesh />
      <ProfileView
        profile={profile}
        onLinkClick={onLinkClick}
        onReport={() => setReporting(true)}
        showBadge
        showCTA
      />

      {reporting && (
        <form className="report-box" onSubmit={submitReport}>
          <h3>Report this page</h3>
          <select
            className="select"
            value={reportForm.reason}
            onChange={(e) => setReportForm({ ...reportForm, reason: e.target.value })}
          >
            {REPORT_REASONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <textarea
            className="input"
            rows={3}
            placeholder="Anything else we should know? (optional)"
            value={reportForm.message}
            onChange={(e) => setReportForm({ ...reportForm, message: e.target.value })}
          />
          <div className="row">
            <button className="btn">Send report</button>
            <button type="button" className="btn secondary" onClick={() => setReporting(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
      {reportNote && <p className="notice report-note">{reportNote}</p>}
    </div>
  );
}
