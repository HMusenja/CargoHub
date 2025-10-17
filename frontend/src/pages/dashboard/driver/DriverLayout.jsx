// src/pages/dashboard/driver/DriverLayout.jsx
import RoleDashboardLayout from "../layouts/RoleDashboardLayout";
import { driverNav } from "../navConfig";
export default function DriverLayout() {
  return <RoleDashboardLayout title="Driver Dashboard" items={driverNav} />;
}