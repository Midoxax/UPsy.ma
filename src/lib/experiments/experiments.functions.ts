import { createServerFn } from "@tanstack/react-start";

import {
  EXPERIMENT_COOKIE_MAX_AGE,
  EXPERIMENT_COOKIE_PREFIX,
  EXPERIMENTS,
  isValidVariant,
  pickVariant,
  type ExperimentAssignments,
} from "./config";

/**
 * Resolve this visitor's variant for every registered experiment.
 *
 * Called from the root route loader, so during SSR it runs in-process (no extra
 * round trip) and its result is serialised into the hydration payload. The
 * client therefore renders the identical variant it was served, with no flash
 * and no hydration mismatch.
 *
 * Assignment is written back as a first-party cookie so the visitor stays in
 * the same bucket across sessions — otherwise a returning visitor could be
 * counted in two arms and the conversion numbers would be meaningless.
 */
export const resolveExperiments = createServerFn({ method: "GET" }).handler(
  async (): Promise<ExperimentAssignments> => {
    const { getCookie, setCookie } = await import("@tanstack/react-start/server");

    const assignments: ExperimentAssignments = {};

    for (const experiment of EXPERIMENTS) {
      const cookieName = `${EXPERIMENT_COOKIE_PREFIX}${experiment.id}`;
      const existing = getCookie(cookieName);

      if (isValidVariant(experiment, existing)) {
        // Already bucketed. Don't re-set the cookie: refreshing max-age on every
        // request would keep a visitor alive in the test indefinitely.
        assignments[experiment.id] = existing!;
        continue;
      }

      const variant = pickVariant(experiment);
      assignments[experiment.id] = variant;

      setCookie(cookieName, variant, {
        maxAge: EXPERIMENT_COOKIE_MAX_AGE,
        path: "/",
        sameSite: "lax",
        // Readable by client analytics; carries no personal data, just a bucket.
        httpOnly: false,
        secure: process.env["NODE_ENV"] === "production",
      });
    }

    return assignments;
  },
);
