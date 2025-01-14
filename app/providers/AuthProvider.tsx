'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { Providers as ThemeProviders } from '@/app/providers/ThemeProvider';

export function AuthProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <ThemeProviders>{children}</ThemeProviders>
    </SessionProvider>
  );
}