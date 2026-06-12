"use client";

import { FormEvent, useEffect, useState } from "react";

import { BentoCard } from "@/components/glass/bento-card";
import { GlassBadge } from "@/components/glass/glass-badge";
import { GlassButton } from "@/components/glass/glass-button";
import { GlassField } from "@/components/glass/glass-field";
import { StatTile } from "@/components/glass/stat-tile";
import { AppShell } from "@/components/shell/app-shell";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

type AuthUser = { id: number; name: string; email: string };

type MaterialItem = {
  id: number;
  title: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

type MaterialListResponse = { items: MaterialItem[]; total: number };

const WORKFLOW = [
  { step: "1", title: "Upload", desc: "PDF, DOCX, or PPTX up to 20 MB." },
  { step: "2", title: "Analyze", desc: "Worker extracts and summarizes content." },
  { step: "3", title: "Practice", desc: "Quiz questions from your summaries." },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [status, setStatus] = useState("Checking session...");
  const [uploadStatus, setUploadStatus] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function loadMaterials(token: string) {
    const response = await fetch(`${apiBaseUrl}/materials`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail ?? "Unable to load materials.");
    setMaterials((data as MaterialListResponse).items);
  }

  useEffect(() => {
    const token = window.localStorage.getItem("axonote_token");
    if (!token) {
      window.location.href = "/";
      return;
    }
    const authToken = token;
    async function loadWorkspace() {
      try {
        const response = await fetch(`${apiBaseUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await response.json();
        if (!response.ok) {
          window.localStorage.removeItem("axonote_token");
          window.location.href = "/";
          return;
        }
        setUser(data as AuthUser);
        await loadMaterials(authToken);
        setStatus("Workspace ready");
      } catch {
        setStatus("Cannot reach the API. Make sure the backend is running.");
      }
    }
    loadWorkspace();
  }, []);

  async function uploadMaterial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = window.localStorage.getItem("axonote_token");
    if (!token) {
      window.location.href = "/";
      return;
    }
    if (!file) {
      setUploadStatus("Choose a PDF, DOCX, or PPTX file first.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    if (title.trim()) formData.append("title", title.trim());
    setIsUploading(true);
    setUploadStatus("Uploading...");
    try {
      const response = await fetch(`${apiBaseUrl}/materials`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        setUploadStatus(data.detail ?? "Upload failed.");
        return;
      }
      setTitle("");
      setFile(null);
      setUploadStatus("Material uploaded.");
      await loadMaterials(token);
    } catch {
      setUploadStatus("Cannot reach the API. Make sure the backend is running.");
    } finally {
      setIsUploading(false);
    }
  }

  function logout() {
    window.localStorage.removeItem("axonote_token");
    window.location.href = "/";
  }

  const pending = materials.filter((m) => m.status === "pending").length;
  const ready = materials.filter((m) => m.status === "ready").length;
  const isApiError = status.startsWith("Cannot reach");
  const isUploadError = uploadStatus.includes("failed") || uploadStatus.startsWith("Cannot reach");

  return (
    <AppShell
      title={user ? `Hey, ${user.name.split(" ")[0]}` : "My Desk"}
      subtitle={status}
      trailing={
        <GlassButton variant="ghost" onClick={logout}>
          Sign out
        </GlassButton>
      }
    >
      <div className="space-y-8">
        {isApiError ? (
          <div className="status-alert status-alert--danger px-4 py-3 text-sm font-semibold">
            {status}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-3">
          <StatTile label="Materials" value={String(materials.length)} hint="Total uploads" color="yellow" />
          <StatTile label="Pending" value={String(pending)} hint="Awaiting analysis" color="pink" delay={0.05} />
          <StatTile label="Ready" value={String(ready)} hint="Completed" color="green" delay={0.1} />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <BentoCard span={12} padding="1.5rem" revealDelay={0.05}>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="handwriting text-2xl font-bold">Material library</h2>
                  <p className="text-sm font-medium text-[var(--ink-muted)]">Your uploaded study files</p>
                </div>
                <GlassBadge tone="accent">{materials.length} items</GlassBadge>
              </div>

              {materials.length === 0 ? (
                <div className="glass-surface rounded-md border border-dashed border-[var(--glass-border)] p-10 text-center text-sm text-[var(--ink-muted)]">
                  No materials yet. Upload your first file using the panel on the right.
                </div>
              ) : (
                <div className="space-y-2">
                  {materials.map((item) => (
                    <a
                      key={item.id}
                      href={`/materials/${item.id}`}
                      className="glass-surface flex items-center justify-between gap-4 rounded-md p-4 transition hover:bg-[var(--accent-muted)]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-[var(--ink)]">{item.title}</p>
                        <p className="mt-1 truncate text-sm font-medium text-[var(--ink-muted)]">
                          {item.original_name} · {formatBytes(item.size_bytes)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <GlassBadge tone={item.status === "ready" ? "success" : "default"}>
                          {item.status}
                        </GlassBadge>
                        <p className="mt-1 text-sm font-medium text-[var(--ink-muted)]">
                          {formatDate(item.created_at)}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </BentoCard>
          </div>

          <div>
            <BentoCard span={12} padding="1.5rem" revealDelay={0.1}>
              <h2 className="handwriting text-2xl font-bold">Quick upload</h2>
              <p className="mt-1 text-sm font-medium text-[var(--ink-muted)]">PDF · DOCX · PPTX</p>
              <form className="mt-5 space-y-4" onSubmit={uploadMaterial}>
                <GlassField
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <label className="block space-y-1.5">
                  <span className="block text-sm font-semibold text-[var(--ink)]">File</span>
                  <input
                    type="file"
                    accept=".pdf,.docx,.pptx"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="glass-surface w-full rounded-md px-3 py-2.5 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[var(--accent-muted)] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[var(--ink)]"
                  />
                </label>
                <GlassButton type="submit" variant="solid" fullWidth disabled={isUploading}>
                  {isUploading ? "Uploading..." : "Upload"}
                </GlassButton>
              </form>
              {uploadStatus ? (
                <p
                  className={`mt-4 px-3 py-2 text-sm font-semibold ${
                    isUploadError ? "status-alert status-alert--danger" : "status-alert"
                  }`}
                >
                  {uploadStatus}
                </p>
              ) : null}
            </BentoCard>
          </div>
        </section>

        <section>
          <BentoCard span={12} padding="1.5rem" revealDelay={0.15}>
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
              How it works
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {WORKFLOW.map((w, i) => (
                <div
                  key={w.step}
                  className={`sticky-note sticky-note--flat p-5 ${
                    i === 1 ? "sticky-note--pink" : i === 2 ? "sticky-note--blue" : ""
                  }`}
                >
                  <span className="handwriting text-2xl font-bold text-[var(--ink)]">{w.step}</span>
                  <p className="mt-2 text-base font-semibold text-[var(--ink)]">{w.title}</p>
                  <p className="mt-1 text-sm font-medium text-[var(--ink-muted)]">{w.desc}</p>
                </div>
              ))}
            </div>
          </BentoCard>
        </section>
      </div>
    </AppShell>
  );
}
