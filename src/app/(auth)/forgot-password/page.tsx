import { Suspense } from "react";
import { PasswordRecoveryPanel } from "@/components/password-recovery-panel";

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <PasswordRecoveryPanel mode="request" />
    </Suspense>
  );
}
