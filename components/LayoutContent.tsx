// components/LayoutContent.tsx
'use client';

import { usePathname } from 'next/navigation';
import SideBar from './util/SideBar';
import DarkModeToggle from './util/DarkModeToggle';

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/';

  return (
    <div className="flex min-h-screen">
      {!isLoginPage && <SideBar />}
      <div className={`flex-1 ${!isLoginPage ? 'ml-12' : ''} p-8`}>
        <DarkModeToggle />
        {children}
      </div>
    </div>
  );
}