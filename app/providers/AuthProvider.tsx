// AuthProvider.tsx

"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { Providers as ThemeProviders } from "@/app/providers/ThemeProvider";

export function AuthProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProviders>{children}</ThemeProviders>
    </SessionProvider>
  );
}
