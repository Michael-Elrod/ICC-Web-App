// app/jobs/[id]/layout.tsx
"use client";

import React from 'react';

export default function JobDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex-1 w-full">
        <main className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}