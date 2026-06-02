import { createFileRoute, redirect } from "@tanstack/react-router";

// Login-first: send everyone through /auth. If a session exists, the auth page
// will detect it and forward to the right dashboard.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/auth" });
  },
});
