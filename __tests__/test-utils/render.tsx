// render.tsx

import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

// Default mock session for authenticated tests
export const mockSession = {
  user: {
    id: "1",
    name: "Test User",
    email: "test@example.com",
    role: "Admin",
  },
  expires: "2099-01-01",
};

// Mock session for unauthenticated tests
export const mockUnauthenticatedSession = null;

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  session?: typeof mockSession | null;
}

function AllProviders({
  children,
  session = mockSession,
}: {
  children: React.ReactNode;
  session?: typeof mockSession | null;
}) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}

export function renderWithProviders(
  ui: React.ReactElement,
  { session = mockSession, ...options }: CustomRenderOptions = {},
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders session={session}>{children}</AllProviders>
    ),
    ...options,
  });
}

// Re-export everything from testing-library
export * from "@testing-library/react";
export { renderWithProviders as render };
