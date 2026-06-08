import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/Dashboard";

export const Route = createFileRoute("/developer")({
  head: () => ({ meta: [{ title: "Dashboard — Way To Dream" }] }),
  component: Dashboard,
});
