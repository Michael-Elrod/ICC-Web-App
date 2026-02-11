// AuthProvider.tsx

"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { Providers as ThemeProviders } from "@/app/providers/ThemeProvider";
import { QueryProvider } from "@/app/providers/QueryProvider";

export function AuthProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <ThemeProviders>{children}</ThemeProviders>
      </QueryProvider>
    </SessionProvider>
  );
}
