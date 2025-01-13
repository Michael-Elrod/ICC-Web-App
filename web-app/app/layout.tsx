"use client"

import { AuthProviders } from './providers/AuthProvider';
import { Work_Sans } from "next/font/google";
import "./globals.css";
import { usePathname } from 'next/navigation';
import SideBar from '../components/util/SideBar';
import DarkModeToggle from '../components/util/DarkModeToggle';

const workSans = Work_Sans({ 
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
  variable: '--font-work-sans',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/';

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${workSans.variable} font-sans min-h-screen bg-white dark:bg-zinc-900 text-black dark:text-white`}>
        <AuthProviders>
          <div className="flex min-h-screen">
            {!isLoginPage && <SideBar />}
            <div className={`flex-1 ${!isLoginPage ? 'ml-12' : ''} p-8`}>
              <DarkModeToggle />
              {children}
            </div>
          </div>
        </AuthProviders>
      </body>
    </html>
  );
}