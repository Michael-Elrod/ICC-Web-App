"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthForm from "./_components/AuthForm";

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      router.replace("/jobs");
    }
  }, [session, router]);

  return (
    <main className="flex justify-center items-center min-h-screen bg-white dark:bg-zinc-900 px-4">
      <AuthForm />
    </main>
  );
}
