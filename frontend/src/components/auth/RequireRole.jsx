import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function RequireRole({ roles = [], children }) {
  const { user, status } = useAuth();
  const location = useLocation();
console.log('user in guard:', user)
  // 1) Wait until auth finishes resolving
  if (status === "loading" || status === "idle") {
    return <div className="p-6 text-center text-muted-foreground">Loading…</div>;
  }
  if (status === "authenticated" && !user) {
  return <div className="p-6 text-center text-muted-foreground">Loading user…</div>;
}

  // 2) Not logged in → bounce (your app uses AuthModal on "/")
  if (!user) {
    return (
      <Navigate
        to="/"
        state={{ from: location, showAuthModal: true }}
        replace
      />
    );
  }

  // 3) Normalize server role + support driver-as-staff+tag
  const serverRole = String(user.role || "").toLowerCase();
  const isDriver =
    serverRole === "driver" ||
    (serverRole === "staff" && (user?.tags?.includes("driver") || user?.meta?.isDriver));
  const effectiveRole = isDriver ? "driver" : serverRole;

  // 4) Normalize allowed roles; empty = any authenticated user
  const allowed = roles.map((r) => String(r).toLowerCase());
  const authorized = allowed.length === 0 || allowed.includes(effectiveRole);

  if (!authorized) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Access restricted. You need {roles.join(" or ")} permissions.
        <div className="mt-1 text-xs">Detected role: <code>{serverRole || "unknown"}</code></div>
      </div>
    );
  }

  return children;
}


