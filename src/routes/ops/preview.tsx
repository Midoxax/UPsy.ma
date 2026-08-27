import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import "@/ops/ops-theme.css";

const Preview = lazy(() => import("@/ops/pages/Preview"));

export const Route = createFileRoute("/ops/preview")({
  component: () => <Preview />,
});
