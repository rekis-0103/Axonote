"use client";

import { FormEvent, useEffect, useState } from "react";

import { GlassBadge } from "@/components/glass/glass-badge";
import { GlassButton } from "@/components/glass/glass-button";
import { GlassField } from "@/components/glass/glass-field";
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
      background="desk"
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

        <section className="space-y-6">
          <section className="glass-panel paper-grain overflow-hidden">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="p-6 sm:p-8">
                <GlassBadge tone="accent">Study command center</GlassBadge>
                <h2 className="mt-5 max-w-2xl text-4xl font-black leading-tight text-[var(--ink)] sm:text-5xl">
                  Turn uploaded materials into a ready-to-study desk.
                </h2>
                <p className="mt-4 max-w-xl text-base font-semibold leading-relaxed text-[var(--ink-muted)]">
                  Track every file, monitor analysis progress, and jump back into the next
                  material from one workspace.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-[var(--sticky-yellow)] p-4 text-[var(--ink)] shadow-[var(--glass-shadow)]">
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink-muted)]">
                      Materials
                    </p>
                    <p className="mt-4 text-5xl font-black leading-none">{String(materials.length)}</p>
                    <p className="mt-2 text-sm font-semibold text-[var(--ink-muted)]">Total uploads</p>
                  </div>
                  <div className="rounded-2xl bg-[var(--sticky-pink)] p-4 text-[var(--ink)] shadow-[var(--glass-shadow)]">
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink-muted)]">
                      Pending
                    </p>
                    <p className="mt-4 text-5xl font-black leading-none">{String(pending)}</p>
                    <p className="mt-2 text-sm font-semibold text-[var(--ink-muted)]">Awaiting analysis</p>
                  </div>
                  <div className="rounded-2xl bg-[var(--sticky-green)] p-4 text-[var(--ink)] shadow-[var(--glass-shadow)]">
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink-muted)]">
                      Ready
                    </p>
                    <p className="mt-4 text-5xl font-black leading-none">{String(ready)}</p>
                    <p className="mt-2 text-sm font-semibold text-[var(--ink-muted)]">Completed</p>
                  </div>
                </div>
              </div>

              <aside className="border-t border-[var(--glass-border)] bg-white/70 p-6 lg:border-l lg:border-t-0">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink-muted)]">
                  Account
                </p>
                <p className="mt-2 truncate text-lg font-black text-[var(--ink)]">
                  {user?.name ?? "Loading workspace"}
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-[var(--ink-muted)]">
                  {user?.email ?? "Checking account"}
                </p>

                <div className="mt-6 rounded-2xl border border-[var(--glass-border)] bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink-muted)]">
                    Session
                  </p>
                  <p className="mt-2 text-sm font-black text-[var(--ink)]">{status}</p>
                </div>
              </aside>
            </div>
          </section>

          <section className="glass-panel paper-grain p-6">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <h2 className="text-2xl font-black text-[var(--ink)]">Upload document</h2>
                <p className="mt-1 text-sm font-semibold text-[var(--ink-muted)]">PDF | DOCX | PPTX</p>
              </div>
              <GlassBadge tone="default">20 MB max</GlassBadge>
            </div>

            <form className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_12rem] lg:items-end" onSubmit={uploadMaterial}>
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
          </section>

          <section className="glass-panel paper-grain p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
              <div>
                <h2 className="text-3xl font-black text-[var(--ink)]">Material workspace</h2>
                <p className="mt-1 text-sm font-semibold text-[var(--ink-muted)]">
                  Open a file to review generated summaries and practice questions.
                </p>
              </div>
              <label className="block w-full max-w-xs space-y-1.5">
                <span className="block text-xs font-bold uppercase tracking-wide text-[var(--ink-muted)]">
                  Library filters
                </span>
                <select
                  aria-label="Library filters"
                  defaultValue="all"
                  className="glass-surface w-full rounded-md px-3 py-2.5 text-sm font-semibold text-[var(--ink)]"
                >
                  <option value="all">All files ({materials.length})</option>
                  <option value="waiting">Waiting ({pending})</option>
                  <option value="ready">Study-ready ({ready})</option>
                </select>
              </label>
            </div>

            {materials.length === 0 ? (
              <div className="grid min-h-72 place-items-center rounded-3xl border border-dashed border-[var(--glass-border)] bg-white/70 p-8 text-center">
                <div>
                  <p className="text-xl font-black text-[var(--ink)]">No materials on the desk yet.</p>
                  <p className="mt-2 max-w-md text-sm font-semibold text-[var(--ink-muted)]">
                    Use the upload document card to add your first PDF, DOCX, or PPTX file.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-3">
                {materials.map((item) => (
                  <a
                    key={item.id}
                    href={`/materials/${item.id}`}
                    className="group grid gap-4 rounded-2xl border border-[var(--glass-border)] bg-white/80 p-4 text-[var(--ink)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-muted)] hover:shadow-[var(--glass-shadow)] sm:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-lg font-black">{item.title}</p>
                      <p className="mt-1 truncate text-sm font-semibold text-[var(--ink-muted)]">
                        {item.original_name} | {formatBytes(item.size_bytes)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:justify-end sm:text-right">
                      <div>
                        <GlassBadge tone={item.status === "ready" ? "success" : "default"}>
                          {item.status}
                        </GlassBadge>
                        <p className="mt-1 text-xs font-semibold text-[var(--ink-muted)]">
                          {formatDate(item.created_at)}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-[var(--accent-strong)] transition group-hover:bg-[var(--accent)] group-hover:text-[var(--accent-ink)]">
                        Open
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </section>
        </section>
      </div>
    </AppShell>
  );
}
