export const customerNav = [
  { to: "/dashboard/customer", label: "My Shipments Overview", exact: true },
  { to: "/dashboard/customer/notifications", label: "Notifications" },
  { to: "/dashboard/customer/profile", label: "Profile / Settings" },
];

export const agentNav = [
  { to: "/dashboard/agent", label: "Intake Queue", exact: true },
  { to: "/dashboard/agent/scan", label: "Scan / Update Status" },
  { to: "/dashboard/agent/manifests", label: "Manifests" },
  { to: "/dashboard/agent/notifications", label: "Notifications" },
];

export const driverNav = [
  { to: "/dashboard/driver", label: "Assigned Pickups", exact: true },
  { to: "/dashboard/driver/deliveries", label: "Assigned Deliveries" },
  { to: "/dashboard/driver/proof", label: "Proof of Delivery" },
  { to: "/dashboard/driver/notifications", label: "Notifications" },
  { to: "/dashboard/reports", label: "Reports" },
];

export const adminNav = [
  { to: "/dashboard/admin", label: "Shipments Management", exact: true },
  { to: "/dashboard/admin/rates", label: "Rate Management" },
  { to: "/dashboard/admin/branches", label: "Branches / Agents" },
  { to: "/dashboard/admin/users", label: "Users & Roles" },
  { to: "/dashboard/admin/reports", label: "Reports & Analytics" },
  { to: "/dashboard/admin/settings", label: "Settings" },
  { to: "/dashboard/admin/notifications", label: "Notifications" },
];
