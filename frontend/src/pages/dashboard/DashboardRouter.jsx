import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/**
 * Decides which dashboard to show.
 * Driver note: if you don't have a dedicated "driver" role on User yet,
 * treat drivers as staff with a flag, e.g. user.tags?.includes("driver").
 */
export default function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const role = (user.role || "").toLowerCase();
  const isDriver =
    role === "driver" ||
    (role === "staff" && (user.tags?.includes("driver") || user.meta?.isDriver));

  if (role === "admin") return <Navigate to="/dashboard/admin" replace />;
  if (isDriver) return <Navigate to="/dashboard/driver" replace />;
  if (role === "staff") return <Navigate to="/dashboard/agent" replace />;
  // default customer
  return <Navigate to="/dashboard/customer" replace />;
}
