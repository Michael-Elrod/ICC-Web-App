// app/forgot-password/page.tsx
"use client";

import ForgotPasswordForm from "./_components/ForgotPasswordForm";

export default function ForgotPassword() {
  return (
    <main className="flex justify-center items-center min-h-screen bg-white dark:bg-zinc-900 px-4">
      <ForgotPasswordForm />
    </main>
  );
}