import { useConvexAuth } from "convex/react";
import { Navigate } from "@tanstack/react-router";
import { useLocation } from "@tanstack/react-router";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/sign-in"
        search={{ redirectTo: location.pathname }}
      />
    );
  }

  return <>{children}</>;
}

