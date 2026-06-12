import type { Metadata } from "next";

import { AuroraBackground } from "@/components/aurora-background";
import { ScrollProgress } from "@/components/motion/scroll-progress";
import { PageTransition } from "@/components/motion/page-transition";
import { ThemeProvider } from "@/components/theme/theme-provider";

import "./globals.css";

const themeNoFlashScript = `
(function () {
  try {
    var mode = localStorage.getItem("axonote-theme-mode") || "system";
    var glass = localStorage.getItem("axonote-glass-style") || "tinted";
    var resolved = mode;
    if (mode === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.setAttribute("data-theme", resolved);
    document.documentElement.setAttribute("data-glass", glass === "clear" ? "clear" : "tinted");
  } catch (e) {}
})();
`;

export const metadata: Metadata = {
  title: "Axonote",
  description: "Material summarization and quiz practice platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeNoFlashScript }} />
      </head>
      <body className="relative min-h-full">
        <ThemeProvider>
          <AuroraBackground />
          <ScrollProgress />
          <div className="relative z-0 flex min-h-full flex-col">
            <PageTransition>{children}</PageTransition>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
