"use client";

import { useEffect, useState } from "react";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

type AuthUser = {
  id: number;
  name: string;
  email: string;
};

type MaterialItem = {
  title: string;
  type: string;
  status: string;
  updatedAt: string;
};

const recentMaterials: MaterialItem[] = [
  {
    title: "No material uploaded yet",
    type: "PDF, DOCX, PPTX",
    status: "Waiting for upload",
    updatedAt: "Start from the upload area",
  },
];

const nextSteps = [
  ["Upload material", "Add lecture notes, slides, or reading material."],
  ["Generate summary", "Extract key points and important concepts."],
  ["Create practice", "Build multiple-choice questions from the summary."],
];

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState("Checking session...");

  useEffect(() => {
    const token = window.localStorage.getItem("axonote_token");
    if (!token) {
      window.location.href = "/";
      return;
    }

    async function loadUser() {
      try {
        const response = await fetch(`${apiBaseUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (!response.ok) {
          window.localStorage.removeItem("axonote_token");
          window.location.href = "/";
          return;
        }

        setUser(data as AuthUser);
        setStatus("Workspace ready");
      } catch {
        setStatus("Cannot reach the API. Make sure the backend is running.");
      }
    }

    loadUser();
  }, []);

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
                This workspace will hold uploaded material, generated summaries, and practice
                results. The layout is ready for the upload and analysis flow.
              </p>
            </div>

            <button
              type="button"
              className="w-full rounded-md bg-[#263e2f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d3024] sm:w-auto"
            >
              Upload material
            </button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Materials", "0", "Uploaded files"],
              ["Summaries", "0", "Generated notes"],
              ["Quiz attempts", "0", "Practice history"],
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
                {recentMaterials.map((item) => (
                  <div
                    key={item.title}
                    className="grid gap-3 rounded-md border border-[#eee8dc] bg-[#fdfaf3] p-4 sm:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <p className="font-medium text-[#1f241f]">{item.title}</p>
                      <p className="mt-1 text-sm text-[#777064]">{item.type}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-medium text-[#526b55]">{item.status}</p>
                      <p className="mt-1 text-xs text-[#8a8276]">{item.updatedAt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="rounded-lg border border-[#ddd7ca] bg-[#fffdf8] p-5">
              <h2 className="text-lg font-semibold text-[#172017]">Next workflow</h2>
              <p className="mt-1 text-sm leading-6 text-[#777064]">
                The dashboard is prepared around the core Axonote process.
              </p>

              <div className="mt-5 space-y-4">
                {nextSteps.map(([title, description], index) => (
                  <div key={title} className="flex gap-3">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#e6ecdf] text-xs font-semibold text-[#263e2f]">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1f241f]">{title}</p>
                      <p className="mt-1 text-sm leading-5 text-[#777064]">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
