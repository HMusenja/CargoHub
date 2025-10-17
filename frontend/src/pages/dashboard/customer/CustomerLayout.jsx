// src/pages/dashboard/customer/CustomerLayout.jsx
import RoleDashboardLayout from "../layouts/RoleDashboardLayout";
import { customerNav } from "../navConfig";
export default function CustomerLayout() {
  return <RoleDashboardLayout title="Customer Dashboard" items={customerNav} />;
}

