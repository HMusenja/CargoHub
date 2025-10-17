// src/pages/dashboard/agent/AgentLayout.jsx
import RoleDashboardLayout from "../layouts/RoleDashboardLayout";
import { agentNav } from "../navConfig";
export default function AgentLayout() {
  return <RoleDashboardLayout title="Agent Dashboard" items={agentNav} />;
}