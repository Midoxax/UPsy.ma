import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import "@/ops/ops-theme.css";

const Preview = lazy(() => import("@/ops/pages/Preview"));

export const Route = createFileRoute("/ops/preview")({
  head: () => ({
    meta: [
      { title: "UPSY OS — Operational Command Prototype | U.Psy" },
      {
        name: "description",
        content:
          "Cinematic prototype of the UPSY OS command interface: live protocol telemetry, task orchestration and the Director console.",
      },
      { property: "og:title", content: "UPSY OS — Operational Command Prototype" },
      {
        property: "og:description",
        content:
          "Cinematic prototype of the UPSY OS command interface: live protocol telemetry, task orchestration and the Director console.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@200;300;400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400;500&display=swap",
      },
    ],
  }),
  component: () => <Preview />,
});
