// app/jobs/[id]/layout.tsx
"use client";

import React from "react";

export default function JobDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex-1 w-full">
        <main className="w-full mx-auto py-3 sm:py-6 px-0 sm:px-4 md:px-0">
          <div className="w-full overflow-x-hidden sm:overflow-visible">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
