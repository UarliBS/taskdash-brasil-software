import { requireUser } from "@/lib/auth";
import { DashboardClient } from "@/components/dashboard-client";

export default async function DashboardPage() {
  const user = await requireUser();

  return <DashboardClient user={user} />;
}
