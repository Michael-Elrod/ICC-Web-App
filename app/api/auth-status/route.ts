import { NextResponse } from 'next/server';
import { authOptions } from "@/app/lib/auth";

export async function GET() {
  try {
    // Check auth configuration
    const authCheck = {
      hasProviders: Array.isArray(authOptions?.providers),
      providerCount: authOptions?.providers?.length || 0,
      hasCredentials: !!authOptions?.providers?.find(p => p.id === 'credentials'),
      hasSecret: !!process.env.NEXTAUTH_SECRET,
      hasURL: !!process.env.NEXTAUTH_URL,
      // Database check
      hasDBConfig: {
        host: !!process.env.DB_HOST,
        user: !!process.env.DB_USER,
        database: !!process.env.DB_NAME,
        password: !!process.env.DB_PASSWORD
      }
    };

    return NextResponse.json({
      status: 'Auth configuration check',
      config: authCheck,
      provider: authOptions?.providers[0]?.id || 'none found'
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Auth check failed',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}