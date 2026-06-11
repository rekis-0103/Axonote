"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.headers ?? {}),
      },
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
    <main className="min-h-screen bg-[#f6f4ef] text-[#1f241f]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8">
        <header className="flex flex-col gap-4 border-b border-[#ddd7ca] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-[#1f3327] text-sm font-semibold text-white">
              A
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide">Axonote</p>
              <p className="text-xs text-[#777064]">Material detail</p>
            </div>
          </div>
          <a
            href="/dashboard"
            className="rounded-md border border-[#cfc7b8] bg-white/60 px-4 py-2 text-sm font-medium text-[#3f463f] transition hover:bg-white"
          >
            Back to dashboard
          </a>
        </header>

        <div className="grid flex-1 gap-6 py-8 lg:grid-cols-[1fr_360px]">
          <section className="rounded-lg border border-[#ddd7ca] bg-[#fffdf8] p-6">
            <p className="mb-3 inline-flex rounded-full border border-[#d6cebf] bg-white/70 px-3 py-1 text-sm text-[#5b544a]">
              {message}
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-[#172017] sm:text-5xl">
              {material?.title ?? "Material"}
            </h1>

            {material ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  ["Original file", material.original_name],
                  ["Size", formatBytes(material.size_bytes)],
                  ["Status", material.status],
                  ["Uploaded", formatDate(material.created_at)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border border-[#eee8dc] bg-[#fdfaf3] p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#777064]">
                      {label}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#1f241f]">{value}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {material?.error_message ? (
              <p className="mt-5 rounded-md border border-[#e5c7bd] bg-[#fff4ef] px-3 py-2 text-sm text-[#7b3527]">
                {material.error_message}
              </p>
            ) : null}
          </section>

          <aside className="space-y-6">
            <section className="rounded-lg border border-[#ddd7ca] bg-[#fffdf8] p-5">
              <h2 className="text-lg font-semibold text-[#172017]">Analyze material</h2>
              <p className="mt-1 text-sm leading-6 text-[#777064]">
                This creates an analysis job for the worker. The next step will process the file
                into summaries and questions.
              </p>

              <button
                type="button"
                onClick={analyzeMaterial}
                disabled={!material || isAnalyzing}
                className="mt-5 w-full rounded-md bg-[#263e2f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d3024] disabled:cursor-not-allowed disabled:bg-[#a8a397]"
              >
                {isAnalyzing ? "Creating job..." : "Analyze material"}
              </button>
            </section>

            <section className="rounded-lg border border-[#ddd7ca] bg-[#fffdf8] p-5">
              <h2 className="text-lg font-semibold text-[#172017]">Analysis job</h2>

              {job ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-md border border-[#eee8dc] bg-[#fdfaf3] p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#777064]">
                      Job #{job.id}
                    </p>
                    <p className="mt-2 text-sm font-semibold capitalize text-[#526b55]">
                      {job.status}
                    </p>
                    <p className="mt-1 text-xs text-[#8a8276]">
                      Created {formatDate(job.created_at)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={refreshJob}
                    className="w-full rounded-md border border-[#cfc7b8] px-4 py-2.5 text-sm font-medium text-[#3f463f] transition hover:bg-[#f6f1e8]"
                  >
                    Refresh status
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-[#777064]">
                  No analysis job has been created from this page yet.
                </p>
              )}
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
