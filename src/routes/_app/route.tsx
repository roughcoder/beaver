import { createFileRoute, Navigate, Outlet, useLocation } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import Header from "@/components/Header";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/sign-in"
        search={{ redirectTo: location.pathname }}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1"><Outlet /></main>
    </div>
  );
}

