import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/")({
  component: App,
});

function App() {
  return <Navigate to="/projects" />;
}

