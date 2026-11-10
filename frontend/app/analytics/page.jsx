"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, apiDownload, getTokens } from "@/lib/api";
import Logo from "@/components/Logo";

function Bars({ daily }) {
  if (!daily || daily.length === 0) {
    return <p className="muted">No traffic recorded in the last 30 days yet.</p>;
  }
  const max = Math.max(1, ...daily.map((d) => (d.views || 0) + (d.clicks || 0)));
  return (
    <div className="chart">
      {daily.map((d) => {
        const total = (d.views || 0) + (d.clicks || 0);
        return (
          <div className="chart-col" key={d.date} title={`${d.date}: ${d.views} views, ${d.clicks} clicks`}>
            <div className="chart-bar" style={{ height: `${Math.max(4, (total / max) * 100)}%` }} />
            <span>{d.date.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}

function Breakdown({ title, rows }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      {(!rows || rows.length === 0) && <p className="muted">No data yet.</p>}
      {(rows || []).map((row) => {
        const label = row.source || row.device || row.city || row.country;
        return (
          <div className="breakdown-row" key={`${label}-${row.count}`}>
            <span>{label}</span>
            <strong>{row.count}</strong>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getTokens().access) {
      router.replace("/login");
      return;
    }
    api("/analytics/overview/").then(setData).catch((err) => setError(err.message));
  }, [router]);

  if (error) return <p className="container error">{error}</p>;
  if (!data) return <p className="container muted">Loading…</p>;

  return (
    <>
      <nav className="site-nav" style={{ margin: "12px auto 0" }}>
        <Logo />
        <div className="row">
          <Link className="btn secondary" href="/dashboard">
            Dashboard
          </Link>
          <button
            className="btn secondary"
            onClick={() => apiDownload("/analytics/export.csv", "ilm-bio-analytics.csv")}
          >
            Download CSV
          </button>
        </div>
      </nav>

      <main className="container" style={{ paddingTop: 24 }}>
        <h1 className="page-title">Analytics</h1>
        <div className="stats-grid">
          <div className="stat">
            <div className="value">{data.profile_views || 0}</div>
            <div className="key">Page views</div>
          </div>
          <div className="stat">
            <div className="value">{data.total_clicks || 0}</div>
            <div className="key">Link clicks</div>
          </div>
          <div className="stat">
            <div className="value">{data.total_links || 0}</div>
            <div className="key">Links</div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h3>Last 30 days</h3>
          <Bars daily={data.daily} />
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h3>Top links</h3>
          {data.top_links.length === 0 && <p className="muted">No links yet.</p>}
          {data.top_links.map((l) => (
            <div className="breakdown-row" key={l.id}>
              <span>{l.title}</span>
              <strong>{l.clicks}</strong>
            </div>
          ))}
        </div>

        <div className="analytics-grid">
          <Breakdown title="Traffic sources" rows={data.sources} />
          <Breakdown title="Devices" rows={data.devices} />
          <Breakdown title="Cities" rows={data.cities} />
        </div>
      </main>
    </>
  );
}
