import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function RequireRole({ roles = [], children }) {
  const { user, status } = useAuth(); // ensure AuthContext exposes both
  const location = useLocation();

  // While AuthContext is still fetching user data
  if (status === "loading") {
    return <div className="p-6 text-center text-muted-foreground">Loading…</div>;
  }

  // If not logged in at all
  if (!user) {
    // If you use an AuthModal instead of /login route:
    // Option 1 — Redirect to home & trigger modal
    return (
      <Navigate
        to="/"
        state={{ from: location, showAuthModal: true }}
        replace
      />
    );

    // Option 2 — If you prefer silent fallback:
    // return <div className="text-center p-6">You must log in to continue.</div>;
  }

  // Role check
  const userRole = String(user.role || "").toLowerCase();
  const allowed = roles.map((r) => r.toLowerCase());
  if (roles.length && !allowed.includes(userRole)) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Access restricted. You need {roles.join(" or ")} permissions.
      </div>
    );
  }

  return children;
}

