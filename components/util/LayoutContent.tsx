"use client";

import { usePathname } from "next/navigation";
import SideBar from "./SideBar";
import DarkModeToggle from "./DarkModeToggle";

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noSidebarRoutes = pathname === '/' || pathname === '/forgot-password';

  return (
    <div className="min-h-screen relative">
      {!noSidebarRoutes && <SideBar />}
      <div className={`${!noSidebarRoutes ? 'md:ml-12' : ''} p-4 sm:p-8 pb-24 md:pb-8`}>
        <div className="relative w-full mb-4">
          <div className="absolute right-0 top-0 z-50">
            <DarkModeToggle />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}