import { Suspense } from "react";
import { PasswordRecoveryPanel } from "@/components/password-recovery-panel";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <PasswordRecoveryPanel mode="confirm" />
    </Suspense>
  );
}
