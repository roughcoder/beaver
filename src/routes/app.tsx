import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "../components/RequireAuth";

export const Route = createFileRoute("/app")({
  component: App,
});

function App() {
  return (
    <RequireAuth>
      <div>
        <h1>Protected App</h1>
        <p>You are authenticated and can see this page.</p>
      </div>
    </RequireAuth>
  );
}

