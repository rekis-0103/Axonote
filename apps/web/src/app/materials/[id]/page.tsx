"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { BentoCard } from "@/components/glass/bento-card";
import { GlassBadge } from "@/components/glass/glass-badge";
import { GlassButton } from "@/components/glass/glass-button";
import { AppShell } from "@/components/shell/app-shell";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

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

type JobItem = {
  id: number;
  material_id: number;
  type: string;
  status: string;
  error_message: string | null;
  created_at: string;
  finished_at: string | null;
};

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
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function MaterialDetailPage() {
  const params = useParams<{ id: string }>();
  const [material, setMaterial] = useState<MaterialItem | null>(null);
  const [job, setJob] = useState<JobItem | null>(null);
  const [message, setMessage] = useState("Loading material...");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  async function requestWithAuth(path: string, init: RequestInit = {}) {
    const token = window.localStorage.getItem("axonote_token");
    if (!token) {
      window.location.href = "/";
      throw new Error("Missing session.");
    }
    return fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
    });
  }

  async function loadMaterial() {
    try {
      const response = await requestWithAuth(`/materials/${params.id}`);
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.detail ?? "Material not found.");
        return;
      }
      setMaterial(data as MaterialItem);
      setMessage("Material ready for analysis.");
    } catch {
      setMessage("Cannot reach the API. Make sure the backend is running.");
    }
  }

  useEffect(() => {
    async function loadInitialMaterial() {
      await loadMaterial();
    }
    void loadInitialMaterial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function analyzeMaterial() {
    setIsAnalyzing(true);
    setMessage("Creating analysis job...");
    try {
      const response = await requestWithAuth(`/materials/${params.id}/analyze`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.detail ?? "Unable to start analysis.");
        return;
      }
      setJob(data as JobItem);
      setMessage("Analysis job queued.");
      await loadMaterial();
    } catch {
      setMessage("Cannot reach the API. Make sure the backend is running.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function refreshJob() {
    if (!job) return;
    try {
      const response = await requestWithAuth(`/jobs/${job.id}`);
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.detail ?? "Unable to refresh job.");
        return;
      }
      setJob(data as JobItem);
      setMessage("Job status refreshed.");
    } catch {
      setMessage("Cannot reach the API. Make sure the backend is running.");
    }
  }

  return (
    <AppShell
      title={material?.title ?? "Material"}
      subtitle={message}
      trailing={
        <GlassButton variant="glass" onClick={() => { window.location.href = "/dashboard"; }}>
          Back to library
        </GlassButton>
      }
    >
      <div className="space-y-6">
        <BentoCard span={12} padding="1.75rem" revealDelay={0}>
          <GlassBadge tone="accent" className="mb-3">
            {material?.status ?? "loading"}
          </GlassBadge>
          <p className="text-sm font-medium text-[var(--ink-muted)]">
            {material?.original_name} · {material ? formatBytes(material.size_bytes) : "—"}
          </p>
          {material?.error_message ? (
            <p className="mt-4 rounded-md bg-[var(--danger-bg)] px-4 py-2 text-sm text-[var(--danger-text)]">
              {material.error_message}
            </p>
          ) : null}
        </BentoCard>

        {material ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Original file", material.original_name],
              ["MIME type", material.mime_type],
              ["Size", formatBytes(material.size_bytes)],
              ["Uploaded", formatDate(material.created_at)],
            ].map(([label, value], i) => (
              <BentoCard key={label} span={12} padding="1rem" revealDelay={0.04 + i * 0.03}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                  {label}
                </p>
                <p className="mt-1.5 text-sm font-semibold break-all text-[var(--ink)]">{value}</p>
              </BentoCard>
            ))}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <BentoCard span={12} padding="1.5rem" revealDelay={0.12}>
            <h3 className="handwriting text-2xl font-bold">Run analysis</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
              Queue a background job to extract content, generate summaries, and prepare quiz
              questions.
            </p>
            <div className="mt-6">
              <GlassButton
                variant="solid"
                fullWidth
                disabled={!material || isAnalyzing}
                onClick={analyzeMaterial}
              >
                {isAnalyzing ? "Queuing..." : "Start analysis"}
              </GlassButton>
            </div>
          </BentoCard>

          <BentoCard span={12} padding="1.5rem" revealDelay={0.15}>
            <h3 className="handwriting text-2xl font-bold">Job status</h3>
            {job ? (
              <div className="mt-4 space-y-4">
                <div className="sticky-note sticky-note--pink sticky-note--flat rounded-md p-4">
                  <p className="text-xs font-semibold text-[var(--ink-muted)]">Job #{job.id}</p>
                  <GlassBadge tone="success" className="mt-2">
                    {job.status}
                  </GlassBadge>
                  <p className="mt-2 text-xs text-[var(--ink-muted)]">
                    Created {formatDate(job.created_at)}
                  </p>
                </div>
                <GlassButton variant="glass" fullWidth onClick={refreshJob}>
                  Refresh status
                </GlassButton>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--ink-muted)]">
                No job queued yet. Start analysis to create one.
              </p>
            )}
          </BentoCard>
        </div>
      </div>
    </AppShell>
  );
}
