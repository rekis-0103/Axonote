"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { GlassBadge } from "@/components/glass/glass-badge";
import { GlassButton } from "@/components/glass/glass-button";
import { GlassField } from "@/components/glass/glass-field";
import { Segmented } from "@/components/glass/segmented";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

type GoogleCredentialResponse = { credential: string };

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: { theme?: string; size?: string; width?: number | string },
  ) => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
    __axonoteGoogleClientId?: string;
  }
}

type AuthMode = "login" | "register";

type AuthUser = { id: number; name: string; email: string };

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
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const isErrorMessage =
    message.startsWith("Cannot reach") ||
    message.includes("failed") ||
    message.includes("invalid") ||
    message.includes("required");

  useEffect(() => {
    document.body.setAttribute("data-background", "cover");
    return () => {
      document.body.removeAttribute("data-background");
    };
  }, []);

  const handleGoogleCredential = useCallback(async (response: GoogleCredentialResponse) => {
    setIsSubmitting(true);
    setMessage("");
    try {
      const apiResponse = await fetch(`${apiBaseUrl}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await apiResponse.json();
      if (!apiResponse.ok) {
        setMessage(data.detail ?? "Google sign-in failed.");
        return;
      }
      const authData = data as AuthResponse;
      setUser(authData.user);
      window.localStorage.setItem("axonote_token", authData.access_token);
      setMessage("Signed in with Google.");
      window.location.href = "/dashboard";
    } catch {
      setMessage("Cannot reach the API. Make sure the backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;
    const container = googleButtonRef.current;
    let cancelled = false;

    function initGoogle() {
      if (cancelled || !window.google?.accounts?.id) return;
      if (window.__axonoteGoogleClientId !== googleClientId) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredential,
        });
        window.__axonoteGoogleClientId = googleClientId;
      }
      container.replaceChildren();
      window.google.accounts.id.renderButton(container, {
        theme: "outline",
        size: "large",
        width: Math.min(container.offsetWidth || 400, 400),
      });
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existingScript) {
      if (window.google?.accounts?.id) initGoogle();
      else existingScript.addEventListener("load", initGoogle);
      return () => {
        cancelled = true;
        existingScript.removeEventListener("load", initGoogle);
      };
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.body.appendChild(script);
    return () => {
      cancelled = true;
    };
  }, [handleGoogleCredential]);

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
      window.localStorage.setItem("axonote_token", authData.access_token);
      setMessage(mode === "login" ? "Signed in successfully." : "Account created.");
      window.location.href = "/dashboard";
    } catch {
      setMessage("Cannot reach the API. Make sure the backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <main className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-12 sm:px-6">
        <div className="grid w-full items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Cover */}
          <section className="pt-4 lg:pt-8">
            <GlassBadge tone="accent" className="mb-5">
              Study notebook
            </GlassBadge>
            <h1 className="text-display">
              Your notes,
              <br />
              <span className="highlighter">summarized.</span>
            </h1>
            <p className="mt-5 max-w-md text-base font-medium leading-relaxed text-[var(--ink-muted)]">
              Upload materials, get clear summaries, and practice with quiz questions - all in one
              organized notebook.
            </p>
            <ul className="mt-8 space-y-3 text-sm font-medium text-[var(--ink-muted)]">
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[var(--accent-strong)]" />
                Private by default
              </li>
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[var(--accent-strong)]" />
                Smart summaries
              </li>
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[var(--accent-strong)]" />
                Interactive practice
              </li>
            </ul>
          </section>

          {/* Auth card */}
          <section className="lg:pt-4">
            <div className="glass-panel mx-auto w-full max-w-md p-6 sm:p-8">
              <h2 className="handwriting text-3xl font-bold text-[var(--ink)]">
                {mode === "login" ? "Sign in" : "Create account"}
              </h2>
              <p className="mt-1 text-sm font-medium text-[var(--ink-muted)]">
                {mode === "login"
                  ? "Welcome back to your desk."
                  : "Start a new notebook in seconds."}
              </p>

              <Segmented
                className="mt-6"
                options={[
                  { id: "login" as const, label: "Sign in" },
                  { id: "register" as const, label: "Register" },
                ]}
                value={mode}
                onChange={setMode}
              />

              <form className="mt-6 space-y-4" onSubmit={submitAuth}>
                {mode === "register" ? (
                  <GlassField
                    label="Display name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    minLength={2}
                    required
                  />
                ) : null}
                <GlassField
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <GlassField
                  label="Password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
                <GlassButton type="submit" variant="solid" fullWidth disabled={isSubmitting}>
                  {isSubmitting
                    ? "Please wait..."
                    : mode === "login"
                      ? "Continue"
                      : "Create account"}
                </GlassButton>
              </form>

              {googleClientId ? (
                <div className="mt-6">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-dashed border-[var(--glass-border)]" />
                    </div>
                    <p className="relative mx-auto w-fit bg-[var(--paper)] px-3 text-xs font-semibold text-[var(--ink-muted)]">
                      or continue with
                    </p>
                  </div>
                  <div
                    ref={googleButtonRef}
                    className="flex w-full justify-center [&>div]:!w-full [&_iframe]:!w-full"
                  />
                </div>
              ) : null}

              {message ? (
                <p
                  className={`mt-4 px-3 py-2 text-sm font-semibold ${
                    isErrorMessage ? "status-alert status-alert--danger" : "status-alert"
                  }`}
                >
                  {message}
                </p>
              ) : null}

              {user ? (
                <div className="mt-4 rounded-md bg-[var(--success-bg)] p-4 text-sm text-[var(--success-text)]">
                  <p className="font-semibold">{user.name}</p>
                  <p className="mt-0.5 opacity-90">{user.email}</p>
                  <a href="/dashboard" className="mt-3 inline-block text-sm font-semibold underline">
                    Open workspace
                  </a>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
