import { Routes, Route, Navigate } from "react-router-dom";
import React, { lazy, Suspense } from "react";
import RequireRole from "@/components/auth/RequireRole";
import { DriverProvider } from "@/context/DriverContext";

// Lazy imports for role routers and layouts
const DashboardRouter = lazy(() => import("@/pages/dashboard/DashboardRouter"));

// Layouts
const CustomerLayout = lazy(() => import("@/pages/dashboard/customer/CustomerLayout"));
const AgentLayout    = lazy(() => import("@/pages/dashboard/agent/AgentLayout"));
const DriverLayout   = lazy(() => import("@/pages/dashboard/driver/DriverLayout"));
const AdminLayout    = lazy(() => import("@/pages/dashboard/admin/AdminLayout"));

// Customer pages
const CustomerOverview      = lazy(() => import("@/pages/dashboard/customer/CustomerOverview"));
const CustomerNotifications = lazy(() => import("@/pages/dashboard/customer/CustomerNotifications"));
const CustomerProfile       = lazy(() => import("@/pages/dashboard/customer/CustomerProfile"));

// Agent pages
const AgentIntakeQueue  = lazy(() => import("@/pages/dashboard/agent/AgentIntakeQueue"));
const AgentScanTool     = lazy(() => import("@/pages/dashboard/agent/AgentScanTool"));
const AgentManifests    = lazy(() => import("@/pages/dashboard/agent/AgentManifests"));
const AgentNotifications= lazy(() => import("@/pages/dashboard/agent/AgentNotifications"));

// Driver pages
const DriverPickups      = lazy(() => import("@/pages/dashboard/driver/DriverPickups"));
const DriverDeliveries   = lazy(() => import("@/pages/dashboard/driver/DriverDeliveries"));
const DriverProof        = lazy(() => import("@/pages/dashboard/driver/DriverProof"));
const DriverNotifications= lazy(() => import("@/pages/dashboard/driver/DriverNotifications"));

// Admin pages
const AdminShipments     = lazy(() => import("@/pages/dashboard/admin/AdminShipments"));
const AdminRates         = lazy(() => import("@/pages/dashboard/admin/AdminRates"));
const AdminBranches      = lazy(() => import("@/pages/dashboard/admin/AdminBranches"));
const AdminUsers         = lazy(() => import("@/pages/dashboard/admin/AdminUsers"));
const AdminReports       = lazy(() => import("@/pages/dashboard/admin/AdminReports"));
const AdminSettings      = lazy(() => import("@/pages/dashboard/admin/AdminSettings"));
const AdminNotifications = lazy(() => import("@/pages/dashboard/admin/AdminNotifications"));

// Shared reports page (driver + admin)
const ReportsPage = lazy(() => import("@/pages/reports/ReportsPage"));

export default function DashboardRoutes() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading dashboard…</div>}>
      <Routes>
        <Route path="/" element={<DashboardRouter />} />

        {/* Customer Dashboard */}
        <Route
          path="/customer"
          element={
            <RequireRole roles={["customer", "staff", "admin"]}>
              <CustomerLayout />
            </RequireRole>
          }
        >
          <Route index element={<CustomerOverview />} />
          <Route path="notifications" element={<CustomerNotifications />} />
          <Route path="profile" element={<CustomerProfile />} />
        </Route>

        {/* Agent Dashboard */}
        <Route
          path="/agent"
          element={
            <RequireRole roles={["staff", "admin"]}>
              <AgentLayout />
            </RequireRole>
          }
        >
          <Route index element={<AgentIntakeQueue />} />
          <Route path="scan" element={<AgentScanTool />} />
          <Route path="manifests" element={<AgentManifests />} />
          <Route path="notifications" element={<AgentNotifications />} />
        </Route>

        {/* Driver Dashboard */}
        <Route
          path="/driver"
          element={
            <RequireRole roles={["driver", "staff", "admin"]}>
              <DriverProvider>
                  <DriverLayout />
            </DriverProvider>
            </RequireRole>
          }
        >
          <Route index element={<DriverPickups />} />
          <Route path="deliveries" element={<DriverDeliveries />} />
          <Route path="proof" element={<DriverProof />} />
          <Route path="notifications" element={<DriverNotifications />} />
        </Route>
          {/* Shared Reports (accessible to driver + admin) */}
        <Route
          path="/reports"
          element={
            <RequireRole roles={["driver", "admin"]}>
              <ReportsPage />
            </RequireRole>
          }
        />

        {/* Admin Dashboard */}
        <Route
          path="/admin"
          element={
            <RequireRole roles={["admin"]}>
              <AdminLayout />
            </RequireRole>
          }
        >
          <Route index element={<AdminShipments />} />
          <Route path="rates" element={<AdminRates />} />
          <Route path="branches" element={<AdminBranches />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="notifications" element={<AdminNotifications />} />
        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
