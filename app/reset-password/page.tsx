// app/reset-password/page.tsx
"use client";

import ResetPasswordForm from "@/components/reset/ResetPasswordForm";

export default function ResetPassword() {
  return (
    <main className="flex justify-center items-center min-h-screen bg-white dark:bg-zinc-900 px-4">
      <ResetPasswordForm />
    </main>
  );
}