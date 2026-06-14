"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { BentoCard } from "@/components/glass/bento-card";
import { GlassBadge } from "@/components/glass/glass-badge";
import { GlassButton } from "@/components/glass/glass-button";
import { AppShell } from "@/components/shell/app-shell";
import { apiFetch } from "@/lib/api-client";

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

type SummaryItem = {
  material_id: number;
  content: string;
  keywords: string[];
  created_at: string;
};

type QuestionItem = {
  id: number;
  type: string;
  stem: string;
  options: string[];
};

type QuestionSetItem = {
  question_set_id: number;
  questions: QuestionItem[];
};

type AttemptResult = {
  question_id: number;
  chosen_index: number;
  correct_index: number;
  is_correct: boolean;
  explanation: string | null;
};

type AttemptSubmitResponse = {
  attempt_id: number;
  score: number;
  total: number;
  results: AttemptResult[];
};

type AttemptHistoryItem = {
  attempt_id: number;
  score: number;
  total: number;
  started_at: string;
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
  const [summary, setSummary] = useState<SummaryItem | null>(null);
  const [questionSet, setQuestionSet] = useState<QuestionSetItem | null>(null);
  const [attemptHistory, setAttemptHistory] = useState<AttemptHistoryItem[]>([]);
  const [choices, setChoices] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<AttemptSubmitResponse | null>(null);
  const [message, setMessage] = useState("Loading material...");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRefreshingJob, setIsRefreshingJob] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  const isErrorMessage =
    message.startsWith("Cannot reach") ||
    message.includes("not found") ||
    message.startsWith("Unable");

  const loadLatestJob = useCallback(async () => {
    const response = await apiFetch(`/materials/${params.id}/jobs/latest`);
    if (response.ok) {
      setJob((await response.json()) as JobItem);
    } else {
      setJob(null);
    }
  }, [params.id]);

  const loadSummaryAndQuiz = useCallback(async () => {
    const summaryResponse = await apiFetch(`/materials/${params.id}/summary`);
    if (summaryResponse.ok) {
      setSummary((await summaryResponse.json()) as SummaryItem);
    } else {
      setSummary(null);
    }

    const questionSetResponse = await apiFetch(`/materials/${params.id}/question-set`);
    if (questionSetResponse.ok) {
      const data = (await questionSetResponse.json()) as QuestionSetItem;
      setQuestionSet(data);
      const historyResponse = await apiFetch(`/question-sets/${data.question_set_id}/attempts`);
      if (historyResponse.ok) {
        const history = (await historyResponse.json()) as { items: AttemptHistoryItem[] };
        setAttemptHistory(history.items);
      }
    } else {
      setQuestionSet(null);
      setAttemptHistory([]);
    }
  }, [params.id]);

  const loadMaterial = useCallback(async () => {
    const response = await apiFetch(`/materials/${params.id}`);
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.detail ?? "Material not found.");
      return null;
    }
    const nextMaterial = data as MaterialItem;
    setMaterial(nextMaterial);
    await loadLatestJob();
    if (nextMaterial.status === "ready") {
      await loadSummaryAndQuiz();
      setMessage("Material analysis complete.");
    } else if (nextMaterial.status === "processing") {
      setMessage("Analysis in progress...");
    } else {
      setMessage("Material ready for analysis.");
    }
    return nextMaterial;
  }, [params.id, loadLatestJob, loadSummaryAndQuiz]);

  useEffect(() => {
    async function loadInitialMaterial() {
      await loadMaterial();
    }
    void loadInitialMaterial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    if (!job || job.status === "done" || job.status === "failed") return;

    const interval = window.setInterval(async () => {
      const response = await apiFetch(`/jobs/${job.id}`);
      if (!response.ok) return;
      const nextJob = (await response.json()) as JobItem;
      setJob(nextJob);
      if (nextJob.status === "done" || nextJob.status === "failed") {
        await loadMaterial();
      }
    }, 3000);

    return () => window.clearInterval(interval);
  }, [job, loadMaterial]);

  async function analyzeMaterial() {
    setIsAnalyzing(true);
    setMessage("Creating analysis job...");
    setQuizResult(null);
    try {
      const response = await apiFetch(`/materials/${params.id}/analyze`, { method: "POST" });
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
    setIsRefreshingJob(true);
    setMessage("Refreshing job status...");
    try {
      const response = await apiFetch(`/materials/${params.id}/jobs/latest`);
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.detail ?? "Unable to refresh job.");
        return;
      }
      const nextJob = data as JobItem;
      setJob(nextJob);
      await loadMaterial();
      if (nextJob.status === "done") {
        setMessage("Analysis complete.");
      } else if (nextJob.status === "failed") {
        setMessage(nextJob.error_message ?? "Analysis failed.");
      } else if (nextJob.status === "running") {
        setMessage("Analysis in progress...");
      } else {
        setMessage(`Job status: ${nextJob.status}. Waiting for worker...`);
      }
    } catch {
      setMessage("Cannot reach the API. Make sure the backend is running.");
    } finally {
      setIsRefreshingJob(false);
    }
  }

  async function submitQuiz() {
    if (!questionSet) return;
    setIsSubmittingQuiz(true);
    setMessage("Submitting quiz...");
    try {
      const answers = questionSet.questions.map((question) => ({
        question_id: question.id,
        chosen_index: choices[question.id] ?? 0,
      }));
      const response = await apiFetch(`/question-sets/${questionSet.question_set_id}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.detail ?? "Unable to submit quiz.");
        return;
      }
      setQuizResult(data as AttemptSubmitResponse);
      setMessage(`Quiz submitted: ${data.score}/${data.total} correct.`);
      const historyResponse = await apiFetch(
        `/question-sets/${questionSet.question_set_id}/attempts`,
      );
      if (historyResponse.ok) {
        const history = (await historyResponse.json()) as { items: AttemptHistoryItem[] };
        setAttemptHistory(history.items);
      }
    } catch {
      setMessage("Cannot reach the API. Make sure the backend is running.");
    } finally {
      setIsSubmittingQuiz(false);
    }
  }

  return (
    <AppShell
      background="folder"
      title={material?.title ?? "Material"}
      subtitle={message}
      trailing={
        <GlassButton variant="glass" onClick={() => { window.location.href = "/dashboard"; }}>
          Back to library
        </GlassButton>
      }
    >
      <div className="space-y-6">
        {isErrorMessage ? (
          <div className="status-alert status-alert--danger px-4 py-3 text-sm font-semibold">
            {message}
          </div>
        ) : null}

        <BentoCard span={12} padding="1.75rem" revealDelay={0}>
          <GlassBadge tone="accent" className="mb-3">
            {material?.status ?? "loading"}
          </GlassBadge>
          <p className="text-base font-semibold text-[var(--ink-muted)]">
            {material?.original_name} · {material ? formatBytes(material.size_bytes) : "—"}
          </p>
          {material?.error_message ? (
            <p className="status-alert status-alert--danger mt-4 px-4 py-2 text-sm font-semibold">
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
                <p className="text-sm font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
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
                  <p className="text-sm font-semibold text-[var(--ink-muted)]">Job #{job.id}</p>
                  <GlassBadge tone="success" className="mt-2">
                    {job.status}
                  </GlassBadge>
                  <p className="mt-2 text-sm font-medium text-[var(--ink-muted)]">
                    Created {formatDate(job.created_at)}
                  </p>
                  {job.error_message ? (
                    <p className="status-alert status-alert--danger mt-2 px-3 py-2 text-xs font-semibold">
                      {job.error_message}
                    </p>
                  ) : null}
                </div>
                <GlassButton
                  variant="glass"
                  fullWidth
                  disabled={isRefreshingJob}
                  onClick={refreshJob}
                >
                  {isRefreshingJob ? "Refreshing..." : "Refresh status"}
                </GlassButton>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-[var(--ink-muted)]">
                  No job shown yet. Start analysis or refresh to load the latest job from the
                  server.
                </p>
                <GlassButton
                  variant="glass"
                  fullWidth
                  disabled={isRefreshingJob}
                  onClick={refreshJob}
                >
                  {isRefreshingJob ? "Refreshing..." : "Refresh status"}
                </GlassButton>
              </div>
            )}
          </BentoCard>
        </div>

        {summary ? (
          <BentoCard span={12} padding="1.5rem" revealDelay={0.18}>
            <h3 className="handwriting text-2xl font-bold">Summary</h3>
            <p className="mt-4 text-sm leading-relaxed text-[var(--ink)]">{summary.content}</p>
            {summary.keywords.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {summary.keywords.map((keyword) => (
                  <GlassBadge key={keyword} tone="accent">{keyword}</GlassBadge>
                ))}
              </div>
            ) : null}
          </BentoCard>
        ) : null}

        {questionSet && questionSet.questions.length > 0 ? (
          <BentoCard span={12} padding="1.5rem" revealDelay={0.22}>
            <h3 className="handwriting text-2xl font-bold">Practice quiz</h3>
            <div className="mt-4 space-y-6">
              {questionSet.questions.map((question, index) => (
                <div key={question.id} className="rounded-md border border-[var(--line)] p-4">
                  <p className="text-sm font-semibold text-[var(--ink-muted)]">
                    Question {index + 1}
                  </p>
                  <p className="mt-2 text-sm font-medium text-[var(--ink)]">{question.stem}</p>
                  <div className="mt-3 space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <label
                        key={`${question.id}-${optionIndex}`}
                        className="flex items-center gap-2 text-sm text-[var(--ink)]"
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          checked={choices[question.id] === optionIndex}
                          onChange={() =>
                            setChoices((prev) => ({ ...prev, [question.id]: optionIndex }))
                          }
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <GlassButton
                variant="solid"
                fullWidth
                disabled={isSubmittingQuiz}
                onClick={submitQuiz}
              >
                {isSubmittingQuiz ? "Submitting..." : "Submit quiz"}
              </GlassButton>
            </div>
          </BentoCard>
        ) : null}

        {quizResult ? (
          <BentoCard span={12} padding="1.5rem" revealDelay={0.24}>
            <h3 className="handwriting text-2xl font-bold">Quiz results</h3>
            <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
              Score: {quizResult.score}/{quizResult.total}
            </p>
            <div className="mt-4 space-y-3">
              {quizResult.results.map((result) => (
                <div
                  key={result.question_id}
                  className="rounded-md border border-[var(--line)] p-3 text-sm text-[var(--ink)]"
                >
                  <p className="font-semibold">
                    {result.is_correct ? "Correct" : "Incorrect"} — chosen {result.chosen_index},
                    answer {result.correct_index}
                  </p>
                  {result.explanation ? (
                    <p className="mt-1 text-[var(--ink-muted)]">{result.explanation}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </BentoCard>
        ) : null}

        {attemptHistory.length > 0 ? (
          <BentoCard span={12} padding="1.5rem" revealDelay={0.26}>
            <h3 className="handwriting text-2xl font-bold">Attempt history</h3>
            <ul className="mt-4 space-y-2">
              {attemptHistory.map((attempt) => (
                <li
                  key={attempt.attempt_id}
                  className="flex items-center justify-between rounded-md border border-[var(--line)] px-4 py-3 text-sm"
                >
                  <span className="font-semibold text-[var(--ink)]">
                    {attempt.score}/{attempt.total}
                  </span>
                  <span className="text-[var(--ink-muted)]">{formatDate(attempt.started_at)}</span>
                </li>
              ))}
            </ul>
          </BentoCard>
        ) : null}
      </div>
    </AppShell>
  );
}
