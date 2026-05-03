import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

type FeedbackParams = {
  flash?: string;
  error?: string;
  extras?: Record<string, string | undefined>;
};

function normalizeTarget(target: unknown) {
  if (Array.isArray(target)) {
    return target.join(", ");
  }

  return typeof target === "string" ? target : "";
}

// Keep action failures user-readable so admin mutations redirect back into the
// workspace instead of dropping the operator into a generic server error page.
export function getActionErrorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? fallback;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002": {
        const target = normalizeTarget(error.meta?.target);

        if (target.includes("slug")) {
          return "This slug is already in use. Choose a different URL slug.";
        }

        if (target.includes("email")) {
          return "This email address is already in use.";
        }

        return "A record with the same unique value already exists.";
      }
      case "P2003":
        return "This item references a related record that does not exist anymore.";
      case "P2025":
        return "The requested record could not be found.";
      default:
        return fallback;
    }
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

export function buildFeedbackPath(pathname: string, params: FeedbackParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.flash) {
    searchParams.set("flash", params.flash);
  }

  if (params.error) {
    searchParams.set("error", params.error);
  }

  if (params.extras) {
    for (const [key, value] of Object.entries(params.extras)) {
      if (value) {
        searchParams.set(key, value);
      }
    }
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}
