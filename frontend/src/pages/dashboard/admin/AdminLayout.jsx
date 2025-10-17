// src/pages/dashboard/admin/AdminLayout.jsx
import RoleDashboardLayout from "../layouts/RoleDashboardLayout";
import { adminNav } from "../navConfig";
export default function AdminLayout() {
  return <RoleDashboardLayout title="Admin Dashboard" items={adminNav} />;
}