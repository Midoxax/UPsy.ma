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
  }),
  component: () => <Preview />,
});
