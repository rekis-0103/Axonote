"use client";

import { FormEvent, useState } from "react";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

type AuthMode = "login" | "register";

type AuthUser = {
  id: number;
  name: string;
  email: string;
};

type AuthResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};

export default function Home() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
    const payload =
      mode === "login" ? { email, password } : { name: name.trim(), email, password };

    try {
      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail ?? "Authentication failed.");
        return;
      }

      const authData = data as AuthResponse;
      setUser(authData.user);
      setToken(authData.access_token);
      window.localStorage.setItem("axonote_token", authData.access_token);
      setMessage(mode === "login" ? "Signed in successfully." : "Account created.");
      window.location.href = "/dashboard";
    } catch {
      setMessage("Cannot reach the API. Make sure the backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function loadProfile() {
    const storedToken = token || window.localStorage.getItem("axonote_token");
    if (!storedToken) {
      setMessage("No active session. Sign in first.");
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail ?? "Session is invalid.");
        return;
      }

      setToken(storedToken);
      setUser(data as AuthUser);
      setMessage("Session verified.");
    } catch {
      setMessage("Cannot reach the API. Make sure the backend is running.");
    }
  }

  function logout() {
    window.localStorage.removeItem("axonote_token");
    setToken("");
    setUser(null);
    setMessage("Signed out.");
  }

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-[#1f241f]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8">
        <header className="flex items-center justify-between border-b border-[#ddd7ca] pb-5">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-[#1f3327] text-sm font-semibold text-white">
              A
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide">Axonote</p>
              <p className="text-xs text-[#777064]">Study notes, summarized.</p>
            </div>
          </div>
          <p className="hidden text-sm text-[#777064] sm:block">Private workspace for your material</p>
        </header>

        <div className="grid flex-1 gap-10 py-10 lg:grid-cols-[1fr_410px] lg:items-center lg:py-14">
          <section className="max-w-2xl">
            <p className="mb-5 inline-flex rounded-full border border-[#d6cebf] bg-white/70 px-3 py-1 text-sm text-[#5b544a]">
              Early access dashboard
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-[#172017] sm:text-5xl">
              Build cleaner study summaries from the material you already have.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#5f5a51]">
              Upload class notes, slides, or reading material, then keep summaries and practice
              questions tied to your account. Authentication is the first working part of the
              Axonote flow.
            </p>

            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
              {[
                ["Account", "Keep each material private."],
                ["Summaries", "Save notes per upload."],
                ["Practice", "Track quiz attempts later."],
              ].map(([title, description]) => (
                <div key={title} className="rounded-lg border border-[#ddd7ca] bg-white/60 p-4">
                  <p className="text-sm font-semibold text-[#1f241f]">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-[#777064]">{description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[#d8d1c2] bg-[#fffdf8] p-5 shadow-[0_18px_50px_rgba(44,39,30,0.12)]">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-[#172017]">
                {mode === "login" ? "Sign in" : "Create account"}
              </h2>
              <p className="mt-1 text-sm text-[#777064]">
                {mode === "login"
                  ? "Continue to your Axonote workspace."
                  : "Start with a personal workspace."}
              </p>
            </div>

            <div className="mb-5 grid grid-cols-2 rounded-md border border-[#ddd7ca] bg-[#f1ede5] p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`rounded px-4 py-2 text-sm font-medium transition ${
                  mode === "login" ? "bg-white text-[#172017] shadow-sm" : "text-[#70685d]"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`rounded px-4 py-2 text-sm font-medium transition ${
                  mode === "register" ? "bg-white text-[#172017] shadow-sm" : "text-[#70685d]"
                }`}
              >
                Register
              </button>
            </div>

            <form className="space-y-4" onSubmit={submitAuth}>
              {mode === "register" ? (
                <label className="block text-sm font-medium text-[#2f342f]">
                  Name
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-2 w-full rounded-md border border-[#cfc7b8] bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-[#aaa39a] focus:border-[#526b55] focus:ring-3 focus:ring-[#526b55]/15"
                    placeholder="Your name"
                    minLength={2}
                    required
                  />
                </label>
              ) : null}

              <label className="block text-sm font-medium text-[#2f342f]">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-md border border-[#cfc7b8] bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-[#aaa39a] focus:border-[#526b55] focus:ring-3 focus:ring-[#526b55]/15"
                  placeholder="you@example.com"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-[#2f342f]">
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-md border border-[#cfc7b8] bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-[#aaa39a] focus:border-[#526b55] focus:ring-3 focus:ring-[#526b55]/15"
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  required
                />
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-[#263e2f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d3024] disabled:cursor-not-allowed disabled:bg-[#a8a397]"
              >
                {isSubmitting ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
              </button>
            </form>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={loadProfile}
                className="rounded-md border border-[#cfc7b8] px-4 py-2.5 text-sm font-medium text-[#3f463f] transition hover:bg-[#f6f1e8]"
              >
                Check session
              </button>
              <button
                type="button"
                onClick={logout}
                className="rounded-md border border-[#cfc7b8] px-4 py-2.5 text-sm font-medium text-[#3f463f] transition hover:bg-[#f6f1e8]"
              >
                Logout
              </button>
            </div>

            {message ? (
              <p className="mt-4 rounded-md border border-[#e2dccf] bg-[#f6f1e8] px-3 py-2 text-sm text-[#5f5a51]">
                {message}
              </p>
            ) : null}

            {user ? (
              <div className="mt-4 rounded-md border border-[#bed2c1] bg-[#eef6ef] p-4 text-sm text-[#223728]">
                <p className="font-semibold">Logged in as {user.name}</p>
                <p className="mt-1 text-[#526b55]">{user.email}</p>
                <a
                  href="/dashboard"
                  className="mt-3 inline-flex text-sm font-semibold text-[#263e2f] underline-offset-4 hover:underline"
                >
                  Open dashboard
                </a>
              </div>
            ) : null}
          </section>
        </div>
      </section>
    </main>
  );
}
