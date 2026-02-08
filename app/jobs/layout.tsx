// layout.tsx

"use client";

import React, { useEffect } from "react";
import NavTabs from "./_components/NavTabs";
import { usePathname } from "next/navigation";
import { NavTab } from "../types/views";

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isJobDetailPage = /^\/jobs\/\d+$/.test(pathname);
  const isNewJobPage = pathname === "/jobs/new";
  const getActiveTab = (path: string) => {
    if (path === "/jobs") return "Overview";
    if (path === "/jobs/active") return "Active";
    if (path === "/jobs/closed") return "Closed";
    return "Overview";
  };

  const [activeTab, setActiveTab] = React.useState(getActiveTab(pathname));

  useEffect(() => {
    setActiveTab(getActiveTab(pathname));
  }, [pathname]);

  const navTabs: NavTab[] = [
    { name: "Overview", href: "/jobs" },
    { name: "Active", href: "/jobs/active" },
    { name: "Closed", href: "/jobs/closed" },
  ];

  return (
    <div className="flex min-h-screen">
      <div className="flex-1">
        {!isJobDetailPage && !isNewJobPage && (
          <header className="sticky top-0 z-10 transition-all bg-white dark:bg-zinc-900">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold mb-3">Jobs</h1>
              <NavTabs
                tabs={navTabs}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            </div>
          </header>
        )}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
