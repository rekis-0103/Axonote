"use client";

import { FormEvent, useEffect, useState } from "react";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

type AuthUser = {
  id: number;
  name: string;
  email: string;
};

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

type MaterialListResponse = {
  items: MaterialItem[];
  total: number;
};

const nextSteps = [
  ["Upload material", "Add lecture notes, slides, or reading material."],
  ["Generate summary", "Extract key points and important concepts."],
  ["Create practice", "Build multiple-choice questions from the summary."],
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

    if (!response.ok) {
      throw new Error(data.detail ?? "Unable to load materials.");
    }

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
    setUploadStatus("Uploading material...");

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

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-[#1f241f]">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8">
        <header className="flex flex-col gap-4 border-b border-[#ddd7ca] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-[#1f3327] text-sm font-semibold text-white">
              A
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide">Axonote</p>
              <p className="text-xs text-[#777064]">User dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-[#1f241f]">{user?.name ?? "Loading..."}</p>
              <p className="text-xs text-[#777064]">{user?.email ?? status}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-[#cfc7b8] bg-white/60 px-4 py-2 text-sm font-medium text-[#3f463f] transition hover:bg-white"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 inline-flex rounded-full border border-[#d6cebf] bg-white/70 px-3 py-1 text-sm text-[#5b544a]">
                {status}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-[#172017] sm:text-5xl">
                Welcome back{user ? `, ${user.name}` : ""}.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#5f5a51]">
                Upload study material here. Axonote will keep it in your workspace so the next
                step can generate summaries and practice questions from the file.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Materials", String(materials.length), "Uploaded files"],
              ["Pending", String(materials.filter((item) => item.status === "pending").length), "Awaiting analysis"],
              ["Ready", String(materials.filter((item) => item.status === "ready").length), "Completed materials"],
            ].map(([label, value, caption]) => (
              <section key={label} className="rounded-lg border border-[#ddd7ca] bg-[#fffdf8] p-5">
                <p className="text-sm font-medium text-[#777064]">{label}</p>
                <p className="mt-3 text-3xl font-semibold text-[#172017]">{value}</p>
                <p className="mt-1 text-sm text-[#777064]">{caption}</p>
              </section>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="rounded-lg border border-[#ddd7ca] bg-[#fffdf8] p-5">
              <div className="flex items-center justify-between border-b border-[#eee8dc] pb-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#172017]">Recent material</h2>
                  <p className="mt-1 text-sm text-[#777064]">Files you upload will appear here.</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {materials.length === 0 ? (
                  <div className="rounded-md border border-dashed border-[#d5cdbc] bg-[#fdfaf3] p-6 text-sm text-[#777064]">
                    No material uploaded yet. Use the upload panel to add your first file.
                  </div>
                ) : (
                  materials.map((item) => (
                    <div
                      key={item.id}
                      className="grid gap-3 rounded-md border border-[#eee8dc] bg-[#fdfaf3] p-4 sm:grid-cols-[1fr_auto]"
                    >
                      <div>
                        <p className="font-medium text-[#1f241f]">{item.title}</p>
                        <p className="mt-1 text-sm text-[#777064]">
                          {item.original_name} · {formatBytes(item.size_bytes)}
                        </p>
                        <a
                          href={`/materials/${item.id}`}
                          className="mt-3 inline-flex text-sm font-semibold text-[#263e2f] underline-offset-4 hover:underline"
                        >
                          Open material
                        </a>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-medium capitalize text-[#526b55]">
                          {item.status}
                        </p>
                        <p className="mt-1 text-xs text-[#8a8276]">
                          Uploaded {formatDate(item.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <aside className="space-y-6">
              <section className="rounded-lg border border-[#ddd7ca] bg-[#fffdf8] p-5">
                <h2 className="text-lg font-semibold text-[#172017]">Upload material</h2>
                <p className="mt-1 text-sm leading-6 text-[#777064]">
                  Supported files: PDF, DOCX, and PPTX up to 20 MB.
                </p>

                <form className="mt-5 space-y-4" onSubmit={uploadMaterial}>
                  <label className="block text-sm font-medium text-[#2f342f]">
                    Title
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      className="mt-2 w-full rounded-md border border-[#cfc7b8] bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-[#aaa39a] focus:border-[#526b55] focus:ring-3 focus:ring-[#526b55]/15"
                      placeholder="Optional title"
                    />
                  </label>

                  <label className="block text-sm font-medium text-[#2f342f]">
                    File
                    <input
                      type="file"
                      accept=".pdf,.docx,.pptx"
                      onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                      className="mt-2 w-full rounded-md border border-[#cfc7b8] bg-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-[#e6ecdf] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#263e2f]"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full rounded-md bg-[#263e2f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d3024] disabled:cursor-not-allowed disabled:bg-[#a8a397]"
                  >
                    {isUploading ? "Uploading..." : "Upload material"}
                  </button>
                </form>

                {uploadStatus ? (
                  <p className="mt-4 rounded-md border border-[#e2dccf] bg-[#f6f1e8] px-3 py-2 text-sm text-[#5f5a51]">
                    {uploadStatus}
                  </p>
                ) : null}
              </section>

              <section className="rounded-lg border border-[#ddd7ca] bg-[#fffdf8] p-5">
                <h2 className="text-lg font-semibold text-[#172017]">Next workflow</h2>
                <p className="mt-1 text-sm leading-6 text-[#777064]">
                  The dashboard is prepared around the core Axonote process.
                </p>

                <div className="mt-5 space-y-4">
                  {nextSteps.map(([stepTitle, description], index) => (
                    <div key={stepTitle} className="flex gap-3">
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#e6ecdf] text-xs font-semibold text-[#263e2f]">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1f241f]">{stepTitle}</p>
                        <p className="mt-1 text-sm leading-5 text-[#777064]">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
