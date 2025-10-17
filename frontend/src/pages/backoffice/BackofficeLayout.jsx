import { Outlet, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

const tabs = [
  { to: "/backoffice", label: "Board", exact: true },
  { to: "/backoffice/scan", label: "Scan" },
];

export default function BackofficeLayout() {
  const { pathname } = useLocation();

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6">
      <h1 className="text-2xl font-bold tracking-tight">Back-office</h1>
      <p className="text-sm text-muted-foreground">Operations dashboard for agents & admins</p>

      {/* Tabs */}
      <div className="mt-4 flex gap-1 border-b">
        {tabs.map((t) => {
          const isActive = t.exact ? pathname === t.to : pathname.startsWith(t.to);
          return (
            <NavLink
              key={t.to}
              to={t.to}
              className={cn(
                "px-4 py-2 text-sm",
                isActive
                  ? "border-b-2 border-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
              end={Boolean(t.exact)}
            >
              {t.label}
            </NavLink>
          );
        })}
      </div>

      <Card className="mt-4">
        <CardContent className="p-4">
          <Outlet />
        </CardContent>
      </Card>
    </div>
  );
}
