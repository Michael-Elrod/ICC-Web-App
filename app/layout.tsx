import { AuthProviders } from './providers/AuthProvider';
import { Work_Sans } from "next/font/google";
import "./globals.css";
import LayoutContent from "@/components/util/LayoutContent";

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
  // Move pathname check to a client component
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${workSans.variable} font-sans min-h-screen bg-white dark:bg-zinc-900 text-black dark:text-white`}>
        <AuthProviders>
          <LayoutContent>{children}</LayoutContent>
        </AuthProviders>
      </body>
    </html>
  );
}