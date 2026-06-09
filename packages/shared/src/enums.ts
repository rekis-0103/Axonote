export const MaterialStatus = {
  Pending: "pending",
  Processing: "processing",
  Ready: "ready",
  Failed: "failed",
} as const;
export type MaterialStatus = (typeof MaterialStatus)[keyof typeof MaterialStatus];

export const JobStatus = {
  Queued: "queued",
  Running: "running",
  Done: "done",
  Failed: "failed",
} as const;
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export const QuestionType = {
  MCQ: "mcq",
} as const;
export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];

export const UserRole = {
  User: "user",
  Admin: "admin",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ALLOWED_EXTENSIONS = ["pdf", "docx", "pptx"] as const;
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB
