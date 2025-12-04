import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  console.warn(
    "[tRPC] No base url found, EXPO_PUBLIC_RORK_API_BASE_URL not set. Backend features will be disabled."
  );
  return "";
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: async (url, options) => {
        try {
          const baseUrl = getBaseUrl();
          if (!baseUrl) {
            console.warn("[tRPC] Backend not configured, skipping request");
            throw new Error("Backend not configured");
          }
          return await fetch(url, options);
        } catch (error) {
          console.warn("[tRPC] Fetch error:", error);
          throw error;
        }
      },
    }),
  ],
});
