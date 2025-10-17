import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function RoleDashboardLayout({ title, items }) {
  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 grid grid-cols-12 gap-4">
      <aside className="col-span-12 md:col-span-3">
        <div className="rounded-xl border p-3">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </h2>
          <nav className="flex flex-col">
            {items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-2 text-sm",
                    isActive ? "bg-primary/10 text-primary" : "hover:bg-accent"
                  )
                }
                end={it.exact}
              >
                {it.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      <main className="col-span-12 md:col-span-9">
        <div className="rounded-xl border p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
