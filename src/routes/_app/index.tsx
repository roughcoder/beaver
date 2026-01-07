import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/")({
  component: App,
});

function App() {
  return (
    <div>
      <h1>Protected App</h1>
      <p>You are authenticated and can see this page.</p>
    </div>
  );
}

